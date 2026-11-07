export const PAGOU_BASE = process.env.PAGOU_ENV === 'production' ? 'https://api.pagou.com.br' : 'https://api.pagou.cloud';
export async function pagou(path, method='GET', body) {
  const key=process.env.PAGOU_API_KEY;
  if(!key) {const e=new Error('Configure PAGOU_API_KEY no servidor.');e.status=503;throw e;}
  const response=await fetch(PAGOU_BASE+path,{method,headers:{'X-API-KEY':key,'User-Agent':'VivaIntegracao/1.0',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(18000)});
  const data=await response.json().catch(()=>({}));
  if(!response.ok){const e=new Error(typeof data.error==='string'?data.error:(typeof data.message==='string'?data.message:`Pagou HTTP ${response.status}`));e.status=response.status;throw e;}
  return data;
}
export function digits(v){return String(v||'').replace(/\D/g,'');}
export function cpfValid(v){const s=digits(v);if(s.length!==11||/^(\d)\1{10}$/.test(s))return false;for(let k=9;k<11;k++){let sum=0;for(let i=0;i<k;i++)sum+=Number(s[i])*(k+1-i);if(((sum*10)%11)%10!==Number(s[k]))return false;}return true;}
export function money(v){const n=Number(v);if(!Number.isFinite(n)||n<=0||n>100000)return null;return Math.round(n*100)/100;}
export function errorResponse(res,e){console.error('Pagou request failed:',e.status||502,e.message);return res.status(e.status||502).json({success:false,error:e.message||'Erro ao acessar Pagou'});}
