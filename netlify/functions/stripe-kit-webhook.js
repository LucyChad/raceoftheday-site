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

      if (invoice.billing_reason !== 'subscription_create') {
              return { statusCode: 200, body: JSON.stringify({ received: true, skipped: 'renewal' }) };
      }

      const customer = await stripe.customers.retrieve(invoice.customer);

      if (!customer.email) {
              console.error('No email found for customer:', invoice.customer);
              return { statusCode: 200, body: 'No email found, skipping' };
      }

      const firstName = customer.name ? customer.name.split(' ')[0] : '';

      // Add Member tag
      const kitTagResponse = await fetch(
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

      if (!kitTagResponse.ok) {
              const errorText = await kitTagResponse.text();
              console.error('Kit tag API error:', errorText);
              return { statusCode: 500, body: 'Failed to add subscriber to Kit' };
      }

      // Enrol in welcome sequence (ID: 2749102) to trigger welcome email
      const kitSequenceResponse = await fetch(
              'https://api.convertkit.com/v3/sequences/2749102/subscribe',
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

      if (!kitSequenceResponse.ok) {
              const errorText = await kitSequenceResponse.text();
              console.error('Kit sequence API error:', errorText);
      }

      console.log(`Added ${customer.email} to Kit - Member tag + welcome sequence`);
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
