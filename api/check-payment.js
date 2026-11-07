import {pagou,errorResponse} from './pagou-client.js';
export default async function handler(req,res){
 if(!['POST','GET'].includes(req.method))return res.status(405).json({success:false,error:'Método não permitido'});
 const x=req.method==='POST'?req.body:req.query,id=String(x?.transaction_id||'');
 if(!/^[a-zA-Z0-9-]{8,80}$/.test(id))return res.status(400).json({success:false,error:'ID de pagamento inválido'});
 try{const d=await pagou('/v1/pix/'+encodeURIComponent(id));const states={1:'pending',2:'pending',3:'canceled',4:'paid',5:'refunded',6:'unknown'};const status=states[d.status]||'unknown';return res.status(200).json({success:true,transaction_id:id,status,allowpay_status:status,source:'pagou',amount:d.amount??0,last_check:new Date().toISOString()});}catch(e){return errorResponse(res,e)}
}
