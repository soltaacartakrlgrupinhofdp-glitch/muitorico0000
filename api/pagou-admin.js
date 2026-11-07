import {timingSafeEqual} from 'node:crypto';
import {pagou,cpfValid,money,digits,errorResponse} from './pagou-client.js';
function auth(req){const a=Buffer.from(String(req.headers.authorization||'').replace(/^Bearer\s+/i,''));const b=Buffer.from(process.env.ADMIN_PASSWORD||'593120');return a.length===b.length&&timingSafeEqual(a,b)}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');if(!auth(req))return res.status(401).json({error:'Não autorizado'});
 try{
 if(req.method==='GET'){
 const action=String(req.query.action||'');
 if(action==='wallet')return res.status(200).json({data:await pagou('/v1/customers/balance')});
 if(action==='transactions'){const page=Math.max(0,Math.min(1000,Number(req.query.page)||0));const data=await pagou(`/v1/pix?limit=20&offset=${page}`);return res.status(200).json({data:Array.isArray(data)?data:[]});}
 return res.status(400).json({error:'Consulta inválida'});
 }
 if(req.method==='POST'&&req.body?.action==='create'){
 const x=req.body,amount=money(x.amount),cpf=digits(x.cpf),name=String(x.name||'').trim();
 if(!amount||!cpfValid(cpf)||!name)return res.status(400).json({error:'Informe nome, CPF válido e valor positivo.'});
 const d=await pagou('/v1/pix','POST',{amount,description:String(x.description||'Cobrança administrativa').slice(0,160),expiration:1800,payer:{name,document:cpf}});
 return res.status(200).json({data:{id:d.id,amount:d.amount,status:d.status,pix_code:d.payload?.data||'',qr_code:d.payload?.data||''}});
 }
 return res.status(405).json({error:'Método ou ação inválidos'});
 }catch(e){return errorResponse(res,e)}
}
