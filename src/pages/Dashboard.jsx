import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

const RED='#E4002B', DARK='#1A0A0A', WARM='#FFF5F0', S='#fff', S2='#FFF8F6', S3='#F5F0EE'
const BD='#E8DDD9', T2='#5C4A44', T3='#9C8680'
const OK='#16A34A', WARN='#D97706', DANGER='#DC2626'
const DIMS = ['Engagement','Pertenencia','Recursos','Apoyo del Jefe','Bienestar','Expectativas','Reconocimiento','Permanencia']
const AREAS_F = ['Operaciones','RRHH','Finanzas','Sistemas','Planta Bogotá - Operativo','Plantas CAR','Planta Medellín - Operativo','Domicilios','Auditoría','Mercadeo']
const colS = v => v>=70 ? OK : v>=55 ? WARN : DANGER
const OPEN_QUESTIONS = [
  { section: 1, dim:'Engagement',      label:'¿Qué te hace sentir valorado/a e incluido/a?' },
  { section: 3, dim:'Recursos',        label:'¿Qué habilidad te gustaría desarrollar?' },
  { section: 4, dim:'Apoyo del Jefe',  label:'¿Cómo facilita o dificulta tu jefe tu crecimiento?' },
  { section: 5, dim:'Bienestar',       label:'¿Qué podría hacer KFC por tu bienestar emocional?' },
  { section: 7, dim:'Reconocimiento',  label:'¿Cómo te gustaría ser reconocido/a?' },
  { section: 8, dim:'Permanencia',     label:'¿Qué acción propondrías para mejorar tu experiencia?' },
]

const STOPWORDS = new Set(['el','la','los','las','un','una','unos','unas','de','del','al','en','con','por','para','que','se','me','mi','tu','su','nos','es','son','fue','ser','estar','hay','más','pero','como','si','no','lo','le','les','y','a','o','e','u','muy','todo','toda','todos','todas','este','esta','estos','estas','ese','esa','esos','esas','aquel','aquella','ya','bien','cuando','donde','quien','cual','cuales','porque','aunque','sino','también','tampoco','así','aquí','allí','ahí','hoy','ayer','mañana','siempre','nunca','vez','veces','cada','otro','otra','otros','otras','mismo','misma','tanto','tan','solo','sólo','hacer','tiene','tengo','tenemos','pueden','poder','debe','deben','quiero','quiere','mucho','poco','algo','nada','entre','sobre','bajo','ante','tras','durante','mediante','según'])

function getTopWords(texts, topN = 40) {
  const freq = {}
  texts.forEach(text => {
    if (!text) return
    const words = text.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-záéíóúüñ\s]/gi, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !STOPWORDS.has(w))
    words.forEach(w => { freq[w] = (freq[w] || 0) + 1 })
  })
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word, count]) => ({ word, count }))
}

function card(extra={}) { return { background:S, borderRadius:12, padding:16, boxShadow:'0 2px 10px rgba(228,0,43,0.07)', ...extra } }

export default function Dashboard({ setUser }) {
  const [tab, setTab]         = useState('dash')
  const [fArea, setFArea]     = useState('')
  const [fTenure, setFTenure] = useState('')
  const [kpis, setKpis]       = useState(null)
  const [dims, setDims]       = useState([])
  const [areas, setAreas]     = useState([])
  const [loading, setLoading] = useState(true)
  const [wordData, setWordData] = useState([])
  const [loadingWords, setLoadingWords] = useState(false)
  const [selectedQ, setSelectedQ] = useState('')
  const [qWordData, setQWordData] = useState([])
  const [loadingQWords, setLoadingQWords] = useState(false)
  const [qResponseCount, setQResponseCount] = useState(0)

  const logout = async () => { await supabase.auth.signOut() }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      let q = supabase.from('responses')
        .select('section_id,question_index,question_type,likert_value,nps_value,survey_sessions!inner(area,tenure_range,completed)')
        .eq('survey_sessions.completed', true)
      if (fArea)   q = q.eq('survey_sessions.area', fArea)
      if (fTenure) q = q.eq('survey_sessions.tenure_range', fTenure)
      const { data: rows } = await q

      const lk1   = (rows||[]).filter(r=>r.question_type==='likert'&&r.section_id===1&&r.likert_value)
      const lkAll = (rows||[]).filter(r=>r.question_type==='likert'&&r.likert_value)
      const lkFav = lkAll.filter(r=>[4,5].includes(r.likert_value))
      const npsR  = (rows||[]).filter(r=>r.question_type==='nps'&&r.nps_value!==null)
      const prom  = npsR.filter(r=>r.nps_value>=9).length
      const det   = npsR.filter(r=>r.nps_value<=6).length
      const engAvg = lk1.length ? lk1.reduce((s,r)=>s+r.likert_value,0)/lk1.length : 0
      const { count:total } = await supabase.from('survey_sessions').select('*',{count:'exact',head:true}).eq('completed',true)

      setKpis({
        engagement:   Math.round(((engAvg-1)/4)*100),
        favorability: lkAll.length ? Math.round((lkFav.length/lkAll.length)*100) : 0,
        enps:         npsR.length  ? Math.round(((prom-det)/npsR.length)*100) : 0,
        total:        total||0,
        promPct:      npsR.length  ? Math.round((prom/npsR.length)*100) : 0,
        detPct:       npsR.length  ? Math.round((det/npsR.length)*100)  : 0,
      })

      const dimScores = DIMS.map((name,idx) => {
        const sr = (rows||[]).filter(r=>r.section_id===idx+1&&r.question_type==='likert'&&r.likert_value)
        if(!sr.length) return {name,score:0,favorable:0,neutral:0,unfavorable:0}
        const avg = sr.reduce((s,r)=>s+r.likert_value,0)/sr.length
        return {
          name, score: Math.round(((avg-1)/4)*100),
          favorable:   Math.round(sr.filter(r=>[4,5].includes(r.likert_value)).length/sr.length*100),
          neutral:     Math.round(sr.filter(r=>r.likert_value===3).length/sr.length*100),
          unfavorable: Math.round(sr.filter(r=>[1,2].includes(r.likert_value)).length/sr.length*100),
        }
      })
      setDims(dimScores)

      if(!fArea) {
        const {data:sessions} = await supabase.from('survey_sessions').select('id,area').eq('completed',true)
        const {data:engR} = await supabase.from('responses').select('session_id,likert_value').eq('section_id',1).eq('question_type','likert')
        const areaMap={}
        ;(sessions||[]).forEach(s=>{if(!areaMap[s.area])areaMap[s.area]=[];areaMap[s.area].push(s.id)})
        const ranking = Object.entries(areaMap).map(([area,ids])=>{
          const ar=(engR||[]).filter(r=>ids.includes(r.session_id)&&r.likert_value)
          const avg=ar.length?ar.reduce((s,r)=>s+r.likert_value,0)/ar.length:0
          return {area,score:Math.round(((avg-1)/4)*100),n:ids.length}
        }).sort((a,b)=>b.score-a.score)
        setAreas(ranking)
      }
    } catch(e){ console.error(e) }
    setLoading(false)
  }, [fArea, fTenure])

  const loadWords = useCallback(async () => {
    setLoadingWords(true)
    try {
      let q = supabase.from('responses')
        .select('open_text, survey_sessions!inner(area,completed)')
        .eq('question_type','open')
        .eq('survey_sessions.completed', true)
        .not('open_text','is',null)
      if (fArea) q = q.eq('survey_sessions.area', fArea)
      const { data } = await q
      const texts = (data||[]).map(r=>r.open_text).filter(Boolean)
      const words = getTopWords(texts, 40)
      setWordData(words)
    } catch(e){ console.error(e) }
    setLoadingWords(false)
  }, [fArea])
  const loadQWords = useCallback(async () => {
    if (!selectedQ) return
    setLoadingQWords(true)
    try {
      let q = supabase.from('responses')
        .select('open_text, survey_sessions!inner(area,completed)')
        .eq('question_type','open')
        .eq('section_id', parseInt(selectedQ))
        .eq('survey_sessions.completed', true)
        .not('open_text','is',null)
      if (fArea) q = q.eq('survey_sessions.area', fArea)
      const { data } = await q
      const texts = (data||[]).map(r=>r.open_text).filter(Boolean)
      setQResponseCount(texts.length)
      setQWordData(getTopWords(texts, 30))
    } catch(e){ console.error(e) }
    setLoadingQWords(false)
  }, [selectedQ, fArea])

  useEffect(() => { loadQWords() }, [loadQWords])

  useEffect(()=>{ loadData(); loadWords() }, [loadData, loadWords])

  const navBtn = (id,label) => (
    <button onClick={()=>setTab(id)} style={{ padding:'5px 13px', borderRadius:7, border:'none', background: tab===id ? 'rgba(228,0,43,0.25)' : 'transparent', color: tab===id ? '#fff' : 'rgba(255,255,255,0.5)', fontSize:12, fontWeight:600, cursor:'pointer' }}>{label}</button>
  )

  const WORD_COLORS = [RED,'#FF6B35','#8B5CF6','#0EA5E9',OK,WARN,'#EC4899','#14B8A6']
  const maxCount = wordData.length ? wordData[0].count : 1
  const minCount = wordData.length ? wordData[wordData.length-1].count : 1

  return (
    <div style={{ minHeight:'100vh', background:WARM }}>
      <nav style={{ position:'sticky', top:0, zIndex:50, background:DARK, height:50, display:'flex', alignItems:'center', padding:'0 16px', gap:10 }}>
        <span style={{ background:RED, color:'#fff', fontWeight:800, fontSize:13, padding:'2px 8px', borderRadius:5 }}>KFC</span>
        <span style={{ color:'rgba(255,255,255,0.9)', fontWeight:700, fontSize:15 }}>Listen</span>
        <div style={{ display:'flex', gap:3, marginLeft:'auto' }}>
          {navBtn('dash','📊 Dashboard')}
          {navBtn('voz','💬 Voz del Empleado')}
          <button onClick={logout} style={{ marginLeft:8, background:'transparent', border:'none', color:'rgba(255,255,255,0.4)', fontSize:12, cursor:'pointer' }}>Salir</button>
        </div>
      </nav>

      {tab==='dash' && (
        <div style={{ padding:16, maxWidth:1000, margin:'0 auto' }}>
          <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'space-between', alignItems:'flex-start', gap:10, marginBottom:16 }}>
            <div>
              <h1 style={{ fontSize:18, fontWeight:700, color:DARK }}>Dashboard ejecutivo · People Analytics</h1>
              <p style={{ fontSize:11, color:T3, marginTop:3 }}>KFC Listen · {kpis?.total||0} respuestas registradas</p>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, alignItems:'center' }}>
              <select value={fArea} onChange={e=>setFArea(e.target.value)} style={{ padding:'6px 12px', border: fArea ? `2px solid ${RED}` : `1.5px solid ${BD}`, borderRadius:99, fontSize:11, color: fArea ? RED : T2, background: fArea ? '#FFF0EF' : S, outline:'none', fontWeight: fArea ? 700 : 400, cursor:'pointer' }}>
                <option value="">Todas las áreas</option>
                {AREAS_F.map(a=><option key={a}>{a}</option>)}
              </select>
              <select value={fTenure} onChange={e=>setFTenure(e.target.value)} style={{ padding:'6px 12px', border:`1.5px solid ${BD}`, borderRadius:99, fontSize:11, color:T2, background:S, outline:'none', cursor:'pointer' }}>
                <option value="">Toda la antigüedad</option>
                {['Menos de 6 meses','6 meses – 1 año','1 – 2 años','2 – 4 años','Más de 4 años'].map(t=><option key={t}>{t}</option>)}
              </select>
              {(fArea||fTenure) && <button onClick={()=>{setFArea('');setFTenure('')}} style={{ fontSize:11, color:RED, background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>✕ Quitar</button>}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign:'center', padding:'60px 0', color:T3 }}>
              <div style={{ fontSize:32, marginBottom:10 }}>📊</div>
              <p style={{ fontSize:13 }}>Cargando datos desde Supabase…</p>
            </div>
          ) : (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
                {[
                  {l:'Engagement',    v:`${kpis?.engagement||0}%`,  tr:'Score general',                          c:RED,      p:kpis?.engagement},
                  {l:'Favorabilidad', v:`${kpis?.favorability||0}%`,tr:'Resp. 4–5 sobre total',                  c:'#FF6B35',p:kpis?.favorability},
                  {l:'eNPS',          v:`${kpis?.enps>=0?'+':''}${kpis?.enps||0}`, tr:`Prom.${kpis?.promPct||0}% Det.${kpis?.detPct||0}%`, c:'#8B5CF6',p:null},
                  {l:'Riesgo Rotación',v:kpis?.engagement>=70?'Bajo':kpis?.engagement>=55?'Medio':'Alto', tr:'Índice ponderado', c:kpis?.engagement>=70?OK:kpis?.engagement>=55?WARN:DANGER, p:null, sem:true, semC:kpis?.engagement>=70?'#DCFCE7;#166534':kpis?.engagement>=55?'#FEF9C3;#92400E':'#FEE2E2;#991B1B'}
                ].map((k,i)=>(
                  <div key={i} style={{ ...card(), position:'relative', overflow:'hidden' }}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:k.c, borderRadius:'12px 12px 0 0' }} />
                    <div style={{ fontSize:10, color:T3, textTransform:'uppercase', letterSpacing:'0.3px', marginBottom:6 }}>{k.l}</div>
                    {k.sem
                      ? <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:700, background:k.semC.split(';')[0], color:k.semC.split(';')[1] }}>● {k.v}</span>
                      : <span style={{ fontSize:24, fontWeight:700, color:DARK }}>{k.v}</span>
                    }
                    <div style={{ fontSize:10, color:T3, marginTop:3 }}>{k.tr}</div>
                    {k.p!==null && <div style={{ height:3, background:S3, borderRadius:99, marginTop:8, overflow:'hidden' }}><div style={{ height:'100%', width:`${k.p}%`, background:k.c, borderRadius:99 }} /></div>}
                  </div>
                ))}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                <div style={card()}>
                  <p style={{ fontSize:12, fontWeight:600, marginBottom:12 }}>😊 Sentimiento por dimensión</p>
                  {(dims.length?dims:DIMS.map(d=>({name:d,favorable:0,neutral:0,unfavorable:0}))).map(d=>(
                    <div key={d.name} style={{ marginBottom:9 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, marginBottom:3 }}>
                        <span style={{ fontWeight:600 }}>{d.name}</span>
                        <span style={{ color:T3 }}>{d.favorable}% · {d.neutral}% · {d.unfavorable}%</span>
                      </div>
                      <div style={{ display:'flex', height:8, borderRadius:99, overflow:'hidden', gap:1 }}>
                        <div style={{ width:`${d.favorable}%`, background:OK }} />
                        <div style={{ width:`${d.neutral}%`, background:WARN }} />
                        <div style={{ width:`${d.unfavorable}%`, background:DANGER }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ display:'flex', gap:12, marginTop:8, paddingTop:8, borderTop:`1px solid ${BD}` }}>
                    {[[OK,'Favorable'],[WARN,'Neutral'],[DANGER,'Desfavorable']].map(([c,l])=>(
                      <div key={l} style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:T2 }}>
                        <div style={{ width:10, height:10, borderRadius:2, background:c }} />{l}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={card()}>
                  <p style={{ fontSize:12, fontWeight:600, marginBottom:12 }}>🕸 Dimensiones de engagement</p>
                  <RadarChart dims={DIMS} values={dims.length?dims.map(d=>d.score):DIMS.map(()=>0)} />
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                <div style={card()}>
                  <p style={{ fontSize:12, fontWeight:600, marginBottom:12 }}>{fArea?`📍 ${fArea}`:'🏆 Ranking de áreas'}</p>
                  {fArea ? (
                    <div>
                      <div style={{ textAlign:'center', padding:'10px 0' }}>
                        <p style={{ fontSize:10, color:T3, marginBottom:4 }}>Posición en ranking general</p>
                        <p style={{ fontSize:36, fontWeight:700, color:RED }}>#{areas.findIndex(a=>a.area===fArea)+1||'?'}</p>
                        <p style={{ fontSize:11, color:T2 }}>de {areas.length} áreas</p>
                      </div>
                      <div style={{ background:S2, borderRadius:10, padding:'10px 12px' }}>
                        <p style={{ fontSize:11, fontWeight:700, color:RED, marginBottom:4 }}>{fArea}</p>
                        <p style={{ fontSize:22, fontWeight:700, color:colS(areas.find(a=>a.area===fArea)?.score||0) }}>{areas.find(a=>a.area===fArea)?.score||0}%</p>
                      </div>
                    </div>
                  ) : areas.length ? areas.map((a,i)=>(
                    <div key={a.area} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:RED, width:14 }}>{i+1}</span>
                      <span style={{ flex:1, fontSize:11 }}>{a.area}</span>
                      <div style={{ width:80, height:5, background:S3, borderRadius:99, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${a.score}%`, background:colS(a.score), borderRadius:99 }} />
                      </div>
                      <span style={{ fontSize:11, fontWeight:600, width:28, textAlign:'right', color:colS(a.score) }}>{a.score}%</span>
                    </div>
                  )) : <p style={{ fontSize:12, color:T3, textAlign:'center', padding:'20px 0' }}>Sin datos aún.</p>}
                </div>
                <div style={card()}>
                  <p style={{ fontSize:12, fontWeight:600, marginBottom:12 }}>💬 Distribución eNPS</p>
                  {[['Promotores (9-10)',kpis?.promPct||0,OK],['Pasivos (7-8)',Math.max(0,100-(kpis?.promPct||0)-(kpis?.detPct||0)),WARN],['Detractores (0-6)',kpis?.detPct||0,DANGER]].map(([l,v,c])=>(
                    <div key={l} style={{ marginBottom:10 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, marginBottom:3 }}>
                        <span style={{ fontWeight:600, color:c }}>{l}</span>
                        <span style={{ fontWeight:700 }}>{v}%</span>
                      </div>
                      <div style={{ height:8, background:S3, borderRadius:99, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${v}%`, background:c, borderRadius:99 }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ background:S2, borderRadius:8, padding:'10px', textAlign:'center', marginTop:8 }}>
                    <p style={{ fontSize:10, color:T3, marginBottom:2 }}>% Promotores − % Detractores</p>
                    <p style={{ fontSize:26, fontWeight:700, color:(kpis?.enps||0)>=0?OK:DANGER }}>{(kpis?.enps||0)>=0?'+':''}{kpis?.enps||0}</p>
                  </div>
                </div>
              </div>

              <div style={card({ marginBottom:14 })}>
                <p style={{ fontSize:12, fontWeight:600, marginBottom:12 }}>🧮 Fórmulas de cálculo</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, fontSize:11, color:T2, lineHeight:1.7 }}>
                  {[['Engagement Score','((prom. Likert dim.1 − 1) / 4) × 100'],['Favorabilidad','(resp. 4+5 / total) × 100'],['eNPS','% Promotores (9-10) − % Detractores (0-6)'],['Riesgo Rotación','Perm.×0.30 + eNPS×0.25 + Jefe×0.20 + Recon.×0.15 + Bien.×0.10']].map(([t,f])=>(
                    <div key={t}><strong style={{ color:DARK }}>{t}</strong><br/><code style={{ background:S3, padding:'2px 5px', borderRadius:4, fontSize:10 }}>{f}</code></div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
      
{tab==='voz' && (
        <div style={{ padding:16, maxWidth:1000, margin:'0 auto' }}>
          <h2 style={{ fontSize:18, fontWeight:700, color:DARK, marginBottom:4 }}>💬 Voz del Empleado</h2>
          <p style={{ fontSize:11, color:T3, marginBottom:16 }}>Análisis de respuestas abiertas · Palabras más frecuentes de los colaboradores</p>

          <div style={card({ marginBottom:14 })}>
            <p style={{ fontSize:12, fontWeight:600, marginBottom:10 }}>🔍 Ver nube por pregunta específica</p>
            <select value={selectedQ} onChange={e=>setSelectedQ(e.target.value)}
              style={{ width:'100%', padding:'10px 12px', border:`1.5px solid ${BD}`, borderRadius:10, fontSize:12, color:T2, background:S, outline:'none', cursor:'pointer' }}>
              <option value="">Todas las preguntas (vista general)</option>
              {OPEN_QUESTIONS.map(q => (
                <option key={q.section} value={q.section}>{q.dim} — {q.label}</option>
              ))}
            </select>
            {selectedQ && (
              <div style={{ marginTop:14 }}>
                {loadingQWords ? (
                  <div style={{ textAlign:'center', padding:'30px 0', color:T3 }}>
                    <p style={{ fontSize:12 }}>Analizando esta pregunta…</p>
                  </div>
                ) : qWordData.length === 0 ? (
                  <p style={{ fontSize:12, color:T3, textAlign:'center', padding:'20px 0' }}>Sin respuestas todavía para esta pregunta.</p>
                ) : (
                  <>
                    <p style={{ fontSize:11, color:T3, marginBottom:10 }}>{qWordData.reduce((s,w)=>s+w.count,0)} menciones · {qResponseCount} respuestas a esta pregunta</p>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:7, alignItems:'center', justifyContent:'center', padding:'10px 0', background:S2, borderRadius:10 }}>
                      {qWordData.map((item, i) => {
                        const qMax = qWordData[0]?.count || 1
                        const qMin = qWordData[qWordData.length-1]?.count || 1
                        const ratio = (item.count - qMin) / Math.max(qMax - qMin, 1)
                        const fontSize = Math.round(11 + ratio * 18)
                        const color = WORD_COLORS[i % WORD_COLORS.length]
                        return (
                          <span key={item.word} title={`${item.count} menciones`} style={{ fontSize, fontWeight: ratio > 0.5 ? 700 : 500, color, background:`${color}15`, padding:'4px 10px', borderRadius:99 }}>
                            {item.word}
                          </span>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {loadingWords ? (
            <div style={{ textAlign:'center', padding:'40px 0', color:T3 }}>
              <div style={{ fontSize:28, marginBottom:8 }}>💬</div>
              <p style={{ fontSize:13 }}>Analizando respuestas…</p>
            </div>
          ) : wordData.length === 0 ? (
            <div style={card({ textAlign:'center', padding:'40px' })}>
              <div style={{ fontSize:32, marginBottom:10 }}>📝</div>
              <p style={{ fontSize:14, color:T2, marginBottom:6 }}>Sin respuestas abiertas aún</p>
              <p style={{ fontSize:12, color:T3 }}>Las palabras clave aparecerán aquí cuando los colaboradores respondan las preguntas abiertas.</p>
            </div>
          ) : (
            <>
              <div style={card({ marginBottom:14 })}>
                <p style={{ fontSize:12, fontWeight:600, marginBottom:4 }}>☁️ Nube general · todas las preguntas</p>
                <p style={{ fontSize:11, color:T3, marginBottom:14 }}>Tamaño = frecuencia · {wordData.reduce((s,w)=>s+w.count,0)} menciones totales</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, alignItems:'center', justifyContent:'center', padding:'10px 0' }}>
                  {wordData.map((item, i) => {
                    const ratio = (item.count - minCount) / Math.max(maxCount - minCount, 1)
                    const fontSize = Math.round(11 + ratio * 20)
                    const color = WORD_COLORS[i % WORD_COLORS.length]
                    return (
                      <span key={item.word} title={`${item.count} menciones`} style={{ fontSize, fontWeight: ratio > 0.5 ? 700 : 500, color, background:`${color}15`, padding:'4px 10px', borderRadius:99, cursor:'default', transition:'transform 0.2s' }}
                        onMouseEnter={e=>e.target.style.transform='scale(1.1)'}
                        onMouseLeave={e=>e.target.style.transform='scale(1)'}>
                        {item.word}
                      </span>
                    )
                  })}
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                <div style={card()}>
                  <p style={{ fontSize:12, fontWeight:600, marginBottom:12 }}>📊 Palabras más mencionadas</p>
                  {wordData.slice(0,15).map((item,i) => (
                    <div key={item.word} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:RED, width:18 }}>{i+1}</span>
                      <span style={{ flex:1, fontSize:11, textTransform:'capitalize' }}>{item.word}</span>
                      <div style={{ width:80, height:5, background:S3, borderRadius:99, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${(item.count/maxCount)*100}%`, background:WORD_COLORS[i%WORD_COLORS.length], borderRadius:99 }} />
                      </div>
                      <span style={{ fontSize:10, fontWeight:600, color:T3, width:24, textAlign:'right' }}>{item.count}</span>
                    </div>
                  ))}
                </div>
                <div style={card()}>
                  <p style={{ fontSize:12, fontWeight:600, marginBottom:12 }}>📋 Resumen del análisis</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    <div style={{ background:S2, borderRadius:10, padding:'12px 14px' }}>
                      <p style={{ fontSize:10, color:T3, marginBottom:3 }}>TOTAL MENCIONES</p>
                      <p style={{ fontSize:22, fontWeight:700, color:DARK }}>{wordData.reduce((s,w)=>s+w.count,0)}</p>
                      <p style={{ fontSize:10, color:T3 }}>palabras clave analizadas</p>
                    </div>
                    <div style={{ background:S2, borderRadius:10, padding:'12px 14px' }}>
                      <p style={{ fontSize:10, color:T3, marginBottom:3 }}>PALABRA MÁS MENCIONADA</p>
                      <p style={{ fontSize:18, fontWeight:700, color:RED, textTransform:'capitalize' }}>{wordData[0]?.word || '—'}</p>
                      <p style={{ fontSize:10, color:T3 }}>{wordData[0]?.count || 0} veces</p>
                    </div>
                    <div style={{ background:S2, borderRadius:10, padding:'12px 14px' }}>
                      <p style={{ fontSize:10, color:T3, marginBottom:6 }}>TOP 5 CONCEPTOS</p>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                        {wordData.slice(0,5).map((item,i)=>(
                          <span key={item.word} style={{ padding:'3px 9px', borderRadius:99, fontSize:11, fontWeight:600, background:`${WORD_COLORS[i]}20`, color:WORD_COLORS[i] }}>{item.word}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display:'flex', justifyContent:'center' }}>
                <button onClick={loadWords} style={{ padding:'8px 20px', background:S, border:`1.5px solid ${BD}`, borderRadius:99, fontSize:12, color:T2, cursor:'pointer' }}>
                  🔄 Actualizar análisis
                </button>
              </div>
            </>
          )}
        </div>
      )}

function RadarChart({ dims, values }) {
  const r=80, n=dims.length
  const pts = values.map((v,i)=>{ const a=(i/n)*Math.PI*2-Math.PI/2; return `${r*(v/100)*Math.cos(a)},${r*(v/100)*Math.sin(a)}` }).join(' ')
  return (
    <svg viewBox="0 0 220 200" style={{ width:'100%' }}>
      <g transform="translate(110,100)">
        {[0.25,0.5,0.75,1].map(f=>{
          const p=dims.map((_,i)=>{ const a=(i/n)*Math.PI*2-Math.PI/2; return `${r*f*Math.cos(a)},${r*f*Math.sin(a)}` }).join(' ')
          return <polygon key={f} points={p} fill="none" stroke="#E8DDD9" strokeWidth="0.5" />
        })}
        {dims.map((_,i)=>{ const a=(i/n)*Math.PI*2-Math.PI/2; const lx=(r+14)*Math.cos(a),ly=(r+14)*Math.sin(a)
          return <g key={i}><line x1="0" y1="0" x2={r*Math.cos(a)} y2={r*Math.sin(a)} stroke="#E8DDD9" strokeWidth="0.5"/><text x={lx} y={ly+3} textAnchor="middle" fontSize="7" fill="#9C8680">{dims[i]}</text></g>
        })}
        <polygon points={pts} fill="rgba(228,0,43,0.12)" stroke="#E4002B" strokeWidth="2" />
        {values.map((v,i)=>{ const a=(i/n)*Math.PI*2-Math.PI/2; return <circle key={i} cx={r*(v/100)*Math.cos(a)} cy={r*(v/100)*Math.sin(a)} r="3" fill="#E4002B" /> })}
      </g>
    </svg>
  )
}
