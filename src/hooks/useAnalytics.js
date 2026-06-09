import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

const DIMS = ['Engagement','Pertenencia','Recursos','Apoyo del Jefe','Bienestar','Expectativas','Reconocimiento','Permanencia']

export function useAnalytics(filterArea = null, filterTenure = null) {
  const [kpis,       setKpis]       = useState(null)
  const [dimensions, setDimensions] = useState([])
  const [areas,      setAreas]      = useState([])
  const [sentiment,  setSentiment]  = useState([])
  const [loading,    setLoading]    = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // ── Query base ────────────────────────────────────────────────────────
      let query = supabase
        .from('responses')
        .select('section_id, question_index, question_type, likert_value, nps_value, survey_sessions!inner(area, tenure_range, completed)')
        .eq('survey_sessions.completed', true)

      if (filterArea)   query = query.eq('survey_sessions.area', filterArea)
      if (filterTenure) query = query.eq('survey_sessions.tenure_range', filterTenure)

      const { data: rows, error } = await query
      if (error) throw error

      // ── KPIs ──────────────────────────────────────────────────────────────
      const likertAll  = rows.filter(r => r.question_type === 'likert' && r.section_id === 1)
      const likertFav  = rows.filter(r => r.question_type === 'likert' && [4,5].includes(r.likert_value))
      const likertAns  = rows.filter(r => r.question_type === 'likert' && r.likert_value)
      const npsRows    = rows.filter(r => r.question_type === 'nps' && r.nps_value !== null)
      const promoters  = npsRows.filter(r => r.nps_value >= 9).length
      const detractors = npsRows.filter(r => r.nps_value <= 6).length

      const engAvg = likertAll.length
        ? likertAll.reduce((s,r) => s + r.likert_value, 0) / likertAll.length
        : 0

      // Contar sesiones únicas
      const { count: totalSessions } = await supabase
        .from('survey_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('completed', true)

      setKpis({
        engagement:   Math.round(((engAvg - 1) / 4) * 100),
        favorability: likertAns.length ? Math.round((likertFav.length / likertAns.length) * 100) : 0,
        enps:         npsRows.length   ? Math.round(((promoters - detractors) / npsRows.length) * 100) : 0,
        totalResp:    totalSessions || 0,
        promotersPct: npsRows.length ? Math.round((promoters / npsRows.length) * 100) : 0,
        detractorsPct:npsRows.length ? Math.round((detractors / npsRows.length) * 100) : 0,
      })

      // ── Scores por dimensión ──────────────────────────────────────────────
      const dimScores = DIMS.map((name, idx) => {
        const sectionId = idx + 1
        const secRows   = rows.filter(r => r.section_id === sectionId && r.question_type === 'likert' && r.likert_value)
        if (!secRows.length) return { name, score: 0, favorable: 0, neutral: 0, unfavorable: 0 }
        const avg  = secRows.reduce((s,r) => s + r.likert_value, 0) / secRows.length
        const fav  = Math.round(secRows.filter(r => [4,5].includes(r.likert_value)).length / secRows.length * 100)
        const neu  = Math.round(secRows.filter(r => r.likert_value === 3).length / secRows.length * 100)
        const desf = Math.round(secRows.filter(r => [1,2].includes(r.likert_value)).length / secRows.length * 100)
        return { name, score: Math.round(((avg-1)/4)*100), favorable: fav, neutral: neu, unfavorable: desf }
      })
      setDimensions(dimScores)
      setSentiment(dimScores)

      // ── Ranking por área (solo sin filtro activo) ─────────────────────────
      if (!filterArea) {
        const { data: areaSessions } = await supabase
          .from('survey_sessions')
          .select('id, area')
          .eq('completed', true)

        const areaMap = {}
        for (const s of areaSessions || []) {
          if (!areaMap[s.area]) areaMap[s.area] = []
          areaMap[s.area].push(s.id)
        }

        const { data: areaResponses } = await supabase
          .from('responses')
          .select('session_id, section_id, question_type, likert_value')
          .eq('section_id', 1)
          .eq('question_type', 'likert')

        const ranking = Object.entries(areaMap).map(([area, ids]) => {
          const aRows = (areaResponses || []).filter(r => ids.includes(r.session_id) && r.likert_value)
          const avg   = aRows.length ? aRows.reduce((s,r) => s + r.likert_value, 0) / aRows.length : 0
          return { area, score: Math.round(((avg-1)/4)*100), n: ids.length }
        }).sort((a,b) => b.score - a.score)

        setAreas(ranking)
      }

    } catch (err) {
      console.error('Error analytics:', err)
    }
    setLoading(false)
  }, [filterArea, filterTenure])

  useEffect(() => { load() }, [load])

  return { kpis, dimensions, areas, sentiment, loading, reload: load }
}
