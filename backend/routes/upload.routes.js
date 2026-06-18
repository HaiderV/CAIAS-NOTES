import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import { db } from "../config/firebaseAdmin.js";
import admin from "firebase-admin";
import { convertToPdf } from "../utils/converter.js";

const router = express.Router();

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
});

const uploadMiddleware = upload.single("file");

router.post("/", (req, res) => {
    uploadMiddleware(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({
                    success: false,
                    message: "The uploaded file is exceeding the upload criteria of 10MB limit.",
                });
            }
            return res.status(400).json({
                success: false,
                message: err.message,
            });
        } else if (err) {
            return res.status(500).json({
                success: false,
                message: err.message || "An error occurred during file parsing.",
            });
        }

        let publicId = null;
        let docRef = null;

        try {
            const {
                title,
                subject,
                course,
                semester,
                description,
                noteType,
                uploadedBy,
            } = req.body;

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "No file uploaded",
                });
            }

            const file = req.file;

            // Convert file to PDF if it's docx, pptx, image, or text
            let pdfBuffer;
            let finalName = file.originalname;
            let finalMimetype = file.mimetype;

            try {
                pdfBuffer = await convertToPdf(file.buffer, file.originalname, file.mimetype);

                // If converted, rename the original extension to .pdf
                const ext = file.originalname.split('.').pop().toLowerCase();
                if (ext !== 'pdf') {
                    finalName = file.originalname.substring(0, file.originalname.lastIndexOf('.')) + '.pdf';
                    finalMimetype = 'application/pdf';
                }
            } catch (convErr) {
                console.error("Conversion Error:", convErr);
                return res.status(400).json({
                    success: false,
                    message: convErr.message || "Document conversion failed.",
                });
            }

            // Create base64 DataURI for the PDF buffer
            const base64 = pdfBuffer.toString("base64");
            const dataURI = `data:${finalMimetype};base64,${base64}`;

            // Upload to Cloudinary as raw file type
            const result = await cloudinary.uploader.upload(dataURI, {
                resource_type: "raw",
                folder: "notes",
            });

            publicId = result.public_id;

            // Create document reference first so we know the ID
            docRef = db.collection("notes").doc();

            const noteData = {
                noteId: docRef.id,

                title,
                subject,
                course,
                semester: Number(semester),
                description,
                noteType,

                fileUrl: result.secure_url,
                publicId: result.public_id,

                fileSize: `${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`,
                fileName: finalName,

                uploadedBy,

                downloadCount: 0,
                savedCount: 0,

                ratingSum: 0,
                ratingCount: 0,

                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            // Create note document
            await docRef.set(noteData);

            // Update user uploadedNotes
            await db.collection("users").doc(uploadedBy).update({
                uploadedNotes: admin.firestore.FieldValue.arrayUnion(docRef.id),
            });

            return res.status(200).json({
                success: true,
                noteId: docRef.id,
                note: noteData,
            });

        } catch (error) {
            console.error("Upload failed:", error);

            // Rollback Firestore note
            if (docRef) {
                try {
                    await docRef.delete();
                    console.log("Rolled back Firestore note");
                } catch (rollbackError) {
                    console.error(
                        "Failed to rollback Firestore note:",
                        rollbackError
                    );
                }
            }

            // Rollback Cloudinary file
            if (publicId) {
                try {
                    await cloudinary.uploader.destroy(publicId, {
                        resource_type: "raw",
                    });
                    console.log("Rolled back Cloudinary file");
                } catch (rollbackError) {
                    console.error(
                        "Failed to rollback Cloudinary file:",
                        rollbackError
                    );
                }
            }

            return res.status(500).json({
                success: false,
                message: error.message || "Upload failed",
            });
        }
    });
});

export default router;