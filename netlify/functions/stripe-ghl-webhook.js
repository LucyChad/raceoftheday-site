/**
 * Stripe → GoHighLevel webhook
 *
 * Triggered by Stripe when a new subscription is created.
 * Creates (or updates) a contact in GHL and tags them as a founding member.
 *
 * Environment variables required (set in Netlify > Site configuration > Environment variables):
 *   STRIPE_SECRET_KEY         — Stripe secret key (already set)
 *   STRIPE_GHL_WEBHOOK_SECRET — Signing secret from the new Stripe webhook endpoint
 *   GHL_PRIVATE_TOKEN         — GHL Private Integration Token
 *   GHL_LOCATION_ID           — YxixnsV4G00E8oS5BGnR
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const GHL_API = 'https://services.leadconnectorhq.com';
const GHL_HEADERS = {
  'Authorization': `Bearer ${process.env.GHL_PRIVATE_TOKEN}`,
  'Content-Type': 'application/json',
  'Version': '2021-07-28'
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  // Verify Stripe signature
  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_GHL_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return { statusCode: 400, body: `Webhook error: ${err.message}` };
  }

  // Only handle first payment on a new subscription (not renewals)
  if (stripeEvent.type !== 'invoice.payment_succeeded') {
    return { statusCode: 200, body: JSON.stringify({ received: true, skipped: 'not invoice event' }) };
  }

  const invoice = stripeEvent.data.object;

  if (invoice.billing_reason !== 'subscription_create') {
    return { statusCode: 200, body: JSON.stringify({ received: true, skipped: 'renewal' }) };
  }

  // Get full customer details from Stripe
  const customer = await stripe.customers.retrieve(invoice.customer);

  if (!customer.email) {
    console.error('No email found for customer:', invoice.customer);
    return { statusCode: 200, body: 'No email, skipping' };
  }

  const nameParts = (customer.name || '').trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Determine membership tier from Stripe price/amount
  const amountPaid = invoice.amount_paid; // in pence
  let memberTag = 'founding-member';
  if (amountPaid <= 100) memberTag = 'test-member'; // £1 test

  // Upsert contact in GHL
  const upsertRes = await fetch(`${GHL_API}/contacts/upsert`, {
    method: 'POST',
    headers: {
      ...GHL_HEADERS,
      'locationId': process.env.GHL_LOCATION_ID
    },
    body: JSON.stringify({
      locationId: process.env.GHL_LOCATION_ID,
      email: customer.email,
      firstName,
      lastName,
      phone: customer.phone || undefined,
      tags: [memberTag, 'stripe-subscriber'],
      source: 'stripe-webhook',
      customFields: [
        { key: 'stripe_customer_id', field_value: customer.id },
        { key: 'subscription_id', field_value: invoice.subscription }
      ]
    })
  });

  if (!upsertRes.ok) {
    const errorText = await upsertRes.text();
    console.error('GHL upsert error:', errorText);
    return { statusCode: 500, body: 'Failed to upsert GHL contact' };
  }

  const upsertData = await upsertRes.json();
  const contactId = upsertData.contact?.id;

  console.log(`GHL contact created/updated: ${customer.email} (${contactId}) — tagged: ${memberTag}`);

  // TODO: Once GHL workflows are set up, this contact creation
  // will automatically trigger the welcome email workflow in GHL.
  // No further API call needed — GHL handles it via workflow trigger.

  return { statusCode: 200, body: JSON.stringify({ received: true, contactId }) };
};
