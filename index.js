const express = require('express');
const crypto = require('crypto');
const app = express();
const port = 8080;
app.use(express.json());

const SECRET = 'YourSuperSecureSecretKey32chars!'; // 必ず環境変数で管理
const IVLEN = 16;

// Encrypt/Decrypt（AES-256-CBC）
function encrypt(json) {
    const iv = crypto.randomBytes(IVLEN);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(SECRET), iv);
    let enc = cipher.update(JSON.stringify(json), 'utf8', 'base64');
    enc += cipher.final('base64');
    return Buffer.concat([iv, Buffer.from(enc,'base64')]).toString('base64');
}
function decrypt(data) {
    try {
        const raw = Buffer.from(data, 'base64');
        const iv = raw.slice(0, IVLEN);
        const enc = raw.slice(IVLEN);
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(SECRET), iv);
        let dec = decipher.update(enc, undefined, 'utf8');
        dec += decipher.final('utf8');
        return JSON.parse(dec);
    } catch(e) {
        return null;
    }
}

app.put('/issue', (req, res) => {
    const {redirect, requestor} = req.body;
    // バリデーション
    if(!/^https?:\/\/.+/.test(redirect)) return res.status(400).json({error:"Invalid redirect URL"});
    if(!requestor) return res.status(400).json({error:"No requestor"});
    // entityid=BLOB(redirectとrequestorをセットで暗号化)
    const entityid = encrypt({redirect, requestor});
    res.json({entityid});
});

app.post('/decode', (req, res) => {
    const {entityid} = req.body;
    const data = decrypt(entityid);
    if(data && /^https?:\/\//.test(data.redirect)){
        res.json({url: data.redirect});
    }else{
        res.status(400).json({error:'decode error'});
    }
});

app.get('/ipinfo', (req, res) => {
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    // 本物運用時は「セルラーIPレンジ」リストやProxy/VPN判定API（ipinfo.io/ip2proxy等）で
    // ここでは例として "10.x.x.x, 192.168.x.x, 172.16-31.x.x, 127.0.0.1, "::1, "..." は不許可
    let ng = false;
    let msg = '';
    if(/^10\.|^127\.|^172\.((1[6-9])|(2[0-9])|(3[01]))\.|^192\.168\.|^\::1/.test(ip)){
        ng = true;
        msg = "このIPはご利用できません";
    }
    // (本番運用はここで外部API ip2proxyやipdata等を照合してください)

    res.json({ip, available: !ng, message: msg});
});

app.listen(port, ()=>console.log(`API server up!`));
