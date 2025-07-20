// ---------- server.js ----------
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors()); // どこからもアクセス可（必要に応じてCORS元制限に変更）
app.use(express.json());

const issued = {}; // メモリ上の認証データ格納（本番はDB推奨）

// EntityID発行エンドポイント
app.put('/issue', (req, res) => {
  let eid = Math.random().toString(36).slice(2,18);
  issued[eid] = { status: 'pending', time: Date.now(), requestor: req.body.requestor || "" };
  res.json({ entityid: eid });
});
// 認証成功申告
app.put('/auth', (req,res)=>{
  const {entityid, ip, result} = req.body;
  if(issued[entityid]) {
      issued[entityid].status = (result==="ok")?"ok":"fail";
      issued[entityid].ip = ip;
      issued[entityid].authtime=Date.now();
      res.json({ok:true});
  }else{
      res.status(400).json({ok:false});
  }
});
// 認証状態確認
app.get('/status', (req,res)=>{
  const eid = req.query.entityid, info = issued[eid];
  res.json({allow: info && info.status==="ok"});
});
// GET / (確認用)
app.get('/', (req,res)=>{ res.send('Humanoproof API running'); });

const port = process.env.PORT || 8000; // Render必須
app.listen(port, ()=>console.log('API server ready, port='+port));
