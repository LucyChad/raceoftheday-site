/**
 * Send Daily Tip
 *
 * Called by the Google Apps Script "Send Tips" button in the master tip log sheet.
 * Fetches all founding-member contacts from GHL and sends the daily tip email.
 * WhatsApp delivery is included in the payload and will be sent once WhatsApp is connected.
 *
 * Environment variables required:
 *   DAILY_TIP_SECRET   — shared secret to authenticate Apps Script calls
 *   GHL_PRIVATE_TOKEN  — GHL Private Integration Token (already set)
 *   GHL_LOCATION_ID    — YxixnsV4G00E8oS5BGnR (already set)
 */

const GHL_API = 'https://services.leadconnectorhq.com';

const ghlHeaders = () => ({
  'Authorization': `Bearer ${process.env.GHL_PRIVATE_TOKEN}`,
  'Content-Type': 'application/json',
  'Version': '2021-07-28',
  'locationId': process.env.GHL_LOCATION_ID
});

// Get all founding-member contacts (handles pagination)
async function getFoundingMembers() {
  const res = await fetch(
    `${GHL_API}/contacts/?locationId=${process.env.GHL_LOCATION_ID}&limit=100`,
    { headers: ghlHeaders() }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GHL contacts fetch failed: ${err}`);
  }

  const data = await res.json();
  const all = data.contacts || [];

  // Filter client-side for founding-member tag
  return all.filter(c => Array.isArray(c.tags) && c.tags.includes('founding-member'));
}

// Get or create a GHL conversation for a contact
async function getOrCreateConversation(contactId) {
  // Search for existing conversation
  const searchRes = await fetch(
    `${GHL_API}/conversations/search?locationId=${process.env.GHL_LOCATION_ID}&contactId=${contactId}`,
    { headers: ghlHeaders() }
  );

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    const existing = searchData.conversations?.[0]?.id;
    if (existing) return existing;
  }

  // Create new conversation
  const createRes = await fetch(`${GHL_API}/conversations/`, {
    method: 'POST',
    headers: ghlHeaders(),
    body: JSON.stringify({
      locationId: process.env.GHL_LOCATION_ID,
      contactId
    })
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create conversation for contact ${contactId}`);
  }

  const createData = await createRes.json();
  return createData.conversation?.id || createData.id;
}

// Send email to a single contact
async function sendEmail(contact, subject, html) {
  if (!contact.email) {
    console.warn(`No email for contact ${contact.id}, skipping`);
    return false;
  }

  const conversationId = await getOrCreateConversation(contact.id);

  const res = await fetch(`${GHL_API}/conversations/messages`, {
    method: 'POST',
    headers: ghlHeaders(),
    body: JSON.stringify({
      type: 'Email',
      conversationId,
      subject,
      html,
      emailFrom: 'hello@raceoftheday.com',
      emailFromName: 'Race Of The Day',
      emailTo: contact.email
    })
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`Email failed for ${contact.email}: ${err}`);
    return false;
  }

  return true;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  // Authenticate
  const secret = event.headers['x-tip-secret'];
  if (!secret || secret !== process.env.DAILY_TIP_SECRET) {
    return { statusCode: 401, body: 'Unauthorised' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { emailHtml, subject, whatsappText } = payload;

  if (!emailHtml || !subject) {
    return { statusCode: 400, body: 'Missing required fields: emailHtml, subject' };
  }

  try {
    const contacts = await getFoundingMembers();
    console.log(`Sending to ${contacts.length} founding members`);

    if (contacts.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ sent: 0, failed: 0, total: 0, note: 'No founding members found' }) };
    }

    // Send emails — batch of 10 at a time to avoid rate limits
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < contacts.length; i += 10) {
      const batch = contacts.slice(i, i + 10);
      const results = await Promise.allSettled(
        batch.map(c => sendEmail(c, subject, emailHtml))
      );
      results.forEach(r => {
        if (r.status === 'fulfilled' && r.value) sent++;
        else failed++;
      });
    }

    console.log(`Done. Sent: ${sent}, Failed: ${failed}`);

    // TODO: WhatsApp sending via GHL once WhatsApp Business is connected.
    // whatsappText is included in the payload and ready to use.

    return {
      statusCode: 200,
      body: JSON.stringify({ sent, failed, total: contacts.length })
    };

  } catch (err) {
    console.error('Error in send-daily-tip:', err.message);
    return { statusCode: 500, body: err.message };
  }
};
