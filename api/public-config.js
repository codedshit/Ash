const { getConfig } = require('../lib/github');

module.exports = async (req, res) => {
    try {
        const { config } = await getConfig();
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).json(config);
    } catch (err) {
        return res.status(500).json({ error: err.message || 'Failed to load config' });
    }
};
