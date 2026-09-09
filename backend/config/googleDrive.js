import "dotenv/config";
import { google } from "googleapis";
import path from "path";
import fs from "fs";

let auth;

// 1. Check if Service Account JSON is provided in environment variables (for production / cloud hosting)
if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ["https://www.googleapis.com/auth/drive"],
        });
    } catch (err) {
        console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY from env:", err);
    }
}

// 2. Check local service account key file
if (!auth) {
    const keyFilePath = path.resolve("./keys/service-account.json");
    if (fs.existsSync(keyFilePath)) {
        auth = new google.auth.GoogleAuth({
            keyFile: keyFilePath,
            scopes: ["https://www.googleapis.com/auth/drive"],
        });
    } else {
        // Fallback to OAuth2 credentials if service account key is missing
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