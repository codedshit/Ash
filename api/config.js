const { verify } = require('../lib/session');
const { getConfig, updateConfig } = require('../lib/github');

const ALLOWED_SECTIONS = ['theme', 'backgroundVideo', 'identity', 'songs', 'badges', 'discord', 'effects', 'uploads', 'bio', 'socials', 'tabs', 'appearance', 'customFonts', 'customTabs', 'discordWidgets'];

module.exports = async (req, res) => {
    // Vercel handles cookie parsing natively
    const token = req.cookies?.session;
    const session = verify(token, process.env.SESSION_SECRET);
    if (!session) return res.status(401).json({ error: 'Not authenticated' });

    if (req.method === 'GET') {
        const { config } = await getConfig();
        return res.status(200).json(config);
    }

    if (req.method === 'POST') {
        const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
        const { section, data } = body;
        if (!section || data === undefined) return res.status(400).json({ error: 'Missing section/data' });
        if (!ALLOWED_SECTIONS.includes(section)) return res.status(400).json({ error: 'Unknown section: ' + section });

        try {
            const updated = await updateConfig(cfg => {
                cfg[section] = data;
            }, `Update ${section} via dashboard`);
            return res.status(200).json(updated);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    res.status(405).json({ error: 'Method not allowed' });
};
