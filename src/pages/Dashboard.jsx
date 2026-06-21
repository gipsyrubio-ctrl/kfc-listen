import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

const RED='#E4002B', DARK='#1A0A0A', WARM='#FFF5F0', S='#fff', S2='#FFF8F6', S3='#F5F0EE'
const BD='#E8DDD9', T2='#5C4A44', T3='#9C8680'
const OK='#16A34A', WARN='#D97706', DANGER='#DC2626'
const DIMS = ['Engagement','Pertenencia','Recursos','Apoyo del Jefe','Bienestar','Expectativas','Reconocimiento']
const AREAS_F = ['Domicilios','Financiera y Contable','Desarrollo y Expansión','Sistemas','Recursos Humanos','Auditoría','Planta Bogotá - Operativo','Plantas CAR','Planta Medellín - Operativo','Mantenimiento','Entrenamiento','Operaciones','Mercadeo']
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

function getTopWords(texts, topN) {
  if (!topN) topN = 40
  const freq = {}
  texts.forEach(function(text) {
    if (!text) return
    const words = text.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-záéíóúüñ\s]/gi, ' ')
      .split(/\s+/)
      .filter(function(w) { return w.length > 3 && !STOPWORDS.has(w) })
    words.forEach(function(w) { freq[w] = (freq[w] || 0) + 1 })
  })
  return Object.entries(freq)
    .sort(function(a, b) { return b[1] - a[1] })
    .slice(0, topN)
    .map(function(entry) { return { word: entry[0], count: entry[1] } })
}

function card(extra) {
  const base = { background:S, borderRadius:12, padding:16, boxShadow:'0 2px 10px rgba(228,0,43,0.07)' }
  return Object.assign(base, extra || {})
}

const WORD_COLORS = [RED,'#FF6B35','#8B5CF6','#0EA5E9',OK,WARN,'#EC4899','#14B8A6']

function KPICards(props) {
  const kpis = props.kpis
  const items = [
    {l:'Engagement',    v:(kpis ? kpis.engagement : 0) + '%',  tr:'Score general',  c:RED,      p: kpis ? kpis.engagement : 0},
    {l:'Favorabilidad', v:(kpis ? kpis.favorability : 0) + '%',tr:'Resp. 4–5 sobre total', c:'#FF6B35', p: kpis ? kpis.favorability : 0},
    {l:'eNPS', v:((kpis && kpis.enps>=0)?'+':'') + (kpis ? kpis.enps : 0), tr:'Prom.'+(kpis?kpis.promPct:0)+'% Det.'+(kpis?kpis.detPct:0)+'%', c:'#8B5CF6', p:null},
  ]
  const eng = kpis ? kpis.engagement : 0
  const riskLabel = eng>=70?'Bajo':eng>=55?'Medio':'Alto'
  const riskColor = eng>=70?OK:eng>=55?WARN:DANGER
  const riskBg = eng>=70?'#DCFCE7':eng>=55?'#FEF9C3':'#FEE2E2'
  const riskText = eng>=70?'#166534':eng>=55?'#92400E':'#991B1B'

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
      {items.map(function(k, i) {
        return (
          <div key={i} style={Object.assign(card(), { position:'relative', overflow:'hidden' })}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:k.c, borderRadius:'12px 12px 0 0' }} />
            <div style={{ fontSize:10, color:T3, textTransform:'uppercase', letterSpacing:'0.3px', marginBottom:6 }}>{k.l}</div>
            <span style={{ fontSize:24, fontWeight:700, color:DARK }}>{k.v}</span>
            <div style={{ fontSize:10, color:T3, marginTop:3 }}>{k.tr}</div>
            {k.p !== null ? (
              <div style={{ height:3, background:S3, borderRadius:99, marginTop:8, overflow:'hidden' }}>
                <div style={{ height:'100%', width:k.p+'%', background:k.c, borderRadius:99 }} />
              </div>
            ) : null}
          </div>
        )
      })}
      <div style={Object.assign(card(), { position:'relative', overflow:'hidden' })}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:riskColor, borderRadius:'12px 12px 0 0' }} />
        <div style={{ fontSize:10, color:T3, textTransform:'uppercase', letterSpacing:'0.3px', marginBottom:6 }}>Riesgo Rotación</div>
        <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:700, background:riskBg, color:riskText }}>● {riskLabel}</span>
        <div style={{ fontSize:10, color:T3, marginTop:3 }}>Índice ponderado</div>
      </div>
    </div>
  )
}

function PermanenceCard(props) {
  const perm = props.perm || { yesPct: 0, noPct: 0, total: 0 }
  return (
    <div style={card()}>
      <p style={{ fontSize:12, fontWeight:600, marginBottom:12 }}>🔄 Intención de Permanencia</p>
      <p style={{ fontSize:10, color:T3, marginBottom:12 }}>¿Te gustaría continuar trabajando en KFC? · {perm.total} respuestas</p>
      <div style={{ display:'flex', gap:10 }}>
        <div style={{ flex:1, background:'#F0FDF4', borderRadius:10, padding:'14px', textAlign:'center' }}>
          <p style={{ fontSize:26, fontWeight:700, color:OK }}>{perm.yesPct}%</p>
          <p style={{ fontSize:11, color:T2, fontWeight:600 }}>Sí, quiere quedarse</p>
        </div>
        <div style={{ flex:1, background:'#FEF2F2', borderRadius:10, padding:'14px', textAlign:'center' }}>
          <p style={{ fontSize:26, fontWeight:700, color:DANGER }}>{perm.noPct}%</p>
          <p style={{ fontSize:11, color:T2, fontWeight:600 }}>No, no se ve quedándose</p>
        </div>
      </div>
      <div style={{ display:'flex', height:10, borderRadius:99, overflow:'hidden', marginTop:12, gap:1 }}>
        <div style={{ width:perm.yesPct+'%', background:OK }} />
        <div style={{ width:perm.noPct+'%', background:DANGER }} />
      </div>
    </div>
  )
}

function SentimentCard(props) {
  const dims = props.dims && props.dims.length ? props.dims : DIMS.map(function(d){ return {name:d,favorable:0,neutral:0,unfavorable:0} })
  return (
    <div style={card()}>
      <p style={{ fontSize:12, fontWeight:600, marginBottom:12 }}>😊 Sentimiento por dimensión</p>
      {dims.map(function(d) {
        return (
          <div key={d.name} style={{ marginBottom:9 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, marginBottom:3 }}>
              <span style={{ fontWeight:600 }}>{d.name}</span>
              <span style={{ color:T3 }}>{d.favorable}% · {d.neutral}% · {d.unfavorable}%</span>
            </div>
            <div style={{ display:'flex', height:8, borderRadius:99, overflow:'hidden', gap:1 }}>
              <div style={{ width:d.favorable+'%', background:OK }} />
              <div style={{ width:d.neutral+'%', background:WARN }} />
              <div style={{ width:d.unfavorable+'%', background:DANGER }} />
            </div>
          </div>
        )
      })}
      <div style={{ display:'flex', gap:12, marginTop:8, paddingTop:8, borderTop:'1px solid '+BD }}>
        <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:T2 }}><div style={{ width:10, height:10, borderRadius:2, background:OK }} />Favorable</div>
        <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:T2 }}><div style={{ width:10, height:10, borderRadius:2, background:WARN }} />Neutral</div>
        <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:T2 }}><div style={{ width:10, height:10, borderRadius:2, background:DANGER }} />Desfavorable</div>
      </div>
    </div>
  )
}

function RankingCard(props) {
  const fArea = props.fArea
  const areas = props.areas || []
  if (fArea) {
    const idx = areas.findIndex(function(a){ return a.area === fArea })
    const found = areas.find(function(a){ return a.area === fArea })
    const score = found ? found.score : 0
    return (
      <div style={card()}>
        <p style={{ fontSize:12, fontWeight:600, marginBottom:12 }}>📍 {fArea}</p>
        <div style={{ textAlign:'center', padding:'10px 0' }}>
          <p style={{ fontSize:10, color:T3, marginBottom:4 }}>Posición en ranking general</p>
          <p style={{ fontSize:36, fontWeight:700, color:RED }}>#{idx>=0 ? idx+1 : '?'}</p>
          <p style={{ fontSize:11, color:T2 }}>de {areas.length} áreas</p>
        </div>
        <div style={{ background:S2, borderRadius:10, padding:'10px 12px' }}>
          <p style={{ fontSize:11, fontWeight:700, color:RED, marginBottom:4 }}>{fArea}</p>
          <p style={{ fontSize:22, fontWeight:700, color:colS(score) }}>{score}%</p>
        </div>
      </div>
    )
  }
  return (
    <div style={card()}>
      <p style={{ fontSize:12, fontWeight:600, marginBottom:12 }}>🏆 Ranking de áreas</p>
      {areas.length ? areas.map(function(a, i) {
        return (
          <div key={a.area} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
            <span style={{ fontSize:11, fontWeight:700, color:RED, width:14 }}>{i+1}</span>
            <span style={{ flex:1, fontSize:11 }}>{a.area}</span>
            <div style={{ width:80, height:5, background:S3, borderRadius:99, overflow:'hidden' }}>
              <div style={{ height:'100%', width:a.score+'%', background:colS(a.score), borderRadius:99 }} />
            </div>
            <span style={{ fontSize:11, fontWeight:600, width:28, textAlign:'right', color:colS(a.score) }}>{a.score}%</span>
          </div>
        )
      }) : <p style={{ fontSize:12, color:T3, textAlign:'center', padding:'20px 0' }}>Sin datos aún.</p>}
    </div>
  )
}

function ENPSCard(props) {
  const kpis = props.kpis
  const promPct = kpis ? kpis.promPct : 0
  const detPct = kpis ? kpis.detPct : 0
  const enps = kpis ? kpis.enps : 0
  const passivePct = Math.max(0, 100 - promPct - detPct)
  const rows = [
    ['Promotores (9-10)', promPct, OK],
    ['Pasivos (7-8)', passivePct, WARN],
    ['Detractores (0-6)', detPct, DANGER]
  ]
  return (
    <div style={card()}>
      <p style={{ fontSize:12, fontWeight:600, marginBottom:12 }}>💬 Distribución eNPS</p>
      {rows.map(function(row) {
        const label = row[0], val = row[1], color = row[2]
        return (
          <div key={label} style={{ marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, marginBottom:3 }}>
              <span style={{ fontWeight:600, color:color }}>{label}</span>
              <span style={{ fontWeight:700 }}>{val}%</span>
            </div>
            <div style={{ height:8, background:S3, borderRadius:99, overflow:'hidden' }}>
              <div style={{ height:'100%', width:val+'%', background:color, borderRadius:99 }} />
            </div>
          </div>
        )
      })}
      <div style={{ background:S2, borderRadius:8, padding:'10px', textAlign:'center', marginTop:8 }}>
        <p style={{ fontSize:10, color:T3, marginBottom:2 }}>% Promotores − % Detractores</p>
        <p style={{ fontSize:26, fontWeight:700, color: enps>=0?OK:DANGER }}>{enps>=0?'+':''}{enps}</p>
      </div>
    </div>
  )
}

function FormulasCard() {
  const formulas = [
    ['Engagement Score','((prom. Likert dim.1 − 1) / 4) × 100'],
    ['Favorabilidad','(resp. 4+5 / total) × 100'],
    ['eNPS','% Promotores (9-10) − % Detractores (0-6)'],
    ['Riesgo Rotación','Perm.×0.30 + eNPS×0.25 + Jefe×0.20 + Recon.×0.15 + Bien.×0.10']
  ]
  return (
    <div style={card({ marginBottom:14 })}>
      <p style={{ fontSize:12, fontWeight:600, marginBottom:12 }}>🧮 Fórmulas de cálculo</p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, fontSize:11, color:T2, lineHeight:1.7 }}>
        {formulas.map(function(f) {
          return (
            <div key={f[0]}>
              <strong style={{ color:DARK }}>{f[0]}</strong><br/>
              <code style={{ background:S3, padding:'2px 5px', borderRadius:4, fontSize:10 }}>{f[1]}</code>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DashTab(props) {
  const fArea = props.fArea, fTenure = props.fTenure
  const setFArea = props.setFArea, setFTenure = props.setFTenure
  const loading = props.loading, kpis = props.kpis, dims = props.dims, areas = props.areas, perm = props.perm

  return (
    <div style={{ padding:16, maxWidth:1000, margin:'0 auto' }}>
      <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'space-between', alignItems:'flex-start', gap:10, marginBottom:16 }}>
        <div>
          <h1 style={{ fontSize:18, fontWeight:700, color:DARK }}>Dashboard ejecutivo · People Analytics</h1>
          <p style={{ fontSize:11, color:T3, marginTop:3 }}>KFC Listen · {kpis ? kpis.total : 0} respuestas registradas</p>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, alignItems:'center' }}>
          <select value={fArea} onChange={function(e){ setFArea(e.target.value) }} style={{ padding:'6px 12px', border: fArea ? '2px solid '+RED : '1.5px solid '+BD, borderRadius:99, fontSize:11, color: fArea ? RED : T2, background: fArea ? '#FFF0EF' : S, outline:'none', fontWeight: fArea ? 700 : 400, cursor:'pointer' }}>
            <option value="">Todas las áreas</option>
            {AREAS_F.map(function(a){ return <option key={a}>{a}</option> })}
          </select>
          <select value={fTenure} onChange={function(e){ setFTenure(e.target.value) }} style={{ padding:'6px 12px', border:'1.5px solid '+BD, borderRadius:99, fontSize:11, color:T2, background:S, outline:'none', cursor:'pointer' }}>
            <option value="">Toda la antigüedad</option>
            {['Menos de 6 meses','6 meses – 1 año','1 – 2 años','2 – 4 años','Más de 4 años'].map(function(t){ return <option key={t}>{t}</option> })}
          </select>
          {(fArea || fTenure) ? (
            <button onClick={function(){ setFArea(''); setFTenure('') }} style={{ fontSize:11, color:RED, background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>✕ Quitar</button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:T3 }}>
          <div style={{ fontSize:32, marginBottom:10 }}>📊</div>
          <p style={{ fontSize:13 }}>Cargando datos desde Supabase…</p>
        </div>
      ) : (
        <div>
          <KPICards kpis={kpis} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            <SentimentCard dims={dims} />
            <div style={card()}>
              <p style={{ fontSize:12, fontWeight:600, marginBottom:12 }}>🕸 Dimensiones de engagement</p>
              <RadarChart dims={DIMS} values={dims.length ? dims.map(function(d){ return d.score }) : DIMS.map(function(){ return 0 })} />
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            <RankingCard fArea={fArea} areas={areas} />
            <ENPSCard kpis={kpis} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            <PermanenceCard perm={perm} />
            <div></div>
          </div>
          <FormulasCard />
        </div>
      )}
    </div>
  )
}

function VozTab(props) {
  const fArea = props.fArea
  const selectedQ = props.selectedQ, setSelectedQ = props.setSelectedQ
  const qWordData = props.qWordData, loadingQWords = props.loadingQWords, qResponseCount = props.qResponseCount

  return (
    <div style={{ padding:16, maxWidth:1000, margin:'0 auto' }}>
      <h2 style={{ fontSize:18, fontWeight:700, color:DARK, marginBottom:4 }}>💬 Voz del Empleado</h2>
      <p style={{ fontSize:11, color:T3, marginBottom:4 }}>Análisis de respuestas abiertas · Palabras más frecuentes de los colaboradores</p>
      {fArea ? (
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#FFF0EF', border:'1px solid #FECDD3', borderRadius:99, padding:'4px 12px', marginBottom:14, fontSize:11, color:RED, fontWeight:600 }}>
          📍 Filtrando por: {fArea}
        </div>
      ) : (
        <div style={{ marginBottom:14, fontSize:11, color:T3 }}>Mostrando todas las áreas · usa el filtro de área en la pestaña Dashboard para acotar</div>
      )}

      <div style={card({ marginBottom:14 })}>
        <p style={{ fontSize:12, fontWeight:600, marginBottom:10 }}>🔍 Selecciona una pregunta abierta</p>
        <select value={selectedQ} onChange={function(e){ setSelectedQ(e.target.value) }}
          style={{ width:'100%', padding:'10px 12px', border:'1.5px solid '+BD, borderRadius:10, fontSize:12, color:T2, background:S, outline:'none', cursor:'pointer' }}>
          <option value="">— Elige una pregunta —</option>
          {OPEN_QUESTIONS.map(function(q) {
            return <option key={q.section} value={q.section}>{q.dim} — {q.label}</option>
          })}
        </select>

        {!selectedQ ? (
          <p style={{ fontSize:12, color:T3, textAlign:'center', padding:'24px 0' }}>Elige una pregunta arriba para ver su nube de palabras.</p>
        ) : loadingQWords ? (
          <div style={{ textAlign:'center', padding:'30px 0', color:T3 }}>
            <p style={{ fontSize:12 }}>Analizando esta pregunta…</p>
          </div>
        ) : qWordData.length === 0 ? (
          <p style={{ fontSize:12, color:T3, textAlign:'center', padding:'20px 0' }}>Sin respuestas todavía para esta pregunta{fArea ? ' en '+fArea : ''}.</p>
        ) : (
          <div style={{ marginTop:14 }}>
            <p style={{ fontSize:11, color:T3, marginBottom:10 }}>{qWordData.reduce(function(s,w){return s+w.count},0)} menciones · {qResponseCount} respuestas a esta pregunta</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:7, alignItems:'center', justifyContent:'center', padding:'16px', background:S2, borderRadius:10 }}>
              {qWordData.map(function(item, i) {
                const qMax = qWordData[0] ? qWordData[0].count : 1
                const qMin = qWordData[qWordData.length-1] ? qWordData[qWordData.length-1].count : 1
                const ratio = (item.count - qMin) / Math.max(qMax - qMin, 1)
                const fontSize = Math.round(12 + ratio * 22)
                const color = WORD_COLORS[i % WORD_COLORS.length]
                return (
                  <span key={item.word} title={item.count+' menciones'} style={{ fontSize:fontSize, fontWeight: ratio > 0.5 ? 700 : 500, color:color, background:color+'15', padding:'4px 10px', borderRadius:99 }}>
                    {item.word}
                  </span>
                )
              })}
            </div>

            <div style={{ marginTop:14 }}>
              <p style={{ fontSize:11, fontWeight:600, color:T2, marginBottom:8 }}>Top 10 palabras</p>
              {qWordData.slice(0,10).map(function(item,i) {
                const qMax = qWordData[0] ? qWordData[0].count : 1
                return (
                  <div key={item.word} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:RED, width:18 }}>{i+1}</span>
                    <span style={{ flex:1, fontSize:11, textTransform:'capitalize' }}>{item.word}</span>
                    <div style={{ width:80, height:5, background:S3, borderRadius:99, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:(item.count/qMax*100)+'%', background:WORD_COLORS[i%WORD_COLORS.length], borderRadius:99 }} />
                    </div>
                    <span style={{ fontSize:10, fontWeight:600, color:T3, width:24, textAlign:'right' }}>{item.count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [tab, setTab] = useState('dash')
  const [fArea, setFArea] = useState('')
  const [fTenure, setFTenure] = useState('')
  const [kpis, setKpis] = useState(null)
  const [dims, setDims] = useState([])
  const [areas, setAreas] = useState([])
  const [perm, setPerm] = useState({ yesPct:0, noPct:0, total:0 })
  const [loading, setLoading] = useState(true)
  const [selectedQ, setSelectedQ] = useState('')
  const [qWordData, setQWordData] = useState([])
  const [loadingQWords, setLoadingQWords] = useState(false)
  const [qResponseCount, setQResponseCount] = useState(0)

  const logout = async function() { await supabase.auth.signOut() }

  const loadData = useCallback(async function() {
    setLoading(true)
    try {
      let sessionQuery = supabase.from('survey_sessions').select('id').eq('completed', true)
      if (fArea) sessionQuery = sessionQuery.eq('area', fArea)
      if (fTenure) sessionQuery = sessionQuery.eq('tenure_range', fTenure)
      const sessionResult = await sessionQuery
      const sessionRows = sessionResult.data
      const sessionIds = (sessionRows || []).map(function(s){ return s.id })

      if (sessionIds.length === 0) {
        setKpis({ engagement:0, favorability:0, enps:0, total:0, promPct:0, detPct:0 })
        setDims(DIMS.map(function(name){ return { name:name, score:0, favorable:0, neutral:0, unfavorable:0 } }))
        setPerm({ yesPct:0, noPct:0, total:0 })
        setLoading(false)
        return
      }

      const respResult = await supabase
        .from('responses')
        .select('section_id,question_index,question_type,likert_value,nps_value,selected_option')
        .in('session_id', sessionIds)
      const rows = respResult.data || []

      const lk1 = rows.filter(function(r){ return r.question_type==='likert' && r.section_id===1 && r.likert_value })
      const lkAll = rows.filter(function(r){ return r.question_type==='likert' && r.likert_value })
      const lkFav = lkAll.filter(function(r){ return r.likert_value===4 || r.likert_value===5 })
      const npsR = rows.filter(function(r){ return r.question_type==='nps' && r.nps_value!==null })
      const prom = npsR.filter(function(r){ return r.nps_value>=9 }).length
      const det = npsR.filter(function(r){ return r.nps_value<=6 }).length
      const engAvg = lk1.length ? lk1.reduce(function(s,r){return s+r.likert_value},0)/lk1.length : 0

      setKpis({
        engagement: lk1.length ? Math.round(((engAvg-1)/4)*100) : 0,
        favorability: lkAll.length ? Math.round((lkFav.length/lkAll.length)*100) : 0,
        enps: npsR.length ? Math.round(((prom-det)/npsR.length)*100) : 0,
        total: sessionIds.length,
        promPct: npsR.length ? Math.round((prom/npsR.length)*100) : 0,
        detPct: npsR.length ? Math.round((det/npsR.length)*100) : 0,
      })

      const dimScores = DIMS.map(function(name, idx) {
        const sr = rows.filter(function(r){ return r.section_id===idx+1 && r.question_type==='likert' && r.likert_value })
        if (!sr.length) return { name:name, score:0, favorable:0, neutral:0, unfavorable:0 }
        const avg = sr.reduce(function(s,r){return s+r.likert_value},0)/sr.length
        return {
          name: name,
          score: Math.round(((avg-1)/4)*100),
          favorable: Math.round(sr.filter(function(r){return r.likert_value===4||r.likert_value===5}).length/sr.length*100),
          neutral: Math.round(sr.filter(function(r){return r.likert_value===3}).length/sr.length*100),
          unfavorable: Math.round(sr.filter(function(r){return r.likert_value===1||r.likert_value===2}).length/sr.length*100),
        }
      })
      setDims(dimScores)

      const permRows = rows.filter(function(r){ return r.section_id===8 && r.question_type==='perm' && r.selected_option })
      const permYes = permRows.filter(function(r){ return r.selected_option==='Sí' }).length
      const permTotal = permRows.length
      setPerm({
        yesPct: permTotal ? Math.round((permYes/permTotal)*100) : 0,
        noPct: permTotal ? Math.round(((permTotal-permYes)/permTotal)*100) : 0,
        total: permTotal
      })

      if (!fArea) {
        const sessResult = await supabase.from('survey_sessions').select('id,area').eq('completed',true)
        const engResult = await supabase.from('responses').select('session_id,likert_value').eq('section_id',1).eq('question_type','likert')
        const sessions = sessResult.data || []
        const engR = engResult.data || []
        const areaMap = {}
        sessions.forEach(function(s) {
          if (!areaMap[s.area]) areaMap[s.area] = []
          areaMap[s.area].push(s.id)
        })
        const ranking = Object.entries(areaMap).map(function(entry) {
          const area = entry[0], ids = entry[1]
          const ar = engR.filter(function(r){ return ids.indexOf(r.session_id)>=0 && r.likert_value })
          const avg = ar.length ? ar.reduce(function(s,r){return s+r.likert_value},0)/ar.length : 0
          return { area:area, score:Math.round(((avg-1)/4)*100), n:ids.length }
        }).sort(function(a,b){ return b.score - a.score })
        setAreas(ranking)
      }
    } catch(e) { console.error(e) }
    setLoading(false)
  }, [fArea, fTenure])

  const loadQWords = useCallback(async function() {
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
      const result = await q
      const texts = (result.data || []).map(function(r){return r.open_text}).filter(Boolean)
      setQResponseCount(texts.length)
      setQWordData(getTopWords(texts, 30))
    } catch(e) { console.error(e) }
    setLoadingQWords(false)
  }, [selectedQ, fArea])

  useEffect(function(){ loadData() }, [loadData])
  useEffect(function(){ loadQWords() }, [loadQWords])

  return (
    <div style={{ minHeight:'100vh', background:WARM }}>
      <nav style={{ position:'sticky', top:0, zIndex:50, background:DARK, height:50, display:'flex', alignItems:'center', padding:'0 16px', gap:10 }}>
        <span style={{ background:RED, color:'#fff', fontWeight:800, fontSize:13, padding:'2px 8px', borderRadius:5 }}>KFC</span>
        <span style={{ color:'rgba(255,255,255,0.9)', fontWeight:700, fontSize:15 }}>Listen</span>
        <div style={{ display:'flex', gap:3, marginLeft:'auto' }}>
          <button onClick={function(){setTab('dash')}} style={{ padding:'5px 13px', borderRadius:7, border:'none', background: tab==='dash' ? 'rgba(228,0,43,0.25)' : 'transparent', color: tab==='dash' ? '#fff' : 'rgba(255,255,255,0.5)', fontSize:12, fontWeight:600, cursor:'pointer' }}>📊 Dashboard</button>
          <button onClick={function(){setTab('voz')}} style={{ padding:'5px 13px', borderRadius:7, border:'none', background: tab==='voz' ? 'rgba(228,0,43,0.25)' : 'transparent', color: tab==='voz' ? '#fff' : 'rgba(255,255,255,0.5)', fontSize:12, fontWeight:600, cursor:'pointer' }}>💬 Voz del Empleado</button>
          <button onClick={logout} style={{ marginLeft:8, background:'transparent', border:'none', color:'rgba(255,255,255,0.4)', fontSize:12, cursor:'pointer' }}>Salir</button>
        </div>
      </nav>

      {tab==='dash' ? (
        <DashTab fArea={fArea} fTenure={fTenure} setFArea={setFArea} setFTenure={setFTenure} loading={loading} kpis={kpis} dims={dims} areas={areas} perm={perm} />
      ) : (
        <VozTab fArea={fArea} selectedQ={selectedQ} setSelectedQ={setSelectedQ} qWordData={qWordData} loadingQWords={loadingQWords} qResponseCount={qResponseCount} />
      )}
    </div>
  )
}

function RadarChart(props) {
  const dims = props.dims, values = props.values
  const r = 80, n = dims.length
  const pts = values.map(function(v,i) {
    const a = (i/n)*Math.PI*2-Math.PI/2
    return (r*(v/100)*Math.cos(a))+','+(r*(v/100)*Math.sin(a))
  }).join(' ')

  return (
    <svg viewBox="0 0 220 200" style={{ width:'100%' }}>
      <g transform="translate(110,100)">
        {[0.25,0.5,0.75,1].map(function(f) {
          const p = dims.map(function(_,i) {
            const a = (i/n)*Math.PI*2-Math.PI/2
            return (r*f*Math.cos(a))+','+(r*f*Math.sin(a))
          }).join(' ')
          return <polygon key={f} points={p} fill="none" stroke="#E8DDD9" strokeWidth="0.5" />
        })}
        {dims.map(function(_,i) {
          const a = (i/n)*Math.PI*2-Math.PI/2
          const lx = (r+14)*Math.cos(a), ly = (r+14)*Math.sin(a)
          return (
            <g key={i}>
              <line x1="0" y1="0" x2={r*Math.cos(a)} y2={r*Math.sin(a)} stroke="#E8DDD9" strokeWidth="0.5"/>
              <text x={lx} y={ly+3} textAnchor="middle" fontSize="7" fill="#9C8680">{dims[i]}</text>
            </g>
          )
        })}
        <polygon points={pts} fill="rgba(228,0,43,0.12)" stroke="#E4002B" strokeWidth="2" />
        {values.map(function(v,i) {
          const a = (i/n)*Math.PI*2-Math.PI/2
          return <circle key={i} cx={r*(v/100)*Math.cos(a)} cy={r*(v/100)*Math.sin(a)} r="3" fill="#E4002B" />
        })}
      </g>
    </svg>
  )
}
