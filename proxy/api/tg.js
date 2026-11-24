// Tiny relay to the Telegram Bot API for the workout bot.
// Cloudflare Workers' shared IPs are rate-limited by Telegram, so the Worker sends its calls here.
// Only tokens of the bots listed below are relayed.
const ALLOWED_BOT_IDS = ['9016788363'];

export default async function handler(req, res) {
  const token = String(req.headers['x-bot-token'] || '');
  const method = String(req.query.method || '');
  if (req.method !== 'POST' || !/^[A-Za-z]{1,40}$/.test(method) || !ALLOWED_BOT_IDS.includes(token.split(':')[0])) {
    res.status(403).json({ ok: false, description: 'forbidden' });
    return;
  }
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(req.body || {})
    });
    const text = await r.text();
    res.status(r.status).setHeader('content-type', 'application/json').send(text);
  } catch (e) {
    res.status(502).json({ ok: false, description: 'relay error: ' + e.message });
  }
}
