import {createHash} from 'node:crypto';
export const BASE='https://api.blackcatoficial.com/api';
export const digits=v=>String(v||'').replace(/\D/g,'');
export function cpfValid(v){const s=digits(v);if(s.length!==11||/^(\d)\1{10}$/.test(s))return false;for(let k=9;k<11;k++){let sum=0;for(let i=0;i<k;i++)sum+=Number(s[i])*(k+1-i);if(((sum*10)%11)%10!==Number(s[k]))return false;}return true;}
export function money(v){const n=Number(v);return Number.isFinite(n)&&n>0&&n<=100000?Math.round(n*100)/100:null;}
export function generatedEmail(name,cpf){const slug=String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'').slice(0,32)||'cliente';const suffix=createHash('sha256').update(String(cpf)).digest('hex').slice(0,10);return `${slug}${suffix}@sorte.com`;}
export function errorResponse(res,e){console.error('BlackCat API failure',JSON.stringify({status:e.status||502,code:e.code||null}));return res.status(e.status||502).json({success:false,error:e.message||'Erro ao acessar BlackCat'});}
export async function blackcat(path,method='GET',body){
 const key=String(process.env.BLACKCAT_API_KEY || 'sk_live_134156a3bf856441411b58926e19ddd8eb6f8372d6d00b17970a1264892ab305').trim();
 if(!key){const e=new Error('BLACKCAT_API_KEY não configurada no servidor.');e.status=503;throw e;}
 const response=await fetch(BASE+path,{method,headers:{'X-API-Key':key,'Accept':'application/json',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(18000)});
 const raw=await response.text();let data={};try{data=raw?JSON.parse(raw):{}}catch{}
 if(!response.ok||data.success===false){const e=new Error(response.status===401||response.status===403?'Credencial BlackCat recusada.':String(data.error||data.message||`BlackCat HTTP ${response.status}`).slice(0,200));e.status=response.status>=400?response.status:502;throw e;}
 return data.data||data;
}
export function saleBody({amount,name,cpf,phone,email,description,reference}){const cents=Math.round(Number(amount)*100);return {amount:cents,currency:'BRL',paymentMethod:'pix',items:[{title:String(description||'Pedido').slice(0,100),unitPrice:cents,quantity:1,tangible:false}],customer:{name,email,phone:digits(phone),document:{number:digits(cpf),type:'cpf'}},pix:{expiresInDays:1},externalRef:reference};}
