import express from "express";
import multer from "multer";
// import cloudinary from "../config/cloudinary.js";
import { db } from "../config/firebaseAdmin.js";
import admin from "firebase-admin";
import { convertToPdf } from "../utils/converter.js";
// import streamifier from "streamifier";
import {
    uploadToGoogleDrive,
    deleteFromGoogleDrive,
} from "../utils/googleDriveUpload.js";

const router = express.Router();

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 30 * 1024 * 1024,
    },
});

const uploadMiddleware = upload.single("file");

router.post("/", (req, res) => {
    uploadMiddleware(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({
                    success: false,
                    message: "The uploaded file is exceeding the upload criteria of 30MB limit.",
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

        // let publicId = null;
        let googleDriveFileId = null;
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

            const ext = file.originalname.split('.').pop().toLowerCase();
            const fileSizeMB = file.buffer.length / 1024 / 1024;
            if (fileSizeMB > 30) {
                return res.status(400).json({
                    success: false,
                    message: `The uploaded file size (${fileSizeMB.toFixed(2)} MB) exceeds the 30MB limit.`,
                });
            }

            // New google Drive upload (direct storage)
            const result = await uploadToGoogleDrive(
                file.buffer,
                file.originalname,
                file.mimetype
            );

            googleDriveFileId = result.fileId;

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

                storageFileId: result.fileId,

                fileSize: `${fileSizeMB.toFixed(2)} MB`,
                fileName: file.originalname,
                fileExtension: ext,
                mimeType: file.mimetype,
                webViewLink: result.webViewLink || "",
                thumbnailLink: result.thumbnailLink || "",

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
            if (googleDriveFileId) {
                try {
                    await deleteFromGoogleDrive(googleDriveFileId);
                    console.log("Rolled back Google Drive file");
                } catch (rollbackError) {
                    console.error(
                        "Failed to rollback Google Drive file:",
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

router.delete("/notes/:noteId", async (req, res) => {
    try {
        const { noteId } = req.params;

        const noteRef = db.collection("notes").doc(noteId);
        const noteSnap = await noteRef.get();

        if (!noteSnap.exists) {
            return res.status(404).json({
                success: false,
                message: "Note not found",
            });
        }

        const noteData = noteSnap.data();

        // Delete Google Drive file
        if (noteData.storageFileId) {
            await deleteFromGoogleDrive(noteData.storageFileId);
        }

        // Delete ratings subcollection
        const ratingsSnapshot = await noteRef.collection("ratings").get();

        await Promise.all(
            ratingsSnapshot.docs.map((doc) => doc.ref.delete())
        );

        // Delete downloads subcollection
        const downloadsSnapshot = await noteRef.collection("downloads").get();

        await Promise.all(
            downloadsSnapshot.docs.map((doc) => doc.ref.delete())
        );

        // Remove note from every user's arrays
        const usersSnapshot = await db.collection("users").get();

        await Promise.all(
            usersSnapshot.docs.map(async (userDoc) => {
                await userDoc.ref.update({
                    savedNotes: admin.firestore.FieldValue.arrayRemove(noteId),
                    downloadedNotes: admin.firestore.FieldValue.arrayRemove(noteId),
                    uploadedNotes: admin.firestore.FieldValue.arrayRemove(noteId),
                });
            })
        );

        // Delete note document
        await noteRef.delete();

        return res.status(200).json({
            success: true,
            message: "Note deleted successfully.",
        });

    } catch (error) {
        console.error("Delete Note Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to delete note.",
        });
    }
});

export default router;