require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const app = express();
const port = process.env.PORT || 8000; // Renderの場合、process.env.PORTを使うこと！
app.use(express.json());

const SECRET = process.env.SECRET;
if (!SECRET || SECRET.length < 32) {
    throw new Error('SECRET環境変数が未設定、もしくは短すぎます（32文字以上を推奨）');
}
const IVLEN = 16;

function encrypt(json) {
    const iv = crypto.randomBytes(IVLEN);
    const key = Buffer.from(SECRET, 'utf8');
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let enc = cipher.update(JSON.stringify(json), 'utf8', 'base64');
    enc += cipher.final('base64');
    return Buffer.concat([iv, Buffer.from(enc, 'base64')]).toString('base64');
}

function decrypt(data) {
    try {
        const raw = Buffer.from(data, 'base64');
        const iv = raw.slice(0, IVLEN);
        const enc = raw.slice(IVLEN);
        const key = Buffer.from(SECRET, 'utf8');
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let dec = decipher.update(enc, undefined, 'utf8');
        dec += decipher.final('utf8');
        return JSON.parse(dec);
    } catch (e) {
        return null;
    }
}

app.put('/issue', (req, res) => {
    const { redirect, requestor } = req.body;
    if (!/^https?:\/\/.+/.test(redirect)) return res.status(400).json({ error: "Invalid redirect URL" });
    if (!requestor) return res.status(400).json({ error: "No requestor" });
    const entityid = encrypt({ redirect, requestor, time: Date.now() });
    res.json({ entityid });
});

app.post('/decode', (req, res) => {
    const { entityid } = req.body;
    const data = decrypt(entityid);
    if (data && /^https?:\/\//.test(data.redirect)) {
        res.json({ url: data.redirect, requestor: data.requestor });
    } else {
        res.status(400).json({ error: 'decode error' });
    }
});

app.get('/ipinfo', (req, res) => {
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    let ng = false;
    let msg = '';
    if (/^10\.|^127\.|^172\.(1[6-9]|2[0-9]|3[01])\.|^192\.168\.|^\::1/.test(ip)) {
        ng = true;
        msg = "このIPはご利用できません";
    }
    res.json({ ip, available: !ng, message: msg });
});

app.listen(port, () => console.log(`Server listening on port ${port}`));
