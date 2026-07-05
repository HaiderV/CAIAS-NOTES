import { google } from "googleapis";
import readline from "readline";
import fs from "fs";

const credentials = JSON.parse(
    fs.readFileSync("./keys/oauth-client.json", "utf8")
);

const { client_id, client_secret, redirect_uris } = credentials.web;

const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
);

const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/drive"],
    prompt: "consent",
});

console.log("\nOpen this URL in your browser:\n");
console.log(authUrl);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.question("\nPaste the code here: ", async (code) => {
    const { tokens } = await oAuth2Client.getToken(code);

    console.log("\nRefresh Token:\n");
    console.log(tokens.refresh_token);

    rl.close();
});