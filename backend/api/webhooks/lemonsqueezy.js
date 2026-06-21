// POST /api/webhooks/lemonsqueezy
// Activa o desactiva el plan PRO del usuario al recibir eventos de Lemon Squeezy.
const { query } = require('../../db');

const LS_WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

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
  // El id del usuario (Google sub) se pasa como custom_data en el checkout.
  const uid = event?.meta?.custom_data?.uid;

  if (!uid) {
    res.status(400).json({ error: 'Missing uid in custom_data' });
    return;
  }

  try {
    let newTier = null;
    if (eventName === 'subscription_created' || eventName === 'order_created') {
      newTier = 'pro';
      console.log(`Activated PRO for uid: ${uid}`);
    } else if (eventName === 'subscription_expired' || eventName === 'subscription_cancelled') {
      newTier = 'free';
      console.log(`Deactivated PRO for uid: ${uid}`);
    }

    if (newTier) {
      const { rowCount } = await query('UPDATE users SET tier = $2 WHERE id = $1', [uid, newTier]);
      if (rowCount === 0) { res.status(404).json({ error: 'User not found' }); return; }
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
