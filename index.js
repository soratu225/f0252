const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

function irregularEncrypt(text, kind = 'zi') {
    // 1. ランダムなソルト生成
    const salt = crypto.randomBytes(8).toString('hex');
    // 2. テキストとソルト結合しSHA256ハッシュ
    const mix = `${text}:${salt}`;
    const hashed = crypto.createHash('sha256').update(mix).digest('hex');
    // 3. ハッシュ|ソルト|テキスト長 を base64 エンコード
    const meta = `${hashed}|${salt}|${text.length}`;
    let code = Buffer.from(meta).toString('base64url');
    // 4. プレフィックス付加
    const prefix = kind === 'zi' ? 'zi-' : 'tx-';
    return prefix + code;
}

app.post('/encrypt', (req, res) => {
    const { text, target } = req.body;
    if (!text) return res.status(400).json({ error: 'No text!' });
    const kind = target === 'address' ? 'zi' : 'tx';
    const encrypted = irregularEncrypt(text, kind);
    res.json({ encrypted });
});

// サンプル用トップページ
app.get('/', (req, res) => {
    res.send('暗号化APIです。POST /encrypt へ { text, target } をJSONで送信してください。');
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});
