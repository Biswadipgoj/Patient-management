'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { miasm_questions, susc_questions } from '@/lib/miasm'

export default function EditBaseline() {
  const router = useRouter()
  const { patientId } = useParams()
  const [patient, setPatient] = useState(null)
  const [baseline, setBaseline] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from('patients').select('*').eq('id', patientId).single()
      const { data: b } = await supabase.from('baseline_treatments').select('*').eq('patient_id', patientId).single()
      setPatient(p); setBaseline(b); setLoading(false)
    })()
  }, [patientId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const f = new FormData(e.target)

    const miasmData = {}
    miasm_questions.forEach((_, i) => { miasmData[`miasm_${i + 1}`] = f.get(`miasm_${i + 1}`) || '' })
    const suscData = {}
    susc_questions.forEach((_, i) => { suscData[`susc_${i + 1}`] = f.get(`susc_${i + 1}`) || '' })

    await supabase.from('baseline_treatments').update({
      date: f.get('date'),
      present_complaint: f.get('present_complaint'),
      prescription: f.get('prescription'),
      miasm_data: miasmData,
      susceptibility_data: suscData
    }).eq('id', baseline.id)

    router.push(`/patient-details?search_query=${encodeURIComponent(patient.reg_no)}`)
  }

  if (loading) return <div className="card"><p>Loading...</p></div>
  if (!baseline) return <div className="card"><p>No baseline treatment found.</p></div>

  const md = baseline.miasm_data || {}
  const sd = baseline.susceptibility_data || {}

  return (
    <div className="card">
      <h2>Edit Baseline Treatment for {patient?.name}</h2>
      <form onSubmit={handleSubmit} autoComplete="off">
        <h3>Primary Details</h3>
        <label>Date:</label><input type="date" name="date" defaultValue={baseline.date} required />
        <label>Present Complaint:</label><textarea name="present_complaint" rows={4} defaultValue={baseline.present_complaint} />
        <label>Prescription:</label><textarea name="prescription" rows={4} defaultValue={baseline.prescription} />

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

        <button type="submit" className="button" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
