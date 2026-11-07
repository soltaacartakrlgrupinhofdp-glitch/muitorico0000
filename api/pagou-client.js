import {createHash} from 'node:crypto';
export const PAGOU_BASE = process.env.PAGOU_ENV === 'sandbox' ? 'https://api.sandbox.pagou.ai' : 'https://api.pagou.ai';
export async function pagou(path, method='GET', body) {
 const key=String(process.env.PAGOU_API_KEY||'').trim();
 if(!key){const e=new Error('PAGOU_API_KEY não configurada no servidor');e.status=503;throw e;}
 const response=await fetch(PAGOU_BASE+path,{method,headers:{Authorization:`Bearer ${key}`,'Accept':'application/json',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(18000)});
 const raw=await response.text();let data={};try{data=raw?JSON.parse(raw):{}}catch{data={}};
 if(!response.ok){
  // Não registrar corpo da cobrança, documentos, e-mails ou credenciais.
  const errors=Array.isArray(data.errors)?data.errors:[];
  const fields=errors.map(item=>({field:String(item.field||'').slice(0,80),code:String(item.code||'').slice(0,60)}));
  const detail=typeof data.detail==='string'?data.detail:typeof data.message==='string'?data.message:typeof data.error==='string'?data.error:`Pagou HTTP ${response.status}`;
  const diagnostic={status:response.status,requestId:response.headers.get('x-request-id')||data.requestId||null,type:data.type||null,title:data.title||null,fields,detailCode:typeof data.code==='string'?data.code.slice(0,80):null,environment:process.env.PAGOU_ENV==='sandbox'?'sandbox':'production',path};
  console.error('Pagou API diagnostic',JSON.stringify(diagnostic));
  // A API pode retornar uma mensagem genérica para erros de validação de negócio.
  // Nunca registrar a resposta integral: ela pode conter dados do comprador.
  const e=new Error(response.status===401?'Pagou.ai recusou a credencial (401). Verifique a chave v2 e o ambiente.':detail);
  e.status=response.status;e.fields=fields;e.requestId=diagnostic.requestId;throw e;
 }
 return data;
}
export function digits(v){return String(v||'').replace(/\D/g,'');}
export function cpfValid(v){const s=digits(v);if(s.length!==11||/^(\d)\1{10}$/.test(s))return false;for(let k=9;k<11;k++){let sum=0;for(let i=0;i<k;i++)sum+=Number(s[i])*(k+1-i);if(((sum*10)%11)%10!==Number(s[k]))return false;}return true;}
export function money(v){const n=Number(v);if(!Number.isFinite(n)||n<=0||n>100000)return null;return Math.round(n*100)/100;}
export function errorResponse(res,e){console.error('Pagou v2 request failed:',e.status||502,e.message);return res.status(e.status||502).json({success:false,error:e.message||'Erro ao acessar Pagou'});}
// O domínio sorte.com foi informado como autorizado pelo responsável pelo site.
// Endereço técnico determinístico: não pressupõe que uma caixa postal exista.
export function generatedEmail(name, cpf) {
 const slug = String(name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 32) || 'cliente';
 const suffix = createHash('sha256').update(String(cpf)).digest('hex').slice(0, 10);
 return `${slug}${suffix}@sorte.com`;
}
export function transactionBody({amount,name,cpf,email,description,reference}){const cents=Math.round(Number(amount)*100);return {external_ref:reference,amount:cents,currency:'BRL',method:'pix',buyer:{name,email,document:{type:'CPF',number:cpf}},products:[{name:String(description||'Pedido').slice(0,100),price:cents,quantity:1}]};}
export function unwrapTransaction(result){return result?.data||{};}
