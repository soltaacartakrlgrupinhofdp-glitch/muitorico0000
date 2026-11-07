// Cobrança PIX exclusivamente pela API Pagou.ai.
import {pagou,cpfValid,money,digits,errorResponse} from './pagou-client.js';
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({success:false,error:'Método não permitido'});
 const x=req.body||{},amount=money(x.amount),cpf=digits(x.cpf),name=String(x.nome||'').trim();
 if(!amount||!cpfValid(cpf)||!name)return res.status(400).json({success:false,error:'Nome, CPF ou valor inválido.'});
 const qty=Math.max(1,Math.min(150,parseInt(x.quantidade,10)||1));
 try{
  const data=await pagou('/v1/pix','POST',{amount,description:String(x.descricao||`${qty} títulos de capitalização`).slice(0,160),expiration:1800,payer:{name,document:cpf}});
  if(!data.id||!data.payload?.data)return res.status(502).json({success:false,error:'Cobrança criada sem código PIX. Consulte o painel antes de tentar novamente.'});
  const code=data.payload.data,im=data.payload.image;
  return res.status(200).json({success:true,transaction_id:data.id,txid:data.id,route:'pagou',qr_code:code,codigo_pix:code,qr_code_image:im?`data:image/png;base64,${im.replace(/^data:image\/\w+;base64,/,'')}`:`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(code)}`,valor:amount,quantidade:qty,expira_em:new Date(Date.now()+1800000).toISOString()});
 }catch(e){return errorResponse(res,e)}
}
