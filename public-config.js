const { getConfig } = require('../lib/github');

// Unauthenticated, read-only. The live site fetches this on every page load
// to render current theme/identity/songs/badges/etc. No login required —
// only the dashboard's /api/config write path needs a password.
module.exports = async (req, res) => {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    try {
        const { config } = await getConfig();
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        return res.status(200).json(config);
    } catch (err) {
        return res.status(500).json({ error: 'Could not load config' });
    }
};
