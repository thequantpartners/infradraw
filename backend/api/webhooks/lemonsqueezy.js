// POST /api/webhooks/lemonsqueezy
// Activa o desactiva el plan PRO del usuario al recibir eventos de Lemon Squeezy.
const KV_URL   = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const LS_WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

async function redis(cmd) {
  const res = await fetch(KV_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

async function verifySignature(rawBody, signature) {
  if (!LS_WEBHOOK_SECRET) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(LS_WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  const computed = Array.from(new Uint8Array(sigBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  return computed === signature;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  // Read raw body
  const rawBody = JSON.stringify(req.body);
  const signature = req.headers['x-signature'] || '';

  const valid = await verifySignature(rawBody, signature);
  if (!valid) {
    console.error('Invalid Lemon Squeezy webhook signature');
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  const event = req.body;
  const eventName = event?.meta?.event_name;
  // The user's Firebase UID is passed as a custom_data field in the checkout
  const uid = event?.meta?.custom_data?.uid;

  if (!uid) {
    res.status(400).json({ error: 'Missing uid in custom_data' });
    return;
  }

  try {
    const key = `user:${uid}`;
    const raw = await redis(['GET', key]);
    if (!raw) { res.status(404).json({ error: 'User not found' }); return; }

    const profile = JSON.parse(raw);

    if (eventName === 'subscription_created' || eventName === 'order_created') {
      profile.plan = 'pro';
      profile.lsSubscriptionId = event?.data?.id || null;
      profile.lsCustomerId = event?.data?.attributes?.customer_id || null;
      console.log(`Activated PRO for uid: ${uid}`);
    } else if (eventName === 'subscription_expired' || eventName === 'subscription_cancelled') {
      profile.plan = 'free';
      profile.lsSubscriptionId = null;
      console.log(`Deactivated PRO for uid: ${uid}`);
    }

    profile.updatedAt = new Date().toISOString();
    await redis(['SET', key, JSON.stringify(profile)]);
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
