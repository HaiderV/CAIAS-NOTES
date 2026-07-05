import "dotenv/config";
import { google } from "googleapis";

const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
);

oAuth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const drive = google.drive({
    version: "v3",
    auth: oAuth2Client,
});

export default drive;