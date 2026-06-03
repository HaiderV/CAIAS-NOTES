import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import { db } from "../config/firebaseAdmin.js";
import admin from "firebase-admin";

const router = express.Router();

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
});

router.post("/", upload.single("file"), async (req, res) => {
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

        const base64 = Buffer.from(file.buffer).toString("base64");

        const dataURI = `data:${file.mimetype};base64,${base64}`;

        // Upload to Cloudinary
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

            fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
            fileName: file.originalname,

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
            message: "Upload failed",
        });
    }
});

export default router;