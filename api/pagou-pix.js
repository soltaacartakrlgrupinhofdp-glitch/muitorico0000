import {randomUUID} from 'node:crypto';
import {pagou,cpfValid,money,digits,errorResponse,transactionBody,unwrapTransaction,generatedEmail} from './pagou-client.js';
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({success:false,error:'Método não permitido'});
 const x=req.body||{},amount=money(x.amount),cpf=digits(x.cpf),name=String(x.nome||'').trim();
 if(!amount||!cpfValid(cpf)||!name)return res.status(400).json({success:false,error:'Nome, CPF ou valor inválido.'});
 const qty=Math.max(1,Math.min(150,parseInt(x.quantidade,10)||1));
 try{
  const result=await pagou('/v2/transactions','POST',transactionBody({amount,name,cpf,email:generatedEmail(name,cpf),description:x.descricao||`${qty} títulos`,reference:`site_${randomUUID()}`}));
  const data=unwrapTransaction(result),code=data.pix?.qr_code;
  if(!data.id||!code)return res.status(502).json({success:false,error:'Resposta sem código PIX; verifique a transação antes de tentar novamente.'});
  return res.status(200).json({success:true,transaction_id:data.id,txid:data.id,route:'pagou-v2',qr_code:code,codigo_pix:code,qr_code_image:`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(code)}`,valor:amount,quantidade:qty,expira_em:data.pix.expiration_date||null});
 }catch(e){return errorResponse(res,e)}
}
