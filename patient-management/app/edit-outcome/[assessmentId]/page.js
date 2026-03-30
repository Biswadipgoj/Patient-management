'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { miasm_questions, susc_questions } from '@/lib/miasm'

export default function EditOutcome() {
  const router = useRouter()
  const { assessmentId } = useParams()
  const [assessment, setAssessment] = useState(null)
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    (async () => {
      const { data: a } = await supabase.from('outcome_assessments').select('*').eq('id', assessmentId).single()
      if (a) {
        const { data: p } = await supabase.from('patients').select('*').eq('id', a.patient_id).single()
        setAssessment(a); setPatient(p)
      }
      setLoading(false)
    })()
  }, [assessmentId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const f = new FormData(e.target)

    const updates = {
      date: f.get('date'),
      brief_notes: f.get('brief_notes'),
      prescription: f.get('prescription'),
      oridl_main_complaint: f.get('oridl_main_complaint'),
      oridl_wellbeing: f.get('oridl_wellbeing'),
      prathot_version: f.get('prathot_version'),
    }

    if (assessment.assessment_number === 6) {
      const miasmData = {}
      miasm_questions.forEach((_, i) => { miasmData[`miasm_${i + 1}`] = f.get(`miasm_${i + 1}`) || '' })
      const suscData = {}
      susc_questions.forEach((_, i) => { suscData[`susc_${i + 1}`] = f.get(`susc_${i + 1}`) || '' })
      updates.miasm_data = miasmData
      updates.susceptibility_data = suscData
    }

    await supabase.from('outcome_assessments').update(updates).eq('id', assessmentId)
    router.push(`/patient-details?search_query=${encodeURIComponent(patient.reg_no)}`)
  }

  if (loading) return <div className="card"><p>Loading...</p></div>
  if (!assessment) return <div className="card"><p>Assessment not found.</p></div>

  const md = assessment.miasm_data || {}
  const sd = assessment.susceptibility_data || {}

  return (
    <div className="card">
      <h2>Edit Outcome Assessment {assessment.assessment_number} for {patient?.name}</h2>
      <form onSubmit={handleSubmit} autoComplete="off">
        <h3>Assessment Details</h3>
        <label>Date:</label><input type="date" name="date" defaultValue={assessment.date} required />
        <label>Brief notes:</label><textarea name="brief_notes" defaultValue={assessment.brief_notes} required />
        <label>Prescription:</label><textarea name="prescription" defaultValue={assessment.prescription} />

        <h3>PRATHoT; version 2.2</h3>
        <label>PRATHoT Input:</label><textarea name="prathot_version" defaultValue={assessment.prathot_version} />

        <h3>ORIDL</h3>
        <label>Main Complaint:</label><textarea name="oridl_main_complaint" defaultValue={assessment.oridl_main_complaint} />
        <label>Overall Well-being:</label><textarea name="oridl_wellbeing" defaultValue={assessment.oridl_wellbeing} />

        {assessment.assessment_number === 6 && (
          <>
            <h3>Miasm Checklist</h3>
            {miasm_questions.map((q, i) => (
              <div key={`m${i}`}>
                <label>{i + 1}. {q}:</label>
                <input type="text" name={`miasm_${i + 1}`} defaultValue={md[`miasm_${i + 1}`] || ''} />
              </div>
            ))}
            <h3>Susceptibility Assessment</h3>
            {susc_questions.map((q, i) => (
              <div key={`s${i}`}>
                <label>{i + 1}. {q}:</label>
                <input type="text" name={`susc_${i + 1}`} defaultValue={sd[`susc_${i + 1}`] || ''} />
              </div>
            ))}
          </>
        )}

        <button type="submit" className="button" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
