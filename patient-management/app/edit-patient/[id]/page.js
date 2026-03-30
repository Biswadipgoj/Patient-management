'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function EditPatient() {
  const router = useRouter()
  const { id } = useParams()
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('patients').select('*').eq('id', id).single()
      .then(({ data }) => { setPatient(data); setLoading(false) })
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const f = new FormData(e.target)
    await supabase.from('patients').update({
      reg_no: f.get('reg_no'), name: f.get('name'), age: f.get('age'),
      sex: f.get('sex'), residence: f.get('residence'), height: f.get('height'),
      weight_kg: f.get('weight_kg'), duration_mc: f.get('duration_mc'),
      co_morbidities: f.get('co_morbidities'), risk_factors: f.get('risk_factors'),
      treatment_taken: f.get('treatment_taken'), education_status: f.get('education_status'),
      socio_economic_status: f.get('socio_economic_status')
    }).eq('id', id)
    router.push(`/patient-details?search_query=${encodeURIComponent(f.get('reg_no'))}`)
  }

  if (loading) return <div className="card"><p>Loading...</p></div>
  if (!patient) return <div className="card"><p>Patient not found.</p></div>

  return (
    <div className="card">
      <h2>Edit Patient Details</h2>
      <form onSubmit={handleSubmit} autoComplete="off">
        <h3>Patient Data</h3>
        <label>Reg. No.:</label><input type="text" name="reg_no" defaultValue={patient.reg_no} required />
        <label>Name:</label><input type="text" name="name" defaultValue={patient.name} required />
        <label>Age:</label><input type="text" name="age" defaultValue={patient.age} />
        <label>Sex:</label><input type="text" name="sex" defaultValue={patient.sex} />
        <label>Residence:</label><input type="text" name="residence" defaultValue={patient.residence} />
        <h3>Socio-demographic data</h3>
        <label>Height (ft/cm):</label><input type="text" name="height" defaultValue={patient.height} />
        <label>Weight (kg):</label><input type="text" name="weight_kg" defaultValue={patient.weight_kg} />
        <label>Duration of suffering from MC:</label><input type="text" name="duration_mc" defaultValue={patient.duration_mc} />
        <label>Co-morbidities:</label><textarea name="co_morbidities" defaultValue={patient.co_morbidities} />
        <label>Risk factors:</label><textarea name="risk_factors" defaultValue={patient.risk_factors} />
        <label>Treatment taken:</label><textarea name="treatment_taken" defaultValue={patient.treatment_taken} />
        <label>Education status:</label><input type="text" name="education_status" defaultValue={patient.education_status} />
        <label>Socio-economic status:</label><input type="text" name="socio_economic_status" defaultValue={patient.socio_economic_status} />
        <button type="submit" className="button" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
