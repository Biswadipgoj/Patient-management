'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { miasm_questions, susc_questions } from '@/lib/miasm'
import PrescriptionFields from '@/components/PrescriptionFields'

export default function AddBaseline() {
  const router = useRouter()
  const { patientId } = useParams()
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('patients').select('*').eq('id', patientId).single()
      .then(({ data }) => { setPatient(data); setLoading(false) })
  }, [patientId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const f = new FormData(e.target)
    const dateVal = f.get('date')

    // Miasm: empty/null → '0'
    const miasmData = {}
    miasm_questions.forEach((_, i) => {
      const v = (f.get(`miasm_${i + 1}`) || '').trim()
      miasmData[`miasm_${i + 1}`] = v === '' ? '0' : v
    })
    const suscData = {}
    susc_questions.forEach((_, i) => { suscData[`susc_${i + 1}`] = f.get(`susc_${i + 1}`) || '' })

    await supabase.from('patients').update({ screening_date: dateVal }).eq('id', patientId)

    await supabase.from('baseline_treatments').insert({
      patient_id: parseInt(patientId),
      date: dateVal,
      present_complaint: f.get('present_complaint'),
      medicine_prescribed: f.get('medicine_prescribed'),
      potency: f.get('potency'),
      dose_doses: f.get('dose_doses'),
      miasm_data: miasmData,
      susceptibility_data: suscData
    })

    router.push('/?msg=Baseline+Treatment+details+entered+successfully.')
  }

  if (loading) return <div className="card"><p>Loading...</p></div>
  if (!patient) return <div className="card"><p>Patient not found.</p></div>

  return (
    <div className="card">
      <h2>Baseline Treatment for {patient.name} ({patient.reg_no})</h2>
      <form onSubmit={handleSubmit} autoComplete="off">
        <h3>Primary Details</h3>
        <label>Date:</label><input type="date" name="date" required />
        <label>Present Complaint:</label><textarea name="present_complaint" rows={4} />

        <PrescriptionFields />

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

        <button type="submit" className="button" disabled={saving}>
          {saving ? 'Saving...' : 'Save Baseline'}
        </button>
      </form>
    </div>
  )
}
