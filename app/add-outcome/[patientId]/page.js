'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { miasm_questions, susc_questions } from '@/lib/miasm'
import PrescriptionFields from '@/components/PrescriptionFields'

export default function AddOutcome() {
  const router = useRouter()
  const { patientId } = useParams()
  const [patient, setPatient] = useState(null)
  const [assessmentNumber, setAssessmentNumber] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from('patients').select('*').eq('id', patientId).single()
      const { data: oas } = await supabase.from('outcome_assessments')
        .select('id').eq('patient_id', patientId)
      const num = (oas?.length || 0) + 1
      if (num > 6) { router.push(`/patient-details?search_query=${encodeURIComponent(p.reg_no)}`); return }
      setPatient(p); setAssessmentNumber(num); setLoading(false)
    })()
  }, [patientId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const f = new FormData(e.target)

    let miasmData = null, suscData = null
    if (assessmentNumber === 6) {
      miasmData = {}
      miasm_questions.forEach((_, i) => {
        const v = (f.get(`miasm_${i + 1}`) || '').trim()
        miasmData[`miasm_${i + 1}`] = v === '' ? '0' : v
      })
      suscData = {}
      susc_questions.forEach((_, i) => { suscData[`susc_${i + 1}`] = f.get(`susc_${i + 1}`) || '' })
    }

    await supabase.from('outcome_assessments').insert({
      patient_id: parseInt(patientId),
      assessment_number: assessmentNumber,
      date: f.get('date'),
      brief_notes: f.get('brief_notes'),
      medicine_prescribed: f.get('medicine_prescribed'),
      potency: f.get('potency'),
      dose_doses: f.get('dose_doses'),
      oridl_main_complaint: f.get('oridl_main_complaint'),
      oridl_wellbeing: f.get('oridl_wellbeing'),
      prathot_version: f.get('prathot_version'),
      miasm_data: miasmData,
      susceptibility_data: suscData
    })

    router.push(`/patient-details?search_query=${encodeURIComponent(patient.reg_no)}`)
  }

  if (loading) return <div className="card"><p>Loading...</p></div>

  return (
    <div className="card">
      <h2>Add Outcome Assessment {assessmentNumber} for {patient?.name}</h2>
      <form onSubmit={handleSubmit} autoComplete="off">
        <h3>Assessment Details</h3>
        <label>Date:</label><input type="date" name="date" required />
        <label>Brief notes:</label><textarea name="brief_notes" required />

        <PrescriptionFields />

        <h3>PRATHoT; version 2.2</h3>
        <label>PRATHoT Input:</label><textarea name="prathot_version" />

        <h3>ORIDL</h3>
        <label>Main Complaint:</label><textarea name="oridl_main_complaint" />
        <label>Overall Well-being:</label><textarea name="oridl_wellbeing" />

        {assessmentNumber === 6 && (
          <>
            <h3>Miasm Checklist</h3>
            {miasm_questions.map((q, i) => (
              <div key={`m${i}`}>
                <label>{i + 1}. {q}:</label>
                <input type="text" name={`miasm_${i + 1}`} placeholder="0" />
              </div>
            ))}
            <h3>Susceptibility Assessment</h3>
            {susc_questions.map((q, i) => (
              <div key={`s${i}`}>
                <label>{i + 1}. {q}:</label>
                <input type="text" name={`susc_${i + 1}`} />
              </div>
            ))}
          </>
        )}

        <button type="submit" className="button" disabled={saving}>
          {saving ? 'Saving...' : 'Add Outcome Assessment'}
        </button>
      </form>
    </div>
  )
}
