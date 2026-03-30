'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { calculateBMI } from '@/lib/bmi'

export default function AddPatient() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')

  const bmi = calculateBMI(height, weight)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const f = new FormData(e.target)
    const regNo = f.get('reg_no')?.trim()

    const { data: existing } = await supabase
      .from('patients').select('id').eq('reg_no', regNo).maybeSingle()
    if (existing) { setError('Registration number already exists.'); setLoading(false); return }

    const { data, error: err } = await supabase.from('patients').insert({
      reg_no: regNo, name: f.get('name'), age: f.get('age'),
      sex: f.get('sex'), residence: f.get('residence'), height: f.get('height'),
      duration_mc: f.get('duration_mc'), co_morbidities: f.get('co_morbidities'),
      risk_factors: f.get('risk_factors'), treatment_taken: f.get('treatment_taken'),
      weight_kg: f.get('weight_kg'), education_status: f.get('education_status'),
      socio_economic_status: f.get('socio_economic_status'),
      bmi: bmi ? String(bmi) : null
    }).select().single()

    if (err) { setError(err.message); setLoading(false); return }
    router.push(`/add-baseline/${data.id}`)
  }

  return (
    <div className="card">
      <h2>Add New Patient</h2>
      {error && <p className="flash-message error">{error}</p>}
      <form onSubmit={handleSubmit} autoComplete="off">
        <h3>Patient Data</h3>
        <label>Reg. No.:</label><input type="text" name="reg_no" required />
        <label>Name:</label><input type="text" name="name" required />
        <label>Age:</label><input type="text" name="age" />
        <label>Sex:</label><input type="text" name="sex" />
        <label>Residence:</label><input type="text" name="residence" />
        <h3>Socio-demographic data</h3>
        <label>Height (ft/cm):</label>
        <input type="text" name="height" value={height} onChange={e => setHeight(e.target.value)} />
        <label>Weight (kg):</label>
        <input type="text" name="weight_kg" value={weight} onChange={e => setWeight(e.target.value)} />
        <label>BMI (auto-calculated):</label>
        <input type="text" name="bmi" value={bmi ? String(bmi) : ''} readOnly
          style={{ backgroundColor: '#f0f0f0', fontWeight: 600 }} />
        <label>Duration of suffering from MC:</label><input type="text" name="duration_mc" />
        <label>Co-morbidities:</label><textarea name="co_morbidities" />
        <label>Risk factors:</label><textarea name="risk_factors" />
        <label>Treatment taken:</label><textarea name="treatment_taken" />
        <label>Education status:</label><input type="text" name="education_status" />
        <label>Socio-economic status:</label><input type="text" name="socio_economic_status" />
        <button type="submit" className="button" disabled={loading}>
          {loading ? 'Saving...' : 'Add Patient & Proceed to Baseline'}
        </button>
      </form>
    </div>
  )
}
