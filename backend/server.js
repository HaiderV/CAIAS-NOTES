import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import uploadRoutes from "./routes/upload.routes.js";
import cloudinary from "./config/cloudinary.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.post("/api/delete-note-file", async (req, res) => {
  try {
    const { publicId } = req.body;
    if (!publicId) {
      return res.status(400).json({ success: false, message: "publicId is required" });
    }
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "raw",
    });
    res.json({ success: true, result });
  } catch (error) {
    console.error("Cloudinary destroy error:", error);
    res.status(500).json({ success: false, message: "Delete failed" });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.use("/api/upload", uploadRoutes);