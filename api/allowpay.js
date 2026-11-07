const API_BASE = 'https://allow-gi0i.onrender.com';
const digits = v => String(v ?? '').replace(/\D/g, '');
function validCPF(cpf) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  for (let n = 9; n <= 10; n++) {
    const sum = [...cpf.slice(0,n)].reduce((a,d,i) => a + Number(d)*(n+1-i),0);
    if (Number(cpf[n]) !== ((sum*10)%11)%10) return false;
  }
  return true;
}
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if(req.method !== 'POST') return res.status(405).json({success:false,error:'Método não permitido'});
  const key='allow_apikey_ms1ng7i02bp';
  if(!key) return res.status(503).json({success:false,error:'ALLOWPAY_API_KEY não configurada na Vercel'});
  const x=req.body||{};
  const cpf=digits(x.cpf), phone=digits(x.telefone);
  const amount=Number(x.amount), qty=Number(x.quantidade);
  const name=String(x.nome||'').trim();
  const email=String(x.email||'').trim();
  if(!Number.isFinite(amount)||amount<=0||!Number.isInteger(Math.round(amount*100))||!Number.isInteger(qty)||qty<1||!validCPF(cpf)||!/^\d{10,11}$/.test(phone)||!name||!/^\S+@\S+\.\S+$/.test(email))
    return res.status(400).json({success:false,error:'Confira CPF, nome, e-mail, telefone, quantidade e valor'});
  const origin=`https://${req.headers['x-forwarded-host']||req.headers.host||'localhost'}`.replace(/\/$/,'');
  const payload={api_key:key,amount:Math.round(amount*100),description:`${qty} ${String(x.produto||x.descricao||'Título de Capitalização').slice(0,120)}`,customer:{name,email,cellphone:phone,taxId:cpf}};
  try {
    const response=await fetch(`${API_BASE}/api/v2/allowpay-seller/create-pix`,{method:'POST',headers:{'Content-Type':'application/json','X-AllowPay-Origin':origin},body:JSON.stringify(payload),signal:AbortSignal.timeout(25000)});
    const raw=await response.text();
    let data;try{data=JSON.parse(raw)}catch{data={error:'Resposta inválida da AllowPay'}}
    if(!response.ok||data.error) {
      console.error('AllowPay create error',{status:response.status,error:data.error||data.message});
      return res.status(response.status===401?502:response.status===503?503:502).json({success:false,error:response.status===401?'Chave AllowPay rejeitada':response.status===503?'Adquirentes AllowPay indisponíveis':String(data.error||data.message||'Erro ao criar PIX').slice(0,250),gateway_status:response.status});
    }
    if(!data.txid||!data.route||!data.pix_code) return res.status(502).json({success:false,error:'AllowPay não retornou txid, route ou código PIX'});
    const code=data.pix_code;
    return res.status(200).json({success:true,transaction_id:data.txid,txid:data.txid,route:data.route,qr_code:code,codigo_pix:code,qr_code_image:data.pix_qr_code||`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(code)}`,valor:amount,quantidade:qty});
  }catch(e){console.error('AllowPay network error',e.message);return res.status(502).json({success:false,error:e.name==='TimeoutError'?'Tempo esgotado ao conectar à AllowPay':'Falha de conexão com a AllowPay'});}
}
