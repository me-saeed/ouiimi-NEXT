
// Try to load dotenv, ignore if missing
try {
    require('dotenv').config();
} catch (e) {
    // console.log("dotenv not found or error loading");
}

const Mailjet = require("node-mailjet");

async function listTemplates() {
    const apiKey = process.env.MAILJET_API_KEY;
    const secretKey = process.env.MAILJET_SECRET_KEY;

    if (!apiKey || !secretKey) {
        console.error("Error: MAILJET_API_KEY or MAILJET_SECRET_KEY not found in environment.");
        return;
    }

    const mailjet = Mailjet.Client.apiConnect(apiKey, secretKey);

    try {
        const result = await mailjet.get("template", { version: "v3" }).request({ Offset: 0, Limit: 100 });
        console.log("Successfully retrieved templates:");
        const templates = result.body.Data || [];

        if (templates.length === 0) {
            console.log("No templates found.");
        } else {
            templates.forEach((t: any) => {
                console.log(`- Name: "${t.Name}", ID: ${t.ID}, Subject: "${t.Subject || 'N/A'}"`);
            });
        }
    } catch (err: any) {
        console.error("Error retrieving templates:", err.message || err);
    }
}

listTemplates();
