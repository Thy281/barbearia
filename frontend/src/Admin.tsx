import { FormEvent, useState, useEffect } from 'react';

const api = import.meta.env.VITE_API_URL ?? '';
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const services = [{ name: 'Corte clássico', price: 'R$ 45' }, { name: 'Corte + barba', price: 'R$ 75' }, { name: 'Barba completa', price: 'R$ 40' }, { name: 'Pezinho', price: 'R$ 20' }];
type Slot = { id: string; slot_date: string; slot_time: string };
type Appointment = { id: string; customer_name: string; phone: string; service: string; appointment_at: string; status: 'PENDING' | 'COMPLETED' | 'NO_SHOW' };
const labels = { PENDING: 'Pendente', COMPLETED: 'Feito', NO_SHOW: 'Não realizado' };
const times = Array.from({length:31},(_,i)=>{const h=7+Math.floor(i/2);const m=i%2*30;return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')});
const today = new Date();
function daysInMonth(m:number,y:number){return new Date(y,m+1,0).getDate()}
function firstDow(m:number,y:number){return(new Date(y,m,1).getDay()+6)%7}

export default function Admin() {
  const [password, setPassword] = useState(''); const [logged, setLogged] = useState(false); const [items, setItems] = useState<Appointment[]>([]); const [slots, setSlots] = useState<Slot[]>([]); const [error, setError] = useState(''); const [tab, setTab] = useState<'agenda'|'horarios'>('agenda');
  const [cm, setCm] = useState(today.getMonth()); const [cy, setCy] = useState(today.getFullYear()); const [selDate, setSelDate] = useState(''); const [daySlots, setDaySlots] = useState<Slot[]>([]);
  const dim = daysInMonth(cm,cy); const fdow = firstDow(cm,cy);
  const daysArr:{n:number,off:boolean,ok:boolean}[] = [];
  for (let i=0;i<fdow;i++) daysArr.push({n:0,off:true,ok:false});
  for (let d=1;d<=dim;d++){const ds=cy+'-'+String(cm+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');daysArr.push({n:d,off:false,ok:true});}
  const priceOf = (s:string) => { const sv = services.find(x => x.name === s); return sv ? sv.price : ''; };
  async function load(){const r=await fetch(`${api}/api/appointments`,{credentials:'include'});if(!r.ok)throw new Error('Erro');setItems(await r.json());}
  async function login(e:FormEvent){e.preventDefault();setError('');const r=await fetch(`${api}/api/admin/login`,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({password})});if(!r.ok){setError('Senha inválida.');return;}setLogged(true);await load();}
  async function change(id:string,m:'PATCH'|'DELETE',s?:string){const r=await fetch(`${api}/api/appointments/${id}`,{method:m,headers:{'Content-Type':'application/json'},credentials:'include',body:s?JSON.stringify({status:s}):undefined});if(!r.ok){setError('Erro');return;}await load();}
  async function loadMonthSlots(){const r=await fetch(`${api}/api/admin/slots?month=${cy}-${String(cm+1).padStart(2,'0')}`,{credentials:'include'});if(r.ok)setSlots(await r.json());}
  async function loadDaySlots(d:string){const r=await fetch(`${api}/api/admin/slots?date=${d}`,{credentials:'include'});if(r.ok)setDaySlots(await r.json());}
  async function toggleSlot(d:string,t:string){const existing=daySlots.find(s=>s.slot_date===d&&s.slot_time.slice(0,5)===t);if(existing){await fetch(`${api}/api/admin/slots/${existing.id}`,{method:'DELETE',credentials:'include'});}else{await fetch(`${api}/api/admin/slots`,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({slot_date:d,slot_time:t+':00'})});}await loadDaySlots(d);await loadMonthSlots();}
  useEffect(()=>{if(tab==='horarios'&&!selDate)loadMonthSlots()},[tab,cm,cy,selDate]);
  useEffect(()=>{if(selDate)loadDaySlots(selDate);},[selDate]);

  if(!logged) return (
    <main className="grid min-h-screen place-items-center px-6" style={{background:'#ede9e1'}}>
      <form onSubmit={login} className="w-full max-w-sm border-t-4 border-[#bd4f2d] bg-white p-8 shadow-lg">
        <a href="/" className="font-display text-3xl font-bold">LÂMINA<span className="text-[#bd4f2d]">.</span></a>
        <h1 className="mt-10 font-display text-4xl uppercase">Administração</h1>
        <p className="mt-2 text-sm text-[#5b574f]">Entre para gerenciar a barbearia.</p>
        <label className="mt-8 block text-sm font-semibold">Senha
          <input autoFocus required type="password" value={password} onChange={e=>setPassword(e.target.value)}
            className="mt-1 block w-full border-2 border-[#c9c1b4] bg-transparent px-3 py-2 text-sm outline-none focus:border-[#1d1d1b]"/>
        </label>
        <button className="mt-7 w-full bg-[#1d1d1b] py-3 font-mono text-xs uppercase tracking-widest text-white transition hover:bg-[#bd4f2d]">Entrar</button>
        {error&&<p className="mt-4 text-sm text-[#bd4f2d]">{error}</p>}
      </form>
    </main>
  );

  return (
    <main className="min-h-screen" style={{background:'#ede9e1'}}>
      <header className="border-b border-[#c9c1b4] bg-white px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <a href="/" className="font-display text-2xl font-bold">LÂMINA<span className="text-[#bd4f2d]">.</span></a>
          <button onClick={tab==='agenda'?load:()=>{setSelDate('');loadMonthSlots();}}
            className="font-mono text-xs uppercase tracking-widest underline underline-offset-4">Atualizar</button>
        </div>
        <div className="mx-auto mt-4 flex max-w-6xl gap-1">
          {( ['agenda','horarios'] as const ).map(t => (
            <button key={t} onClick={()=>{setTab(t);if(t==='horarios'){setSelDate('');loadMonthSlots();}}}
              className={`px-5 py-2 font-mono text-xs uppercase tracking-wider transition ${
                tab===t ? 'bg-[#1d1d1b] text-white' : 'bg-[#ede9e1] text-[#5b574f] hover:bg-[#e2ddd2]'
              }`}>{t==='agenda'?'Agenda':'Horários'}</button>
          ))}
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {error&&<p className="mb-6 bg-[#bd4f2d]/10 px-4 py-2 text-sm text-[#bd4f2d]">{error}</p>}

        {tab==='agenda' ? (
          <div>
            <div className="mb-4 flex gap-3 font-mono text-xs uppercase tracking-wider">
              <span className="rounded bg-[#1d1d1b] px-3 py-1.5 text-white">{items.filter(x=>x.status==='COMPLETED').length} Feito</span>
              <span className="rounded border border-[#bd4f2d] px-3 py-1.5 text-[#bd4f2d]">{items.filter(x=>x.status==='NO_SHOW').length} Não realizado</span>
              <span className="rounded border border-amber-600 px-3 py-1.5 text-amber-700">{items.filter(x=>x.status==='PENDING').length} Pendente</span>
            </div>
            <div className="overflow-x-auto bg-white shadow-sm">
            <table className="w-full min-w-200 text-left">
              <thead>
                <tr className="border-b-2 border-[#1d1d1b] font-mono text-xs uppercase tracking-wider text-[#5b574f]">
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Contato</th>
                  <th className="px-4 py-3 font-medium">Serviço</th>
                  <th className="px-4 py-3 font-medium">Valor</th>
                  <th className="px-4 py-3 font-medium">Horário</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b border-[#c9c1b4] last:border-0 hover:bg-[#ede9e1]/50">
                    <td className="px-4 py-3 font-semibold">{item.customer_name}</td>
                    <td className="px-4 py-3 text-sm">{item.phone}</td>
                    <td className="px-4 py-3 text-sm">{item.service}</td>
                    <td className="px-4 py-3 font-mono text-sm">{priceOf(item.service)}</td>
                    <td className="px-4 py-3 text-sm">{new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'}).format(new Date(item.appointment_at))}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 font-mono text-xs uppercase ${
                        item.status==='PENDING'?'border border-amber-600 text-amber-700':
                        item.status==='COMPLETED'?'bg-[#1d1d1b] text-white':
                        'border border-[#bd4f2d] text-[#bd4f2d] line-through'
                      }`}>{labels[item.status]}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={()=>change(item.id,'PATCH','COMPLETED')}
                          className="bg-[#1d1d1b] px-2.5 py-1 font-mono text-xs uppercase tracking-wider text-white transition hover:bg-[#bd4f2d]">Feito</button>
                        <button onClick={()=>change(item.id,'PATCH','NO_SHOW')}
                          className="border border-[#1d1d1b] px-2.5 py-1 font-mono text-xs uppercase tracking-wider transition hover:bg-[#1d1d1b] hover:text-white">Não veio</button>
                        <button onClick={()=>change(item.id,'DELETE')}
                          className="border border-[#bd4f2d] px-2.5 py-1 font-mono text-xs uppercase tracking-wider text-[#bd4f2d] transition hover:bg-[#bd4f2d] hover:text-white">Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length===0&&<p className="py-16 text-center text-sm text-[#5b574f]">Nenhum agendamento encontrado.</p>}
          </div>
          </div>
        ) : !selDate ? (
          <div className="mx-auto max-w-md">
            <div className="mb-5 flex items-center justify-between">
              <button type="button" onClick={()=>{if(cm===0){setCm(11);setCy(cy-1)}else setCm(cm-1)}}
                className="flex h-9 w-9 items-center justify-center border border-[#1d1d1b] font-mono text-sm transition hover:bg-[#1d1d1b] hover:text-white">&lt;</button>
              <span className="font-display text-2xl uppercase">{MONTHS[cm]} {cy}</span>
              <button type="button" onClick={()=>{if(cm===11){setCm(0);setCy(cy+1)}else setCm(cm+1)}}
                className="flex h-9 w-9 items-center justify-center border border-[#1d1d1b] font-mono text-sm transition hover:bg-[#1d1d1b] hover:text-white">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(d=>
                <div key={d} className="py-2 font-mono text-xs text-[#5b574f]">{d}</div>
              )}
              {daysArr.map((d,i)=>{
                const ds=cy+'-'+String(cm+1).padStart(2,'0')+'-'+String(d.n).padStart(2,'0');
                const hasSlots=slots.some(s=>s.slot_date===ds);
                const isToday=!d.off&&d.n===today.getDate()&&cm===today.getMonth()&&cy===today.getFullYear();
                return<button key={i} type="button" disabled={!d.ok} onClick={()=>d.ok&&setSelDate(ds)}
                  className={`py-3 text-sm font-mono transition ${
                    d.off?'':
                    isToday?'bg-[#1d1d1b] text-white font-bold':
                    hasSlots?'bg-[#bd4f2d] text-white font-bold hover:bg-[#913a20]':
                    'bg-white border border-[#c9c1b4] hover:bg-[#e2ddd2]'
                  }`}>{d.off?'':d.n}</button>
              })}
            </div>
          </div>
        ) : (
          <div>
            <button onClick={()=>setSelDate('')}
              className="mb-6 font-mono text-xs uppercase tracking-wider underline underline-offset-4 transition hover:text-[#bd4f2d]">&larr; Voltar ao calendário</button>
            <h2 className="mb-6 font-display text-3xl uppercase">{new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',day:'numeric',month:'long',year:'numeric'}).format(new Date(selDate+'T12:00:00-03:00'))}</h2>
            <div className="overflow-x-auto bg-white shadow-sm">
              <table className="w-full min-w-175 text-left">
                <thead>
                  <tr className="border-b-2 border-[#1d1d1b] font-mono text-xs uppercase tracking-wider text-[#5b574f]">
                    <th className="px-4 py-3 font-medium">Horário</th>
                    <th className="px-4 py-3 font-medium">Bloqueado</th>
                  </tr>
                </thead>
                <tbody>
                  {times.map(t=>{
                    const on=daySlots.some(s=>s.slot_time.slice(0,5)===t);
                    return<tr key={t} className="border-b border-[#c9c1b4] last:border-0 hover:bg-[#ede9e1]/50">
                      <td className="px-4 py-2.5 font-mono text-sm">{t}</td>
                      <td className="px-4 py-2.5">
                        <button onClick={()=>toggleSlot(selDate,t)}
                          className={`w-24 py-2 text-xs font-mono uppercase tracking-wider border transition ${
                            on?'bg-[#bd4f2d] text-white border-[#bd4f2d]':
                            'bg-white text-[#5b574f] border-[#c9c1b4] hover:border-[#1d1d1b]'
                          }`}>{on?'BLOQ':'LIVRE'}</button>
                      </td>
                    </tr>
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
