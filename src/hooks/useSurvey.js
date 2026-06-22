import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import { v4 as uuidv4 } from 'uuid'

export function useSurvey() {
  const [sessionId,  setSessionId]  = useState(null)
  const [anonToken,  setAnonToken]  = useState(null)
  const [saving,     setSaving]     = useState(false)
  const [saveStatus, setSaveStatus] = useState(null) // 'ok' | 'error'

  // Crear sesión anónima al iniciar
  const startSession = useCallback(async (area, tenureRange) => {
    const token = uuidv4()
    const { data, error } = await supabase
      .from('survey_sessions')
      .insert({ area, tenure_range: tenureRange, anon_token: token })
      .select('id')
      .single()
    if (error) { console.error('Error creando sesión:', error); return false }
    setSessionId(data.id)
    setAnonToken(token)
    localStorage.setItem('kfc_session_id', data.id)
    localStorage.setItem('kfc_anon_token', token)
    return true
  }, [])

  // Guardar respuestas de una sección completa
  const saveSection = useCallback(async (sectionId, answers) => {
    const sid = sessionId || localStorage.getItem('kfc_session_id')
    if (!sid) return
    setSaving(true)
    setSaveStatus(null)

    const rows = []

    Object.entries(answers).forEach(([qi, ans]) => {
      const isPermOrExp = ans.type === 'perm' || ans.type === 'exp'
      // Valor principal: para perm/exp ahora viene en ans.value.main; para el resto, en ans.value directo
      const mainValue = isPermOrExp ? (ans.value ? ans.value.main : null) : ans.value

      rows.push({
        session_id:      sid,
        section_id:      sectionId,
        question_index:  parseInt(qi),
        question_type:   ans.type,
        likert_value:    ans.type === 'likert'  ? ans.value : null,
        nps_value:       ans.type === 'nps'     ? ans.value : null,
        open_text:        ans.type === 'open'    ? ans.value : null,
        selected_option: ['select', 'radio', 'perm', 'exp'].includes(ans.type) ? mainValue : null,
      })

      // Filas extra: una por cada motivo marcado
      if (isPermOrExp && ans.value && ans.value.motivos && ans.value.motivos.length > 0) {
        const motivoType = ans.type === 'perm' ? 'perm_motivo' : 'exp_motivo'
        ans.value.motivos.forEach((motivo) => {
          rows.push({
            session_id:      sid,
            section_id:      sectionId,
            question_index:  parseInt(qi),
            question_type:   motivoType,
            likert_value:    null,
            nps_value:       null,
            open_text:       null,
            selected_option: motivo,
          })
        })
      }
    })

    const { error } = await supabase.from('responses').insert(rows)
    setSaving(false)
    if (error) { console.error('Error guardando:', error); setSaveStatus('error') }
    else setSaveStatus('ok')
  }, [sessionId])

  // Marcar encuesta como completada
  const completeSession = useCallback(async () => {
    const sid = sessionId || localStorage.getItem('kfc_session_id')
    if (!sid) return
    await supabase
      .from('survey_sessions')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('id', sid)
    localStorage.removeItem('kfc_session_id')
    localStorage.removeItem('kfc_anon_token')
  }, [sessionId])

  return { startSession, saveSection, completeSession, saving, saveStatus }
}
