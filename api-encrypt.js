const crypto = require('crypto');

function irregularEncrypt(text, kind = 'zi') {
    const salt = crypto.randomBytes(8).toString('hex');
    const hashed = crypto.createHash('sha256').update(`${text}:${salt}`).digest('hex');
    const meta = `${hashed}|${salt}|${text.length}`;
    let code = Buffer.from(meta).toString('base64url');
    const prefix = kind === 'zi' ? 'zi-' : 'tx-';
    return prefix + code;
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }
    let text = '';
    let target = '';
    try {
        if (req.headers['content-type']?.includes('application/json')) {
            ({ text = '', target = '' } = req.body);
        } else {
            let data = '';
            req.on('data', chunk => data += chunk);
            await new Promise(resolve => req.on('end', resolve));
            const body = JSON.parse(data || '{}');
            text = body.text;
            target = body.target;
        }
    } catch {
        res.status(400).json({ error: 'Invalid body' });
        return;
    }
    if (!text || typeof text !== 'string') {
        res.status(400).json({ error: 'No text!' });
        return;
    }
    const kind = target === 'address' ? 'zi' : 'tx';
    const encrypted = irregularEncrypt(text, kind);
    res.status(200).json({ encrypted });
};
