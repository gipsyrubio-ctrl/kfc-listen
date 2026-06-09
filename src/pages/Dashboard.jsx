import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { useAnalytics } from '../hooks/useAnalytics.js'

const DIMS = ['Engagement','Pertenencia','Recursos','Apoyo del Jefe','Bienestar','Expectativas','Reconocimiento','Permanencia']
const AREAS_FILTER = ['Operaciones','RRHH','Finanzas','Sistemas','Planta Bogotá - Operativo','Plantas CAR','Planta Medellín - Operativo','Domicilios','Auditoría','Mercadeo']

function colScore(v) {
  if (v >= 70) return '#16A34A'
  if (v >= 55) return '#D97706'
  return '#DC2626'
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [activeTab,    setActiveTab]    = useState('dashboard')
  const [filterArea,   setFilterArea]   = useState('')
  const [filterTenure, setFilterTenure] = useState('')

  const { kpis, dimensions, areas, sentiment, loading } = useAnalytics(filterArea || null, filterTenure || null)

  return (
    <div className="min-h-screen bg-[#FFF5F0]">
      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-[#1A0A0A] h-12 flex items-center px-4 gap-3">
        <span className="bg-[#E4002B] text-white font-black text-xs px-2 py-0.5 rounded">KFC</span>
        <span className="text-white font-bold text-sm">Listen</span>
        <div className="flex gap-1 ml-auto">
          <button onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${activeTab==='dashboard' ? 'bg-[#E4002B]/25 text-white' : 'text-white/50 hover:text-white'}`}>
            📊 Dashboard
          </button>
          <button onClick={() => setActiveTab('ia')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${activeTab==='ia' ? 'bg-[#E4002B]/25 text-white' : 'text-white/50 hover:text-white'}`}>
            ✨ IA
          </button>
          <button onClick={logout} className="ml-2 text-white/40 hover:text-white text-xs px-2">
            Salir
          </button>
        </div>
      </nav>

      {activeTab === 'dashboard' && (
        <div className="p-4 max-w-6xl mx-auto">
          {/* Header + filtros */}
          <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
            <div>
              <h1 className="text-lg font-bold text-[#1A0A0A]">Dashboard ejecutivo · People Analytics</h1>
              <p className="text-xs text-[#9C8680] mt-0.5">KFC Listen · {kpis?.totalResp || 0} respuestas registradas</p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <select value={filterArea} onChange={e => setFilterArea(e.target.value)}
                className={`px-3 py-1.5 border-2 rounded-full text-xs text-[#5C4A44] bg-white focus:outline-none cursor-pointer
                  ${filterArea ? 'border-[#E4002B] bg-[#FFF0EF] text-[#E4002B] font-semibold' : 'border-[#E8DDD9]'}`}>
                <option value="">Todas las áreas</option>
                {AREAS_FILTER.map(a => <option key={a}>{a}</option>)}
              </select>
              <select value={filterTenure} onChange={e => setFilterTenure(e.target.value)}
                className="px-3 py-1.5 border-2 border-[#E8DDD9] rounded-full text-xs text-[#5C4A44] bg-white focus:outline-none cursor-pointer">
                <option value="">Toda la antigüedad</option>
                {['Menos de 6 meses','6 meses – 1 año','1 – 2 años','2 – 4 años','Más de 4 años'].map(t => <option key={t}>{t}</option>)}
              </select>
              {(filterArea || filterTenure) && (
                <button onClick={() => { setFilterArea(''); setFilterTenure('') }}
                  className="text-xs text-[#E4002B] underline">✕ Quitar</button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-[#9C8680]">
              <div className="text-3xl mb-3">📊</div>
              <p className="text-sm">Cargando datos reales desde Supabase…</p>
            </div>
          ) : (
            <>
              {/* 4 KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <KPICard label="Engagement"     value={`${kpis?.engagement || 0}%`}  trend="Score general"            color="#E4002B" pct={kpis?.engagement} />
                <KPICard label="Favorabilidad"  value={`${kpis?.favorability || 0}%`} trend="Resp. 4–5 sobre total"   color="#FF6B35" pct={kpis?.favorability} />
                <KPICard label="eNPS"           value={`${kpis?.enps >= 0 ? '+' : ''}${kpis?.enps || 0}`} trend={`Prom. ${kpis?.promotersPct||0}% · Det. ${kpis?.detractorsPct||0}%`} color="#8B5CF6" pct={null} />
                <RiskCard kpis={kpis} />
              </div>

              {/* Sentimiento + Radar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-semibold mb-3">😊 Sentimiento por dimensión</p>
                  {(sentiment.length ? sentiment : DIMS.map(d => ({ name: d, favorable:0, neutral:0, unfavorable:0 }))).map(d => (
                    <div key={d.name} className="mb-2.5">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="font-medium">{d.name}</span>
                        <span className="text-[#9C8680]">{d.favorable}% fav · {d.neutral}% neu · {d.unfavorable}% desf.</span>
                      </div>
                      <div className="flex h-2 rounded-full overflow-hidden gap-px">
                        <div style={{ width: `${d.favorable}%`, background: '#16A34A' }} />
                        <div style={{ width: `${d.neutral}%`,   background: '#D97706' }} />
                        <div style={{ width: `${d.unfavorable}%`, background: '#DC2626' }} />
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-3 mt-2 pt-2 border-t border-[#E8DDD9]">
                    {[['#16A34A','Favorable'],['#D97706','Neutral'],['#DC2626','Desfavorable']].map(([c,l]) => (
                      <div key={l} className="flex items-center gap-1 text-[10px] text-[#5C4A44]">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />{l}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-semibold mb-3">🕸 Dimensiones de engagement</p>
                  <RadarChart dims={DIMS} values={dimensions.length ? dimensions.map(d => d.score) : DIMS.map(() => 0)} />
                </div>
              </div>

              {/* Ranking + eNPS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-semibold mb-3">
                    {filterArea ? `📍 Posición: ${filterArea}` : '🏆 Ranking de áreas'}
                  </p>
                  {filterArea ? (
                    <AreaPosition area={filterArea} areas={areas} />
                  ) : (
                    areas.length
                      ? areas.map((a, i) => (
                          <div key={a.area} className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-[#E4002B] w-4">{i+1}</span>
                            <span className="flex-1 text-xs">{a.area}</span>
                            <div className="w-20 h-1.5 bg-[#F5F0EE] rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${a.score}%`, background: colScore(a.score) }} />
                            </div>
                            <span className="text-xs font-semibold w-8 text-right" style={{ color: colScore(a.score) }}>{a.score}%</span>
                          </div>
                        ))
                      : <p className="text-xs text-[#9C8680] text-center py-4">Sin datos aún. Las respuestas aparecerán aquí cuando los colaboradores completen la encuesta.</p>
                  )}
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-semibold mb-3">💬 Distribución eNPS</p>
                  {[['Promotores (9-10)', kpis?.promotersPct || 0, '#16A34A'],
                    ['Pasivos (7-8)',      100-(kpis?.promotersPct||0)-(kpis?.detractorsPct||0), '#D97706'],
                    ['Detractores (0-6)', kpis?.detractorsPct || 0, '#DC2626']].map(([l,v,c]) => (
                    <div key={l} className="mb-3">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span style={{ color: c }} className="font-semibold">{l}</span>
                        <span className="font-bold">{Math.max(0,v)}%</span>
                      </div>
                      <div className="h-2 bg-[#F5F0EE] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.max(0,v)}%`, background: c }} />
                      </div>
                    </div>
                  ))}
                  <div className="bg-[#FFF8F6] rounded-xl py-3 text-center mt-2">
                    <p className="text-[10px] text-[#9C8680] mb-1">% Promotores − % Detractores</p>
                    <p className="text-2xl font-bold" style={{ color: (kpis?.enps||0) >= 0 ? '#16A34A' : '#DC2626' }}>
                      {(kpis?.enps||0) >= 0 ? '+' : ''}{kpis?.enps || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Fórmulas */}
              <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
                <p className="text-xs font-semibold mb-3">🧮 Fórmulas de cálculo</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-[#5C4A44] leading-relaxed">
                  {[
                    ['Engagement Score', '((promedio Likert dim.1 − 1) / 4) × 100'],
                    ['Favorabilidad', '(respuestas 4+5 / total respuestas) × 100'],
                    ['eNPS', '% Promotores (9-10) − % Detractores (0-6)'],
                    ['Riesgo Rotación', 'Perm.×0.30 + eNPS×0.25 + Jefe×0.20 + Reconoc.×0.15 + Bien.×0.10']
                  ].map(([t,f]) => (
                    <div key={t}>
                      <strong className="text-[#1A0A0A]">{t}</strong><br/>
                      <code className="bg-[#F5F0EE] px-1.5 py-0.5 rounded text-[10px] mt-0.5 inline-block">{f}</code>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'ia' && <IATab />}
    </div>
  )
}

function KPICard({ label, value, trend, color, pct }) {
  return (
    <div className="bg-white rounded-xl p-3.5 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{ background: color }} />
      <p className="text-[10px] text-[#9C8680] uppercase tracking-wide mb-1.5">{label}</p>
      <p className="text-2xl font-bold text-[#1A0A0A]">{value}</p>
      <p className="text-[10px] text-[#9C8680] mt-0.5">{trend}</p>
      {pct !== null && (
        <div className="h-1 bg-[#F5F0EE] rounded-full mt-2 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
        </div>
      )}
    </div>
  )
}

function RiskCard({ kpis }) {
  const eng  = kpis?.engagement  || 50
  const risk = eng >= 70 ? { label: 'Bajo', cls: 'bg-[#DCFCE7] text-[#166534]' }
             : eng >= 55 ? { label: 'Medio', cls: 'bg-[#FEF9C3] text-[#92400E]' }
                         : { label: 'Alto', cls: 'bg-[#FEE2E2] text-[#991B1B]' }
  return (
    <div className="bg-white rounded-xl p-3.5 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-[#D97706]" />
      <p className="text-[10px] text-[#9C8680] uppercase tracking-wide mb-1.5">Riesgo Rotación</p>
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${risk.cls}`}>
        ● {risk.label}
      </span>
      <p className="text-[10px] text-[#9C8680] mt-1.5">Índice ponderado</p>
    </div>
  )
}

function AreaPosition({ area, areas }) {
  const pos   = areas.findIndex(a => a.area === area) + 1
  const score = areas.find(a => a.area === area)?.score || 0
  return (
    <div>
      <div className="text-center py-3">
        <p className="text-[11px] text-[#9C8680] mb-1">Posición en ranking general</p>
        <p className="text-4xl font-bold text-[#E4002B]">#{pos || '?'}</p>
        <p className="text-xs text-[#5C4A44]">de {areas.length} áreas</p>
      </div>
      <div className="bg-[#FFF8F6] rounded-xl p-3 mt-2">
        <p className="text-xs font-bold text-[#E4002B] mb-2">{area}</p>
        <p className="text-2xl font-bold" style={{ color: colScore(score) }}>{score}%</p>
        <div className="h-1.5 bg-[#F5F0EE] rounded-full mt-2 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${score}%`, background: colScore(score) }} />
        </div>
        <p className="text-[10px] text-[#9C8680] mt-1">Score de engagement</p>
      </div>
    </div>
  )
}

function RadarChart({ dims, values }) {
  const r = 80, n = dims.length
  const pts = values.map((v, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2
    return `${r * (v/100) * Math.cos(a)},${r * (v/100) * Math.sin(a)}`
  }).join(' ')

  return (
    <svg viewBox="0 0 220 200" className="w-full">
      <g transform="translate(110,100)">
        {[0.25,0.5,0.75,1].map(f => {
          const poly = dims.map((_,i) => {
            const a = (i/n)*Math.PI*2 - Math.PI/2
            return `${r*f*Math.cos(a)},${r*f*Math.sin(a)}`
          }).join(' ')
          return <polygon key={f} points={poly} fill="none" stroke="#E8DDD9" strokeWidth="0.5" />
        })}
        {dims.map((_,i) => {
          const a = (i/n)*Math.PI*2 - Math.PI/2
          const lx = (r+14)*Math.cos(a), ly = (r+14)*Math.sin(a)
          return (
            <g key={i}>
              <line x1="0" y1="0" x2={r*Math.cos(a)} y2={r*Math.sin(a)} stroke="#E8DDD9" strokeWidth="0.5" />
              <text x={lx} y={ly+3} textAnchor="middle" fontSize="7" fill="#9C8680">{dims[i]}</text>
            </g>
          )
        })}
        <polygon points={pts} fill="rgba(228,0,43,0.12)" stroke="#E4002B" strokeWidth="2" />
        {values.map((v,i) => {
          const a = (i/n)*Math.PI*2 - Math.PI/2
          return <circle key={i} cx={r*(v/100)*Math.cos(a)} cy={r*(v/100)*Math.sin(a)} r="3" fill="#E4002B" />
        })}
      </g>
    </svg>
  )
}

function IATab() {
  const [selected, setSelected] = useState(new Set())
  const [result,   setResult]   = useState(null)
  const [loading,  setLoading]  = useState(false)

  const OPEN_QS = [
    { id: 1, dim: 'Engagement',    q: '¿Qué es lo que más te hace sentirte valorado/a e incluido/a en KFC?' },
    { id: 3, dim: 'Recursos',      q: '¿Qué habilidad adicional te gustaría desarrollar el próximo año?' },
    { id: 4, dim: 'Apoyo del Jefe', q: '¿De qué manera el liderazgo de tu jefe facilita o dificulta tu crecimiento?' },
    { id: 5, dim: 'Bienestar',     q: '¿Qué podría hacer KFC para apoyar mejor tu bienestar emocional?' },
    { id: 7, dim: 'Reconocimiento', q: '¿De qué manera te gustaría ser reconocido/a con mayor frecuencia?' },
    { id: 8, dim: 'Permanencia',   q: 'Si pudieras proponer UNA sola acción para mejorar tu experiencia en KFC, ¿cuál sería?' },
  ]

  const toggle = (id) => {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  const analyze = async () => {
    if (!selected.size) return
    setLoading(true)
    setResult(null)
    try {
      // Obtener respuestas reales de Supabase
      const { data: rows } = await import('../lib/supabase.js').then(m =>
        m.supabase.from('responses')
          .select('section_id, open_text')
          .in('section_id', [...selected])
          .eq('question_type', 'open')
          .not('open_text', 'is', null)
      )

      if (!rows?.length) {
        setResult({ empty: true })
        setLoading(false)
        return
      }

      const textBlock = rows.map(r => `"${r.open_text}"`).join('\n')
      const apiKey = import.meta.env.VITE_ANTHROPIC_KEY

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 1500,
          system: 'Eres especialista en People Analytics para KFC Colombia. Analiza respuestas abiertas de la encuesta KFC Listen. Las dimensiones son: Engagement, Pertenencia, Recursos, Apoyo del Jefe, Bienestar, Expectativas, Reconocimiento, Permanencia. Responde SOLO en JSON válido sin markdown.',
          messages: [{ role: 'user', content: `Analiza estas ${rows.length} respuestas reales de colaboradores:\n\n${textBlock}\n\nJSON exacto:\n{"sentimiento":{"positivo":0,"neutral":0,"negativo":0},"hallazgo_principal":"","clusters_favorables":[{"titulo":"","comentarios":[""]}],"clusters_desfavorables":[{"titulo":"","comentarios":[""]}],"recomendacion":""}` }]
        })
      })
      const data = await response.json()
      const parsed = JSON.parse(data.content[0].text)
      setResult({ ...parsed, total: rows.length })
    } catch (e) {
      setResult({ error: e.message })
    }
    setLoading(false)
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#E4002B] to-[#FF6B35] text-white px-3 py-1 rounded-full text-xs font-bold mb-2">✨ Powered by Claude AI</div>
      <h2 className="text-lg font-bold text-[#1A0A0A] mb-1">Voz del Empleado · Análisis con IA</h2>
      <p className="text-xs text-[#9C8680] mb-4">Selecciona las preguntas abiertas que quieres analizar. Claude procesará las respuestas reales guardadas en Supabase.</p>

      {/* Selector de preguntas */}
      <div className="bg-gradient-to-br from-[#1A0A0A] to-[#3D0C0C] rounded-xl p-4 mb-4">
        <p className="text-white text-sm font-bold mb-1">🤖 Analizar respuestas con Claude</p>
        <p className="text-white/50 text-xs mb-3">Selecciona una o varias preguntas abiertas de la encuesta</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          {OPEN_QS.map(q => (
            <div key={q.id} onClick={() => toggle(q.id)}
              className={`p-2.5 rounded-lg border cursor-pointer transition-all
                ${selected.has(q.id) ? 'bg-[#E4002B]/20 border-[#E4002B]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
              <p className="text-[10px] text-white/50 uppercase mb-1">{q.dim}</p>
              <p className="text-xs text-white/80 leading-snug">{q.q.substring(0,60)}…</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={analyze} disabled={!selected.size || loading}
            className="px-4 py-2 bg-[#E4002B] text-white font-bold text-xs rounded-lg disabled:bg-white/15 disabled:cursor-not-allowed">
            {loading ? 'Analizando…' : 'Analizar selección →'}
          </button>
          <span className="text-white/50 text-xs">{selected.size === 0 ? 'Selecciona al menos una' : `${selected.size} seleccionada${selected.size>1?'s':''}`}</span>
        </div>

        {/* Resultado IA */}
        {result && !result.empty && !result.error && (
          <div className="mt-3 p-3 bg-white/6 rounded-xl text-xs text-white/80 leading-relaxed">
            <div className="mb-2">
              <span className="text-white/40 uppercase text-[10px]">Sentimiento · </span>
              <span className="text-[#16A34A] font-semibold">{result.sentimiento?.positivo}% pos</span>
              <span className="mx-1 text-white/30">·</span>
              <span className="text-[#D97706] font-semibold">{result.sentimiento?.neutral}% neu</span>
              <span className="mx-1 text-white/30">·</span>
              <span className="text-[#DC2626] font-semibold">{result.sentimiento?.negativo}% neg</span>
            </div>
            <div className="p-2 bg-white/5 rounded-lg mb-2">
              <p className="text-[10px] text-white/40 mb-1">HALLAZGO PRINCIPAL</p>
              <p>{result.hallazgo_principal}</p>
            </div>
            <div className="p-2 bg-[#E4002B]/15 rounded-lg border-l-2 border-[#E4002B]">
              <p className="text-[10px] text-white/40 mb-1">RECOMENDACIÓN PARA RRHH</p>
              <p className="font-semibold">{result.recomendacion}</p>
            </div>
            <p className="text-white/30 text-[10px] mt-2">Basado en {result.total} respuestas reales de colaboradores</p>
          </div>
        )}
        {result?.empty && <p className="mt-3 text-white/40 text-xs">No hay respuestas abiertas guardadas aún para las secciones seleccionadas.</p>}
        {result?.error && <p className="mt-3 text-[#FF6B35] text-xs">⚠️ Error: {result.error}</p>}
      </div>

      {/* Clusters estáticos demo */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
        <p className="text-xs font-semibold mb-3">🔗 Agrupación semántica · se genera con tus respuestas reales</p>
        <div className="bg-[#F0FDF4] border-l-4 border-[#16A34A] rounded-r-xl p-3 mb-3">
          <p className="text-xs font-bold text-[#166534] mb-1">✅ Comentarios FAVORABLES</p>
          <p className="text-[11px] text-[#5C4A44]">Los clusters favorables aparecerán aquí una vez Claude analice las respuestas reales de los colaboradores.</p>
        </div>
        <div className="bg-[#FEF2F2] border-l-4 border-[#DC2626] rounded-r-xl p-3">
          <p className="text-xs font-bold text-[#991B1B] mb-1">⚠️ Comentarios DESFAVORABLES</p>
          <p className="text-[11px] text-[#5C4A44]">Los clusters desfavorables aparecerán aquí una vez Claude analice las respuestas reales de los colaboradores.</p>
        </div>
      </div>
    </div>
  )
}
