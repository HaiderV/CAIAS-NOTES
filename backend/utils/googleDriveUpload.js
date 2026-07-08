import drive from "../config/googleDrive.js";
import { Readable } from "stream";

const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

export async function uploadToGoogleDrive(
    fileBuffer,
    fileName,
    mimeType = "application/pdf"
) {
    const stream = Readable.from(fileBuffer);

    // Upload the file
    const response = await drive.files.create({
        requestBody: {
            name: fileName,
            parents: [FOLDER_ID],
        },
        media: {
            mimeType,
            body: stream,
        },
        fields: "id,name,thumbnailLink,webViewLink",
    });

    const fileId = response.data.id;

    // Make the file public
    await drive.permissions.create({
        fileId,
        requestBody: {
            role: "reader",
            type: "anyone",
        },
    });

    // Direct download URL
    const fileUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    return {
        fileId,
        fileName: response.data.name,
        fileUrl,
        thumbnailLink: response.data.thumbnailLink,
        webViewLink: response.data.webViewLink,
    };
}

export async function deleteFromGoogleDrive(fileId) {
    try {
        await drive.files.delete({
            fileId,
        });
        console.log(`Deleted file from Google Drive: ${fileId}`);
    } catch (error) {
        // If file not found (404), it's already deleted, so we can ignore
        if (error.code !== 404) {
            console.error(`Failed to delete from Google Drive: ${fileId}`, error);
        }
    }
}
