const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const issued = {};

app.put('/issue', (req, res) => {
  let eid = Math.random().toString(36).slice(2,18);
  issued[eid] = { status: 'pending', time: Date.now(), requestor: req.body.requestor || "" };
  res.json({ entityid: eid });
});
app.put('/auth', (req,res)=> {
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
app.get('/status', (req,res)=>{
  const eid = req.query.entityid, info = issued[eid];
  res.json({allow: info && info.status==="ok"});
});
// GET /
app.get('/', (req,res)=>{ res.send('Humanoproof API running'); });

const port = process.env.PORT || 8000;
app.listen(port, ()=>console.log('API server ready, port='+port));
