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

        res.setHeader("Content-Type", note.mimeType || "application/pdf");
        res.setHeader("Cache-Control", "public, max-age=3600");

        driveResponse.data.pipe(res);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to load file.",
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

        res.setHeader("Content-Type", note.mimeType || "application/pdf");
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

const thumbnailCache = new Map();

// Dynamic thumbnail fetch with caching and proxying to prevent 429s
router.get("/thumbnail/:noteId", async (req, res) => {
    try {
        const { noteId } = req.params;

        // Check cache first
        const cached = thumbnailCache.get(noteId);
        if (cached && cached.expiresAt > Date.now()) {
            res.setHeader("Content-Type", cached.mimeType);
            res.setHeader("Cache-Control", "public, max-age=86400"); // Cache in browser for 1 day
            return res.send(cached.buffer);
        }

        const noteDoc = await db.collection("notes").doc(noteId).get();

        if (!noteDoc.exists) {
            return res.status(404).send("Not found");
        }

        const note = noteDoc.data();
        const fileId = note.storageFileId || note.googleDriveFileId;

        if (!fileId) {
            return res.status(404).send("No storage file ID found");
        }

        // Try to fetch high-resolution (1000px width) thumbnail from public Drive endpoint
        let thumbnailLink = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
        let imgResponse = await fetch(thumbnailLink);

        if (!imgResponse.ok) {
            // Fallback to standard Drive API thumbnail link (often 220px)
            const driveResponse = await drive.files.get({
                fileId,
                fields: "thumbnailLink",
            });
            const apiThumbnail = driveResponse.data.thumbnailLink;
            if (apiThumbnail) {
                imgResponse = await fetch(apiThumbnail);
            }
        }

        if (!imgResponse || !imgResponse.ok) {
            return res.redirect("https://api.dicebear.com/7.x/initials/svg?seed=Notes");
        }

        const arrayBuffer = await imgResponse.arrayBuffer();
        const imageBuffer = Buffer.from(arrayBuffer);
        const mimeType = imgResponse.headers.get("content-type") || "image/jpeg";

        // Store in cache for 1 hour
        thumbnailCache.set(noteId, {
            buffer: imageBuffer,
            mimeType,
            expiresAt: Date.now() + 3600000,
        });

        res.setHeader("Content-Type", mimeType);
        res.setHeader("Cache-Control", "public, max-age=86400"); // Cache in browser for 1 day
        res.send(imageBuffer);

    } catch (error) {
        console.error("Thumbnail fetch failed:", error);
        res.redirect("https://api.dicebear.com/7.x/initials/svg?seed=Notes");
    }
});

export default router;