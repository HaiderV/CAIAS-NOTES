import "dotenv/config";
import { google } from "googleapis";
import path from "path";
import fs from "fs";

let auth;

// 1. Check if individual Service Account variables are provided (Exact same pattern as Firebase Admin - Best for Render)
if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    try {
        const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n");
        auth = new google.auth.JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: privateKey,
            scopes: ["https://www.googleapis.com/auth/drive"],
        });
    } catch (err) {
        console.error("Failed to initialize Google Drive JWT from individual env vars:", err);
    }
}

// 2. Check if whole JSON is passed in env (GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_SERVICE_ACCOUNT_BASE64)
if (!auth && process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
        let raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY.trim();
        if (!raw.startsWith("{") && !raw.startsWith("\"")) {
            raw = Buffer.from(raw, "base64").toString("utf-8");
        }
        const credentials = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (credentials.private_key) {
            credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
        }
        auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ["https://www.googleapis.com/auth/drive"],
        });
    } catch (err) {
        console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY from env:", err);
    }
}

// 3. Check local service account key file (keys/service-account.json)
if (!auth) {
    const keyFilePath = path.resolve("./keys/service-account.json");
    if (fs.existsSync(keyFilePath)) {
        auth = new google.auth.GoogleAuth({
            keyFile: keyFilePath,
            scopes: ["https://www.googleapis.com/auth/drive"],
        });
    } else {
        console.warn("⚠️ No Service Account credentials found. Falling back to OAuth2 refresh token.");
        const oAuth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );
        oAuth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
        });
        auth = oAuth2Client;
    }
}

const drive = google.drive({
    version: "v3",
    auth,
});

export default drive;