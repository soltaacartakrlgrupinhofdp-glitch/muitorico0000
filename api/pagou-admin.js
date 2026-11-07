import {randomUUID,timingSafeEqual} from 'node:crypto';
import {pagou,cpfValid,money,digits,errorResponse,transactionBody,unwrapTransaction} from './pagou-client.js';
function auth(req){const password=process.env.ADMIN_PASSWORD;if(!password)return false;const a=Buffer.from(String(req.headers.authorization||'').replace(/^Bearer\s+/i,''));const b=Buffer.from(password);return a.length===b.length&&timingSafeEqual(a,b)}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');if(!auth(req))return res.status(401).json({error:'Não autorizado. Configure ADMIN_PASSWORD.'});
 try{
 if(req.method==='GET'){
 const action=String(req.query.action||'');
 if(action==='wallet')return res.status(200).json({data:{balance:null,hold:null,available:false},notice:'A documentação pública v2 consultada não define um endpoint de saldo.'});
 if(action==='transactions'){const d=await pagou('/v2/transactions');return res.status(200).json({data:Array.isArray(d.data?.data)?d.data.data:[]});}
 return res.status(400).json({error:'Consulta inválida'});
 }
 if(req.method==='POST'&&req.body?.action==='create'){
 const x=req.body,amount=money(x.amount),cpf=digits(x.cpf),name=String(x.name||'').trim(),email=String(x.email||'').trim();
 if(!amount||!cpfValid(cpf)||!name||!/^\S+@\S+\.\S+$/.test(email))return res.status(400).json({error:'Informe nome, CPF válido, e-mail e valor.'});
 const d=unwrapTransaction(await pagou('/v2/transactions','POST',transactionBody({amount,name,cpf,email,description:x.description||'Cobrança administrativa',reference:`admin_${randomUUID()}`})));
 return res.status(200).json({data:{id:d.id,amount:Number(d.amount||0)/100,status:d.status,pix_code:d.pix?.qr_code||'',qr_code:d.pix?.qr_code||''}});
 }
 return res.status(405).json({error:'Método ou ação inválidos'});
 }catch(e){return errorResponse(res,e)}
}
