const { sign } = require('../lib/session');

module.exports = async (req, res) => {
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
        const { password } = body;

        // Uses DASHBOARD_PASSWORD as specified in README.md
        const expectedPassword = process.env.DASHBOARD_PASSWORD;

        if (!password || password !== expectedPassword) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        if (!process.env.SESSION_SECRET) {
            return res.status(500).json({ error: 'Missing SESSION_SECRET in Vercel settings' });
        }

        // Create authenticated token
        const token = sign({ authenticated: true }, process.env.SESSION_SECRET);

        // Set session cookie
        res.setHeader('Set-Cookie', `session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);

        return res.status(200).json({ success: true });
    } catch (err) {
        // Return JSON so the frontend doesn't crash on HTML response
        return res.status(500).json({ error: err.message || 'Server error' });
    }
};
