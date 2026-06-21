import express from "express";
import { google } from "googleapis";
import open from "open";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = 4001;

// === Replace with your own credentials from Google Cloud Console ===
const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  "http://localhost:4001/oauth2callback"
);

// Ask Gmail permission to send emails
const scopes = ["https://mail.google.com/"];

// Step 1: Generate URL and open browser
const url = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: scopes,
});

console.log("Authorize this app by visiting this URL:", url);
open(url);

// Step 2: Handle the redirect
app.get("/oauth2callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.send("No code found in URL");
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    console.log("✅ Access Token:", tokens.access_token);
    console.log("🔁 Refresh Token:", tokens.refresh_token);

    res.send("Tokens received! Check your terminal.");
  } catch (error) {
    console.error("Error retrieving access token:", error);
    res.send("Error retrieving tokens");
  }
});

app.listen(port, () => {
  console.log(`OAuth app running on http://localhost:${port}`);
});
