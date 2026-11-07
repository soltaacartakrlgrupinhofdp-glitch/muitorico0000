const BASE='https://allow-gi0i.onrender.com';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({success:false,error:'Método não permitido'});
 const key='allow_apikey_ms1ng7i02bp';
 if(!key)return res.status(503).json({success:false,error:'ALLOWPAY_API_KEY não configurada'});
 const {transaction_id:id,route}=req.body||{};
 if(!id||!route||typeof id!=='string'||typeof route!=='string')return res.status(400).json({success:false,error:'transaction_id e route são obrigatórios'});
 try{
  const r=await fetch(`${BASE}/api/v2/allowpay-seller/payment-status/${encodeURIComponent(id)}?route=${encodeURIComponent(route)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({api_key:key}),signal:AbortSignal.timeout(20000)});
  const raw=await r.text();let data;try{data=JSON.parse(raw)}catch{data={error:'Resposta inválida da AllowPay'}}
  if(!r.ok||data.error)return res.status(502).json({success:false,error:String(data.error||'Falha na consulta AllowPay').slice(0,250),gateway_status:r.status});
  const map={approved:'paid',waiting_payment:'pending',expired:'expired',declined:'failed',canceled:'canceled',refunded:'refunded',chargeback:'chargeback'};
  return res.status(200).json({success:true,transaction_id:id,status:map[data.status]||'unknown',allowpay_status:data.status,source:data.source||null,last_check:new Date().toISOString()});
 }catch(e){console.error('AllowPay status network error',e.message);return res.status(502).json({success:false,error:'Falha de conexão ao consultar AllowPay'});}
}
