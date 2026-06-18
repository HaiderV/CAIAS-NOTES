import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import mammoth from 'mammoth';
import AdmZip from 'adm-zip';
import sharp from 'sharp';

// Helper: Wrap text to fit within a maximum width on a page
function wrapText(text, maxW, font, fontSize) {
  const paragraphs = text.split('\n');
  const lines = [];

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      lines.push('');
      continue;
    }

    const words = paragraph.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth > maxW) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  }
  return lines;
}

// Convert text string into a formatted PDF buffer
export async function convertTextToPdf(textTitle, rawText) {

  rawText = rawText
    .replace(/\t/g, '    ')      // tabs -> spaces
    .replace(/\r/g, '')
    .replace(/\u00A0/g, ' ')     // non-breaking spaces
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '');

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageW = 595.276; // A4 Width
  const pageH = 841.89;  // A4 Height
  const margin = 50;
  const contentW = pageW - margin * 2;

  let page = pdfDoc.addPage([pageW, pageH]);
  let y = pageH - margin;

  // Draw Document Title
  page.drawText(textTitle, {
    x: margin,
    y: y - 10,
    size: 18,
    font: fontBold,
    color: rgb(0.31, 0.27, 0.9), // Indigo
  });
  y -= 40;

  // Subtitle info
  page.drawText("Converted to PDF via CAIAS Notes", {
    x: margin,
    y: y - 5,
    size: 9,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Top header horizontal rule
  page.drawLine({
    start: { x: margin, y: y - 15 },
    end: { x: pageW - margin, y: y - 15 },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });
  y -= 35;

  const fontSize = 11;
  const lineHeight = 16;

  const lines = wrapText(rawText, contentW, font, fontSize);

  for (const line of lines) {
    if (y - lineHeight < margin) {
      page = pdfDoc.addPage([pageW, pageH]);
      page.drawLine({
        start: { x: margin, y: pageH - 30 },
        end: { x: pageW - margin, y: pageH - 30 },
        thickness: 0.25,
        color: rgb(0.8, 0.8, 0.8),
      });
      y = pageH - 50;
    }

    if (line !== '') {
      page.drawText(line, {
        x: margin,
        y,
        size: fontSize,
        font: font,
        color: rgb(0.15, 0.15, 0.15),
      });
    }
    y -= lineHeight;
  }

  return Buffer.from(await pdfDoc.save());
}

// Convert image files (.jpg, .png, .webp, .gif) into a PDF page
export async function convertImageToPdf(imageBuffer, mimeType) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.276, 841.89]); // A4 Page
  const { width: pageW, height: pageH } = page.getSize();

  let img;
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    img = await pdfDoc.embedJpg(imageBuffer);
  } else {
    // WebP, PNG, GIF: convert to a compatible PNG buffer using sharp
    const pngBuffer = await sharp(imageBuffer).png().toBuffer();
    img = await pdfDoc.embedPng(pngBuffer);
  }

  const margin = 50;
  const maxW = pageW - margin * 2;
  const maxH = pageH - margin * 2;

  const scale = Math.min(maxW / img.width, maxH / img.height, 1);
  const imgW = img.width * scale;
  const imgH = img.height * scale;

  const x = (pageW - imgW) / 2;
  const y = (pageH - imgH) / 2;

  page.drawImage(img, {
    x,
    y,
    width: imgW,
    height: imgH,
  });

  return Buffer.from(await pdfDoc.save());
}

// Extract texts outline from pptx zipped XML files
function extractTextFromPptx(fileBuffer) {
  let text = "";
  try {
    const zip = new AdmZip(fileBuffer);
    const zipEntries = zip.getEntries();

    const slideEntries = zipEntries
      .filter(entry => entry.entryName.startsWith("ppt/slides/slide") && entry.entryName.endsWith(".xml"))
      .sort((a, b) => {
        const numA = parseInt(a.entryName.match(/\d+/)[0]);
        const numB = parseInt(b.entryName.match(/\d+/)[0]);
        return numA - numB;
      });

    for (const entry of slideEntries) {
      const slideNum = entry.entryName.match(/\d+/)[0];
      text += `\n--- Slide ${slideNum} ---\n\n`;

      const xml = entry.getData().toString("utf-8");
      const textMatches = xml.match(/<a:t>([^<]*)<\/a:t>/g);
      if (textMatches) {
        for (const match of textMatches) {
          const content = match.replace(/<\/?a:t>/g, "").trim();
          if (content) {
            text += `${content}\n`;
          }
        }
      }
    }
  } catch (err) {
    console.error("PPTX outline extraction failed:", err);
    text = "Failed to extract presentation slides outline.";
  }
  return text;
}

// Main function: Convert document buffers to PDF
export async function convertToPdf(fileBuffer, originalName, mimeType) {
  const ext = originalName.split('.').pop().toLowerCase();

  if (ext === 'pdf') {
    return fileBuffer;
  }

  if (ext === 'txt') {
    const rawText = fileBuffer.toString('utf-8');
    return await convertTextToPdf(originalName, rawText);
  }

  if (ext === 'docx') {
    const { value: rawText } = await mammoth.extractRawText({
      buffer: fileBuffer,
    });

    return await convertTextToPdf(originalName, rawText);
  }

  if (ext === 'pptx') {
    const rawText = extractTextFromPptx(fileBuffer);
    return await convertTextToPdf(originalName, rawText);
  }

  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
    return await convertImageToPdf(fileBuffer, mimeType);
  }

  throw new Error(`Unsupported document extension for conversion: .${ext}`);
}
