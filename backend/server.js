import "dotenv/config";
import express from "express";
import cors from "cors";
import uploadRoutes from "./routes/upload.routes.js";
// import cloudinary from "./config/cloudinary.js";
import { db } from "./config/firebaseAdmin.js";
import admin from "firebase-admin";
import fileRoutes from "./routes/file.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/files", fileRoutes);

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.use("/api/upload", uploadRoutes);

app.get("/api/notes/counts", async (req, res) => {
  try {
    const [bcaSnap, bbaSnap, bcomSnap, bscSnap] = await Promise.all([
      db.collection("notes").where("course", "==", "BCA").count().get(),
      db.collection("notes").where("course", "==", "BBA").count().get(),
      db.collection("notes").where("course", "==", "BCOM").count().get(),
      db.collection("notes").where("course", "==", "BSC").count().get(),
    ]);

    const counts = {
      BCA: bcaSnap.data().count,
      BBA: bbaSnap.data().count,
      BCOM: bcomSnap.data().count,
      BSC: bscSnap.data().count,
    };

    res.json({ success: true, counts });
  } catch (error) {
    console.error("Error fetching material counts:", error);
    res.status(500).json({ success: false, message: "Error fetching material counts" });
  }
});

// app.post("/api/delete-note-file", async (req, res) => {
//   try {
//     const { publicId } = req.body;
//     if (!publicId) {
//       return res.status(400).json({ success: false, message: "publicId is required" });
//     }
//     const result = await cloudinary.uploader.destroy(publicId, {
//       resource_type: "raw",
//     });
//     res.json({ success: true, result });
//   } catch (error) {
//     console.error("Cloudinary destroy error:", error);
//     res.status(500).json({ success: false, message: "Delete failed" });
//   }
// });

// Increment download count and optional user download tracking
app.post("/api/notes/:noteId/download", async (req, res) => {
  try {
    const { noteId } = req.params;
    const { userId } = req.body;

    const noteRef = db.collection("notes").doc(noteId);

    await db.runTransaction(async (transaction) => {
      const noteDoc = await transaction.get(noteRef);
      if (!noteDoc.exists) {
        throw new Error("Note not found");
      }

      transaction.update(noteRef, {
        downloadCount: (noteDoc.data().downloadCount || 0) + 1,
      });

      if (userId) {
        const downloadRef = noteRef.collection("downloads").doc(userId);
        transaction.set(downloadRef, {
          userId,
          downloadedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        const userRef = db.collection("users").doc(userId);
        transaction.set(
          userRef,
          {
            downloadedNotes: admin.firestore.FieldValue.arrayUnion(noteId),
          },
          { merge: true }
        );
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Download increment failed:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
});

// Submit rating
app.post("/api/notes/:noteId/rate", async (req, res) => {
  try {
    const { noteId } = req.params;
    const { userId, rating } = req.body;

    if (!userId || !rating) {
      return res.status(400).json({ success: false, message: "Missing userId or rating" });
    }

    const noteRef = db.collection("notes").doc(noteId);
    const ratingRef = noteRef.collection("ratings").doc(userId);

    await db.runTransaction(async (transaction) => {
      const existingRating = await transaction.get(ratingRef);
      if (existingRating.exists) {
        throw new Error("You have already rated this note.");
      }

      const noteDoc = await transaction.get(noteRef);
      if (!noteDoc.exists) {
        throw new Error("Note not found.");
      }

      transaction.update(noteRef, {
        ratingSum: (noteDoc.data().ratingSum || 0) + Number(rating),
        ratingCount: (noteDoc.data().ratingCount || 0) + 1,
      });

      transaction.set(ratingRef, {
        rating: Number(rating),
        userId,
        ratedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Submit rating failed:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
});

// Check if user has rated a note
app.get("/api/notes/:noteId/ratings/:userId", async (req, res) => {
  try {
    const { noteId, userId } = req.params;

    const ratingRef = db.collection("notes").doc(noteId).collection("ratings").doc(userId);
    const ratingDoc = await ratingRef.get();

    if (ratingDoc.exists) {
      res.json({ success: true, hasRated: true, rating: ratingDoc.data().rating });
    } else {
      res.json({ success: true, hasRated: false });
    }
  } catch (error) {
    console.error("Check rating status failed:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});