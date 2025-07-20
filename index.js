const express = require('express');
const app = express();
const port = 8000;

app.use(express.json());

const issued = {};

app.put('/issue', (req, res) => {
    // ランダムID生成
    let eid = ([...Array(17)].map(_=>Math.random().toString(36)[2])).join('');
    issued[eid] = { status: 'pending', time: Date.now(), requestor: req.body.requestor||""};
    res.json({entityid:eid});
});

app.put('/auth', (req, res) => {
    const {entityid, ip, result} = req.body;
    if(issued[entityid]) {
        issued[entityid].status = (result==="ok")?"ok":"fail";
        issued[entityid].ip = ip;
        issued[entityid].authtime=Date.now();
        res.json({ok: true});
    }else{
        res.status(400).json({ok: false});
    }
});

app.get('/status', (req, res) => {
    const eid = req.query.entityid;
    const info = issued[eid];
    res.json({allow: info && info.status==="ok"});
});

app.listen(port,()=>console.log("API Ready"));
