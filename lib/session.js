const crypto = require('crypto');

function sign(payload, secret) {
    if (!secret) return null;
    const str = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = crypto.createHmac('sha256', secret).update(str).digest('base64url');
    return `${str}.${sig}`;
}

function verify(token, secret) {
    if (!token || typeof token !== 'string' || !secret) return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [str, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', secret).update(str).digest('base64url');
    
    if (sig === expectedSig) {
        try {
            return JSON.parse(Buffer.from(str, 'base64url').toString('utf-8'));
        } catch {
            return null;
        }
    }
    return null;
}

module.exports = { sign, verify };
