const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return { statusCode: 400, body: `Webhook error: ${err.message}` };
  }

  if (stripeEvent.type === 'invoice.payment_succeeded') {
    const invoice = stripeEvent.data.object;

    // Only trigger on first payment (subscription creation), not renewals
    if (invoice.billing_reason !== 'subscription_create') {
      return { statusCode: 200, body: JSON.stringify({ received: true, skipped: 'renewal' }) };
    }

    const customer = await stripe.customers.retrieve(invoice.customer);

    if (!customer.email) {
      console.error('No email found for customer:', invoice.customer);
      return { statusCode: 200, body: 'No email found, skipping' };
    }

    const firstName = customer.name ? customer.name.split(' ')[0] : '';

    const kitResponse = await fetch(
      `https://api.convertkit.com/v3/tags/${process.env.KIT_TAG_ID}/subscribe`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_secret: process.env.KIT_API_SECRET,
          email: customer.email,
          first_name: firstName
        })
      }
    );

    if (!kitResponse.ok) {
      const errorText = await kitResponse.text();
      console.error('Kit API error:', errorText);
      return { statusCode: 500, body: 'Failed to add subscriber to Kit' };
    }

    console.log(`Added ${customer.email} to Kit with member tag`);
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
