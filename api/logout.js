const crypto = require('crypto');
const { sign } = require('../lib/session');

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const password = body.password || '';
    const expected = process.env.DASHBOARD_PASSWORD || '';

    const a = Buffer.from(password);
    const b = Buffer.from(expected);
    const ok = expected.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);

    if (!ok) return res.status(401).json({ error: 'Wrong password' });

    const token = sign({ exp: Date.now() + 1000 * 60 * 60 * 12 }, process.env.SESSION_SECRET);
    res.setHeader('Set-Cookie', `session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=43200`);
    res.status(200).json({ ok: true });
};
