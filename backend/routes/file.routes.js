import express from "express";
import drive from "../config/googleDrive.js";
import { db } from "../config/firebaseAdmin.js";

const router = express.Router();

router.get("/view/:noteId", async (req, res) => {
    try {
        const noteDoc = await db.collection("notes").doc(req.params.noteId).get();

        if (!noteDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "Note not found",
            });
        }

        const note = noteDoc.data();

        const fileId = note.storageFileId || note.googleDriveFileId;

        const driveResponse = await drive.files.get(
            {
                fileId,
                alt: "media",
            },
            {
                responseType: "stream",
            }
        );

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Cache-Control", "public, max-age=3600");

        driveResponse.data.pipe(res);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to load PDF.",
        });
    }
});

// Download PDF
router.get("/download/:noteId", async (req, res) => {
    try {
        const noteDoc = await db.collection("notes").doc(req.params.noteId).get();

        if (!noteDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "Note not found",
            });
        }

        const note = noteDoc.data();

        const fileId = note.storageFileId || note.googleDriveFileId;

        const driveResponse = await drive.files.get(
            {
                fileId,
                alt: "media",
            },
            {
                responseType: "stream",
            }
        );

        // Force browser download
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${note.fileName}"`
        );

        driveResponse.data.pipe(res);

    } catch (error) {
        console.error("Download Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to download file.",
        });
    }
});

export default router;