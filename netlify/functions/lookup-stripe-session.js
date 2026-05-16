const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const sessionId = event.queryStringParameters && event.queryStringParameters.session_id;
  if (!sessionId || !sessionId.startsWith('cs_')) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'invalid session_id' }) };
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        email: (session.customer_details && session.customer_details.email) || session.customer_email || null,
        amount_total: session.amount_total,
        currency: session.currency
      })
    };
  } catch (err) {
    console.error('stripe session lookup failed:', err.message);
    return { statusCode: 404, headers, body: JSON.stringify({ error: 'not found' }) };
  }
};
