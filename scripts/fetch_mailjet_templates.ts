
const Mailjet = require('node-mailjet');

const API_KEY = '6c5afba9421a25308809ce27ee20a7df';
const SECRET_KEY = '46413525c090257962796ac7c3e2ef46';

const mailjet = Mailjet.apiConnect(API_KEY, SECRET_KEY);

async function fetchTemplates() {
    // 1. Fetch Campaigns (Legacy or new)
    console.log("\nFetching Campaigns (Limit 100)...");
    const campaignRequest = mailjet
        .get("campaign", { version: 'v3' })
        .request({ Limit: 100, ShowTemplateID: true });

    try {
        const response = await campaignRequest;
        const campaigns = response.body.Data;
        console.log(`Found ${campaigns.length} campaigns.`);
        campaigns.forEach((c: any) => {
            console.log(`- Subject: ${c.Subject} | ID: ${c.ID} | TemplateID: ${c.TemplateID || 'N/A'}`);
        });
    } catch (e: any) {
        console.log("Error fetching campaigns:", e.message);
    }

    // 2. Fetch Newsletters (Often used for campaigns)
    console.log("\nFetching Newsletters (Limit 100)...");
    const newsletterRequest = mailjet
        .get("newsletter", { version: 'v3' })
        .request({ Limit: 100 });

    try {
        const response = await newsletterRequest;
        const newsletters = response.body.Data;
        console.log(`Found ${newsletters.length} newsletters.`);
        newsletters.forEach((n: any) => {
            console.log(`- Subject: ${n.Subject} | ID: ${n.ID} | Status: ${n.Status}`);
        });
    } catch (e: any) {
        console.log("Error fetching newsletters:", e.message);
    }

    // 3. Fetch Templates (OwnerType=user)
    console.log("\nFetching Templates (OwnerType=user)...");
    const templateRequest = mailjet
        .get("template", { version: 'v3' })
        .request({ Limit: 100, OwnerType: 'user' });

    try {
        const response = await templateRequest;
        const templates = response.body.Data;

        console.log(`Found ${templates.length} templates.`);
        templates.forEach((t: any) => {
            console.log(`- Name: ${t.Name} | ID: ${t.ID} | Purpose: ${t.Purpose || 'N/A'} | OwnerType: ${t.OwnerType} | Description: ${t.Description}`);
        });

    } catch (e: any) {
        console.log("Error fetching templates:", e.message);
    }
}

fetchTemplates();
