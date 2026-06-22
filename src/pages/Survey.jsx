import { useState, useCallback } from 'react'
import { useSurvey } from '../hooks/useSurvey.js'

const AREAS = [
  'Domicilios','Financiera y Contable','Desarrollo y Expansión','Sistemas',
  'Recursos Humanos','Auditoría','Planta Bogotá - Operativo','Plantas CAR',
  'Planta Medellín - Operativo','Mantenimiento','Entrenamiento','Operaciones','Mercadeo'
]
const TENURE = ['Menos de 6 meses','6 meses – 1 año','1 – 2 años','2 – 4 años','Más de 4 años']
const EXP_OPTS = ['Salario','Reconocimiento','Sentido de pertenencia','Crecimiento profesional','Buen ambiente de trabajo','Flexibilidad','Aprendizaje constante','Otro']
const PERM_OPTS = ['Salario','Reconocimiento','Nuevos aprendizajes','Sentido de pertenencia','Desarrollo de carrera','Otro']

const SECTIONS = [
  { id: 0, motivator: null, qs: [
    { t:'select', q:'¿Cuál es el área en la que trabajas?',         opts: AREAS,  req: true },
    { t:'select', q:'¿Hace cuánto tiempo trabajas en KFC?',         opts: TENURE, req: true },
  ]},
  { id: 1, motivator: '¡Empecemos! Tu opinión es lo más valioso.', qs: [
    { t:'likert', q:'Me siento motivado/a para ir más allá de lo que se exige en el trabajo.',  req: true },
    { t:'likert', q:'Mi trabajo me da una sensación de realización personal.',                   req: true },
    { t:'likert', q:'Me siento orgulloso/a de pertenecer a KFC.',                               req: true },
    { t:'open',   q:'¿Qué es lo que más te hace sentirte valorado/a e incluido/a en KFC?',      req: false },
    { t:'nps',    q:'¿Qué tan probable es que recomiendes KFC como lugar para trabajar?',       req: true },
  ]},
  { id: 2, motivator: 'Ahora hablemos de tu sentido de pertenencia.', qs: [
    { t:'likert', q:'Puedo ser yo mismo/a en mi trabajo.',                                      req: true },
    { t:'likert', q:'Siento un fuerte sentido de pertenencia en mi equipo de trabajo.',         req: true },
    { t:'likert', q:'Siento que pertenezco a KFC.',                                             req: true },
    { t:'likert', q:'Me tratan con respeto.',                                                   req: true },
  ]},
  { id: 3, motivator: '¡A mitad del camino! Gracias por tu tiempo.', qs: [
    { t:'likert', q:'Me siento plenamente capacitado/a para resolver los problemas de mis clientes internos.', req: true },
    { t:'likert', q:'Entiendo claramente lo que se espera de mí.',                              req: true },
    { t:'likert', q:'La formación recibida me ha preparado para mi cargo actual.',              req: true },
    { t:'likert', q:'Tengo acceso a los recursos que necesito para hacer mi trabajo.',          req: true },
    { t:'likert', q:'Mi equipo trabaja en conjunto para hacer las cosas.',                      req: true },
    { t:'open',   q:'¿Qué habilidad adicional te gustaría desarrollar el próximo año?',        req: false },
  ]},
  { id: 4, motivator: 'Unas preguntas sobre tu relación con tu jefe.', qs: [
    { t:'likert', q:'Mi jefe me mantiene informado/a sobre lo que necesito saber para hacer mi trabajo eficazmente.', req: true },
    { t:'likert', q:'Mi jefe hace lo que dice que va a hacer.',                                 req: true },
    { t:'likert', q:'Mi jefe me ayuda a eliminar las barreras que me impiden trabajar.',        req: true },
    { t:'likert', q:'Mi jefe valora mis ideas y opiniones.',                                    req: true },
    { t:'likert', q:'Mantengo conversaciones significativas con mi jefe sobre desempeño y desarrollo.', req: true },
    { t:'likert', q:'Puedo hablar abierta y cómodamente con mi jefe.',                         req: true },
    { t:'open',   q:'¿De qué manera el liderazgo de tu jefe facilita o dificulta tu crecimiento?', req: false },
  ]},
  { id: 5, motivator: 'Tu bienestar nos importa. Gracias por compartir.', qs: [
    { t:'likert', q:'¿Qué tan equilibrado sientes tu nivel de bienestar emocional y mental en tu cargo actual?', req: true },
    { t:'likert', q:'Puedo gestionar mi estrés en el trabajo.',                                 req: true },
    { t:'likert', q:'No suelo preocuparme por problemas laborales en mi tiempo personal.',     req: true },
    { t:'likert', q:'Creo que se producirá un cambio positivo como resultado de esta encuesta.', req: true },
    { t:'open',   q:'¿Qué podría hacer KFC para apoyar mejor tu bienestar emocional?',        req: false },
  ]},
  { id: 6, motivator: '¡Ya casi! Cuéntanos sobre tus expectativas.', qs: [
    { t:'exp',    q:'¿Tu experiencia en la empresa ha cumplido tus expectativas?',              req: true },
    { t:'likert', q:'Veo un camino para avanzar en mi carrera en KFC.',                        req: true },
  ]},
  { id: 7, motivator: 'Un tema clave: el reconocimiento.', qs: [
    { t:'likert', q:'Recibo reconocimiento cuando hago un buen trabajo.',                       req: true },
    { t:'open',   q:'¿De qué manera te gustaría ser reconocido/a con mayor frecuencia?',       req: false },
  ]},
  { id: 8, motivator: '¡Última sección! Eres increíble.', qs: [
    { t:'perm',   q:'¿Te gustaría continuar trabajando en KFC?',                               req: true },
    { t:'open',   q:'Si pudieras proponer UNA sola acción para mejorar tu experiencia en KFC, ¿cuál sería?', req: false },
  ]},
]

export default function Survey() {
  const [screen, setScreen]   = useState('welcome') // welcome | survey | thanks
  const [curSec, setCurSec]   = useState(0)
  const [answers, setAnswers] = useState({})        // { sectionId: { qi: { type, value } } }
  const [errors,  setErrors]  = useState([])
  const { startSession, saveSection, completeSession, saving } = useSurvey()

  const setAns = useCallback((si, qi, type, value) => {
    setAnswers(prev => ({ ...prev, [si]: { ...(prev[si]||{}), [qi]: { type, value } } }))
    setErrors(prev => prev.filter(e => !(e.si === si && e.qi === qi)))
  }, [])

  const getPending = (secIdx) => {
    const sec = SECTIONS[secIdx]
    return sec.qs.filter((q, qi) => q.req && !(answers[secIdx]?.[qi])).map((_,qi) => qi)
  }

  const handleStart = async () => {
    setScreen('survey')
    setCurSec(0)
  }

  const handleNext = async () => {
    const pending = getPending(curSec)
    if (pending.length > 0) {
      setErrors(pending.map(qi => ({ si: curSec, qi })))
      document.getElementById(`qcard-${curSec}-${pending[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    // Guardar sección en Supabase
    if (curSec === 0) {
      const area    = answers[0]?.[0]?.value
      const tenure  = answers[0]?.[1]?.value
      await startSession(area, tenure)
    }
    await saveSection(curSec, answers[curSec] || {})

    if (curSec < SECTIONS.length - 1) {
      setCurSec(c => c + 1)
      window.scrollTo(0, 0)
    } else {
      await completeSession()
      setScreen('thanks')
      window.scrollTo(0, 0)
    }
  }

  const handleBack = () => { setCurSec(c => c - 1); window.scrollTo(0, 0) }

  if (screen === 'welcome') return <Welcome onStart={handleStart} />
  if (screen === 'thanks')  return <Thanks />
  return <SurveyBody curSec={curSec} answers={answers} errors={errors} setAns={setAns} onNext={handleNext} onBack={handleBack} saving={saving} />
}

function Welcome({ onStart }) {
  return (
    <div className="min-h-screen bg-[#FFF5F0] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-xl">
        <div className="bg-gradient-to-br from-[#1A0A0A] to-[#3D0C0C] p-8 text-center">
          <span className="inline-block bg-[#E4002B] text-white font-black text-sm px-3 py-1 rounded-md mb-3">KFC</span>
          <h1 className="text-white text-2xl font-bold mb-2">Listen</h1>
          <p className="text-white/60 text-sm">Tu voz construye nuestro mejor KFC · 2026</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[['⏱','Tiempo','~8 min'],['📋','Secciones','8 temas'],['🔒','Privacidad','Anónimo']].map(([icon,lbl,val]) => (
              <div key={lbl} className="bg-[#FFF8F6] rounded-xl p-3 text-center">
                <div className="text-lg">{icon}</div>
                <div className="text-[10px] text-[#9C8680] uppercase mt-1">{lbl}</div>
                <div className="text-xs font-semibold mt-0.5">{val}</div>
              </div>
            ))}
          </div>
          <div className="bg-[#FFF5F5] border border-[#FECDD3] rounded-xl p-3 mb-5 text-xs text-[#5C4A44] leading-relaxed">
            🔐 Tus respuestas son <strong>confidenciales y anónimas</strong>. Las preguntas marcadas <span className="bg-[#FEE2E2] text-[#E4002B] font-bold px-1.5 py-0.5 rounded-full text-[9px]">REQUERIDA</span> son obligatorias.
          </div>
          <button onClick={onStart} className="w-full py-3.5 bg-[#E4002B] text-white font-bold rounded-xl hover:bg-[#C8002A] active:scale-[0.98] transition-all">
            Comenzar →
          </button>
        </div>
      </div>
    </div>
  )
}

function SurveyBody({ curSec, answers, errors, setAns, onNext, onBack, saving }) {
  const sec  = SECTIONS[curSec]
  const pct  = Math.round(((curSec + 1) / SECTIONS.length) * 100)
  const hasErrors = errors.length > 0

  return (
    <div className="min-h-screen bg-[#FFF5F0]">
      {/* Barra progreso sticky */}
      <div className="sticky top-0 z-50 bg-white border-b border-[#E8DDD9] px-4 py-2.5">
        <div className="flex justify-between text-[10px] mb-1.5">
          <span className="font-bold text-[#E4002B]">{pct}%</span>
          <span className="text-[#9C8680]">Sección {curSec+1} de {SECTIONS.length}</span>
        </div>
        <div className="h-1.5 bg-[#F5F0EE] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#E4002B] to-[#FF6B35] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 pb-20">
        {/* Motivador */}
        {sec.motivator && curSec > 0 && (
          <div className="bg-[#FFF0EF] border border-[#FECDD3] rounded-xl px-4 py-3 mb-4 text-sm text-[#5C4A44] flex gap-2">
            <span>✨</span><span>{sec.motivator}</span>
          </div>
        )}

        {/* Preguntas */}
        {sec.qs.map((q, qi) => {
          const hasErr = errors.some(e => e.si === curSec && e.qi === qi)
          const ans    = answers[curSec]?.[qi]
          return (
            <div key={qi} id={`qcard-${curSec}-${qi}`}
              className={`bg-white rounded-xl p-5 mb-3 shadow-sm ${hasErr ? 'border-2 border-[#FECDD3]' : 'border border-transparent'}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] text-[#9C8680] uppercase tracking-wide">Pregunta {qi+1} de {sec.qs.length}</span>
                {q.req
                  ? <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${ans ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#FEE2E2] text-[#E4002B]'}`}>{ans ? '✓ Respondida' : 'Requerida'}</span>
                  : <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#F5F0EE] text-[#9C8680]">Opcional</span>
                }
              </div>
              <p className="text-sm font-medium leading-relaxed mb-4 text-[#1A0A0A]">{q.q}</p>
              {q.t === 'likert'  && <LikertInput si={curSec} qi={qi} value={ans?.value} onChange={setAns} />}
              {q.t === 'nps'     && <NPSInput    si={curSec} qi={qi} value={ans?.value} onChange={setAns} />}
              {q.t === 'open'    && <OpenInput   si={curSec} qi={qi} value={ans?.value} onChange={setAns} />}
              {q.t === 'select'  && <SelectInput si={curSec} qi={qi} value={ans?.value} onChange={setAns} opts={q.opts} />}
              {q.t === 'exp'     && <ExpInput    si={curSec} qi={qi} value={ans?.value} onChange={setAns} />}
              {q.t === 'perm'    && <PermInput   si={curSec} qi={qi} value={ans?.value} onChange={setAns} />}
            </div>
          )
        })}

        {/* Alerta de errores */}
        {hasErrors && (
          <div className="bg-[#FEF2F2] border border-[#FECDD3] rounded-xl px-4 py-3 mb-4 text-sm text-[#E4002B] flex gap-2">
            <span>⚠️</span>
            <span>Faltan {errors.length} pregunta{errors.length>1?'s':''} requerida{errors.length>1?'s':''} por responder.</span>
          </div>
        )}

        {/* Indicador de guardado */}
        {saving && (
          <div className="text-center text-xs text-[#9C8680] mb-3">💾 Guardando respuestas…</div>
        )}

        {/* Botones navegación */}
        <div className="flex gap-2 mt-4">
          {curSec > 0 && (
            <button onClick={onBack} className="flex-1 py-3 bg-white border-2 border-[#E8DDD9] rounded-xl text-sm font-semibold text-[#5C4A44] hover:border-[#E4002B]">
              ← Anterior
            </button>
          )}
          <button onClick={onNext} disabled={saving}
            className="flex-[2] py-3 bg-[#E4002B] text-white font-bold rounded-xl text-sm hover:bg-[#C8002A] disabled:bg-[#E8DDD9] disabled:text-[#9C8680] disabled:cursor-not-allowed">
            {curSec === SECTIONS.length - 1 ? 'Enviar encuesta ✓' : 'Siguiente →'}
          </button>
        </div>
      </div>
    </div>
  )
}

function LikertInput({ si, qi, value, onChange }) {
  return (
    <div>
      <div className="flex justify-between text-[9px] text-[#9C8680] mb-2 px-0.5">
        <span>Totalmente en desacuerdo</span><span>Totalmente de acuerdo</span>
      </div>
      <div className="flex gap-1.5">
        {[1,2,3,4,5].map(n => (
          <button key={n} onClick={() => onChange(si, qi, 'likert', n)}
            className={`flex-1 h-12 rounded-xl text-lg font-bold border-2 transition-all
              ${value === n ? 'bg-[#E4002B] border-[#E4002B] text-white' : 'border-[#E8DDD9] text-[#9C8680] hover:border-[#E4002B]'}`}>
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

function NPSInput({ si, qi, value, onChange }) {
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {[...Array(11).keys()].map(n => (
          <button key={n} onClick={() => onChange(si, qi, 'nps', n)}
            className={`w-11 h-10 rounded-xl text-sm font-bold border-2 transition-all
              ${value === n ? 'bg-[#E4002B] border-[#E4002B] text-white' : 'border-[#E8DDD9] text-[#9C8680] hover:border-[#E4002B]'}`}>
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-[#9C8680]">
        <span>0 = Nada probable</span><span>10 = Muy probable</span>
      </div>
    </div>
  )
}

function OpenInput({ si, qi, value, onChange }) {
  return (
    <textarea rows={3} placeholder="Escribe aquí… (opcional)"
      defaultValue={value || ''}
      onChange={e => onChange(si, qi, 'open', e.target.value)}
      className="w-full border-2 border-[#E8DDD9] rounded-xl p-3 text-sm text-[#1A0A0A] resize-y focus:outline-none focus:border-[#E4002B]" />
  )
}

function SelectInput({ si, qi, value, onChange, opts }) {
  return (
    <select value={value || ''} onChange={e => onChange(si, qi, 'select', e.target.value)}
      className="w-full border-2 border-[#E8DDD9] rounded-xl p-3 text-sm text-[#1A0A0A] focus:outline-none focus:border-[#E4002B] bg-white">
      <option value="">Selecciona…</option>
      {opts.map(o => <option key={o}>{o}</option>)}
    </select>
  )
}

function ExpInput({ si, qi, value, onChange }) {
  const opts = ['Definitivamente sí','Sí','Parcialmente','No','Definitivamente no']
  const motivos = (value && value.motivos) || []
  const mainValue = value ? value.main : undefined
  const isPos = ['Definitivamente sí','Sí'].includes(mainValue)

  const setMain = (o) => onChange(si, qi, 'exp', { main: o, motivos: [] })
  const toggleMotivo = (o) => {
    const next = motivos.includes(o) ? motivos.filter(m => m !== o) : [...motivos, o]
    onChange(si, qi, 'exp', { main: mainValue, motivos: next })
  }

  return (
    <div>
      <div className="flex flex-col gap-1.5">
        {opts.map(o => (
          <div key={o} onClick={() => setMain(o)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 cursor-pointer
              ${mainValue === o ? 'border-[#E4002B] bg-[#FFF0EF]' : 'border-[#E8DDD9] hover:border-[#E4002B]'}`}>
            <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border-2 ${mainValue===o ? 'bg-[#E4002B] border-[#E4002B]' : 'border-[#E8DDD9]'}`}>
              {mainValue===o && <span className="text-white text-[10px]">✓</span>}
            </div>
            <span className="text-sm">{o}</span>
          </div>
        ))}
      </div>
      {mainValue && (
        <div className="mt-3 p-3 bg-[#FFF8F6] rounded-xl border border-[#E8DDD9]">
          <p className="text-xs font-semibold text-[#5C4A44] mb-2">
            {isPos ? '¿Qué hace que tu experiencia haya sido positiva?' : '¿Cuál es la principal razón?'} (puedes elegir varias)
          </p>
          <div className="flex flex-col gap-1.5">
            {EXP_OPTS.map(r => (
              <div key={r} onClick={() => toggleMotivo(r)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 cursor-pointer
                  ${motivos.includes(r) ? 'border-[#E4002B] bg-[#FFF0EF]' : 'border-[#E8DDD9] hover:border-[#E4002B]'}`}>
                <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${motivos.includes(r) ? 'bg-[#E4002B] border-[#E4002B]' : 'border-[#E8DDD9]'}`}>
                  {motivos.includes(r) && <span className="text-white text-[9px]">✓</span>}
                </div>
                <span className="text-xs">{r}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PermInput({ si, qi, value, onChange }) {
  const motivos = (value && value.motivos) || []
  const mainValue = value ? value.main : undefined

  const setMain = (o) => onChange(si, qi, 'perm', { main: o, motivos: [] })
  const toggleMotivo = (o) => {
    const next = motivos.includes(o) ? motivos.filter(m => m !== o) : [...motivos, o]
    onChange(si, qi, 'perm', { main: mainValue, motivos: next })
  }

  return (
    <div>
      <div className="flex gap-2">
        {['Sí','No'].map(o => (
          <button key={o} onClick={() => setMain(o)}
            className={`flex-1 py-3 rounded-xl border-2 font-semibold text-sm transition-all
              ${mainValue === o ? 'bg-[#E4002B] border-[#E4002B] text-white' : 'border-[#E8DDD9] text-[#5C4A44] hover:border-[#E4002B]'}`}>
            {o}
          </button>
        ))}
      </div>
      {mainValue && (
        <div className="mt-3 p-3 bg-[#FFF8F6] rounded-xl border border-[#E8DDD9]">
          <p className="text-xs font-semibold text-[#5C4A44] mb-2">
            {mainValue === 'Sí' ? '¿Qué te motiva a quedarte?' : '¿Qué te llevaría a explorar otras oportunidades?'}
          </p>
          <div className="flex flex-col gap-1.5">
            {PERM_OPTS.map(o => (
              <div key={o} onClick={() => toggleMotivo(o)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 cursor-pointer
                  ${motivos.includes(o) ? 'border-[#E4002B] bg-[#FFF0EF]' : 'border-[#E8DDD9] hover:border-[#E4002B]'}`}>
                <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${motivos.includes(o) ? 'bg-[#E4002B] border-[#E4002B]' : 'border-[#E8DDD9]'}`}>
                  {motivos.includes(o) && <span className="text-white text-[9px]">✓</span>}
                </div>
                <span className="text-xs">{o}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Thanks() {
  return (
    <div className="min-h-screen bg-[#FFF5F0] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 text-center shadow-xl">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-xl font-bold text-[#1A0A0A] mb-3">¡Gracias por tu participación!</h2>
        <p className="text-sm text-[#5C4A44] leading-relaxed">
          Tus respuestas quedaron guardadas de forma anónima en nuestra base de datos.<br/><br/>
          El equipo de Gestión Humana revisará los resultados y tomará acciones concretas.
        </p>
      </div>
    </div>
  )
}
