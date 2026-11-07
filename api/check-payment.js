import {pagou,errorResponse,unwrapTransaction} from './pagou-client.js';
export default async function handler(req,res){
 if(!['POST','GET'].includes(req.method))return res.status(405).json({success:false,error:'Método não permitido'});
 const x=req.method==='POST'?req.body:req.query,id=String(x?.transaction_id||'');
 if(!/^[a-zA-Z0-9_-]{8,100}$/.test(id))return res.status(400).json({success:false,error:'ID inválido'});
 try{const d=unwrapTransaction(await pagou('/v2/transactions/'+encodeURIComponent(id)));const status=d.status==='paid'?'paid':(['pending','created','processing'].includes(d.status)?'pending':d.status||'unknown');return res.status(200).json({success:true,transaction_id:id,status,source:'pagou-v2',amount:Number(d.amount||0)/100,last_check:new Date().toISOString()});}catch(e){return errorResponse(res,e)}
}
