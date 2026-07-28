const { verify } = require('../lib/session');
const { putFile, updateConfig, repoInfo } = require('../lib/github');

const ALLOWED_EXT = ['ttf', 'otf', 'woff', 'woff2'];
// Vercel serverless functions cap the request body at ~4.5MB, so that's
// the real ceiling here regardless of GitHub's own limits — most font
// files (woff2 especially) are well under this.
const MAX_BYTES = 4 * 1024 * 1024; // 4MB

function safeFileName(name) {
    return (name || 'font')
        .toLowerCase()
        .replace(/[^a-z0-9.\-_]/g, '-')
        .replace(/-+/g, '-');
}

module.exports = async (req, res) => {
    const token = req.cookies?.session;
    const session = verify(token, process.env.SESSION_SECRET);
    if (!session) return res.status(401).json({ error: 'Not authenticated' });
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
        const { fontFamily, filename, dataBase64 } = body;

        if (!fontFamily || !filename || !dataBase64) {
            return res.status(400).json({ error: 'Missing fontFamily, filename, or dataBase64' });
        }

        const ext = (filename.split('.').pop() || '').toLowerCase();
        if (!ALLOWED_EXT.includes(ext)) {
            return res.status(400).json({ error: `Unsupported font type .${ext} — use ttf, otf, woff, or woff2` });
        }

        const approxBytes = Math.ceil((dataBase64.length * 3) / 4);
        if (approxBytes > MAX_BYTES) {
            return res.status(400).json({ error: 'Font file is too large (20MB max).' });
        }

        const safeName = safeFileName(filename);
        const repoPath = `public/fonts/${safeName}`;

        await putFile(repoPath, dataBase64, `Add font ${safeName} via dashboard`);

        const { owner, repo, branch } = repoInfo();
        const cdnUrl = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/public/fonts/${safeName}`;
        const siteUrl = `/fonts/${safeName}`;

        const fontEntry = { name: fontFamily, file: safeName, format: ext, url: cdnUrl, path: siteUrl };

        const updated = await updateConfig(cfg => {
            if (!Array.isArray(cfg.customFonts)) cfg.customFonts = [];
            cfg.customFonts = cfg.customFonts.filter(f => f.name !== fontFamily);
            cfg.customFonts.push(fontEntry);
        }, `Register font ${fontFamily} via dashboard`);

        return res.status(200).json({ font: fontEntry, config: updated });
    } catch (err) {
        return res.status(500).json({ error: err.message || 'Font upload failed' });
    }
};
