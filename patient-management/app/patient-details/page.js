'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function PatientDetailsWrapper() {
  return <Suspense fallback={<div className="card"><p>Loading...</p></div>}><PatientDetails /></Suspense>
}

function PatientDetails() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('search_query')
  const searchByDate = searchParams.get('search_by_date')

  const [patient, setPatient] = useState(null)
  const [patients, setPatients] = useState([])
  const [baseline, setBaseline] = useState(null)
  const [outcomes, setOutcomes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [multiMode, setMultiMode] = useState(false)

  useEffect(() => {
    if (!searchQuery) return
    (async () => {
      if (searchByDate) {
        // Search by date - return list
        const { data } = await supabase
          .from('baseline_treatments').select('patient_id').eq('date', searchQuery)
        if (!data?.length) { setError('No patients found for that date.'); setLoading(false); return }
        const ids = data.map(d => d.patient_id)
        const { data: pts } = await supabase
          .from('patients').select('*, baseline_treatments(date)').in('id', ids)
        setPatients(pts || []); setMultiMode(true); setLoading(false)
      } else {
        // Search by reg_no
        const { data: p } = await supabase
          .from('patients').select('*').eq('reg_no', searchQuery).maybeSingle()
        if (!p) { setError('Patient not found.'); setLoading(false); return }
        const { data: b } = await supabase
          .from('baseline_treatments').select('*').eq('patient_id', p.id).maybeSingle()
        const { data: oas } = await supabase
          .from('outcome_assessments').select('*').eq('patient_id', p.id)
          .order('assessment_number', { ascending: true })
        setPatient(p); setBaseline(b); setOutcomes(oas || []); setLoading(false)
      }
    })()
  }, [searchQuery, searchByDate])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this patient and all their records?')) return
    await supabase.from('outcome_assessments').delete().eq('patient_id', patient.id)
    await supabase.from('baseline_treatments').delete().eq('patient_id', patient.id)
    await supabase.from('patients').delete().eq('id', patient.id)
    router.push('/view-all')
  }

  if (loading) return <div className="card"><p>Loading...</p></div>
  if (error) return (
    <div className="card">
      <p className="flash-message error">{error}</p>
      <Link href="/" style={{ display: 'block', textAlign: 'center', marginTop: 20 }}>Back to Home</Link>
    </div>
  )

  // Multi-patient list (date search)
  if (multiMode) return (
    <div className="card">
      <h2>All Patients</h2>
      <table>
        <thead><tr><th>Baseline Date</th><th>Reg. No.</th><th>Name</th><th>Actions</th></tr></thead>
        <tbody>
          {patients.map(p => (
            <tr key={p.id}>
              <td>{p.baseline_treatments?.[0]?.date || 'N/A'}</td>
              <td>{p.reg_no}</td>
              <td>{p.name}</td>
              <td><Link href={`/patient-details?search_query=${encodeURIComponent(p.reg_no)}`}>View Details</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
      <Link href="/" style={{ display: 'block', textAlign: 'center', marginTop: 20 }}>Back to Home</Link>
    </div>
  )

  // Single patient detail
  return (
    <div className="card">
      <h2>
        Patient Details
        <span style={{ float: 'right', fontSize: '0.8em' }}>
          <Link href={`/edit-patient/${patient.id}`}>Edit Patient Details</Link>
        </span>
      </h2>

      <div>
        <p><strong>Reg. No.:</strong> {patient.reg_no} | <strong>Name:</strong> {patient.name}</p>
        <p><strong>Screening Date:</strong> {patient.screening_date || 'N/A'}</p>
        <p><strong>Age:</strong> {patient.age} | <strong>Sex:</strong> {patient.sex}</p>
        <p><strong>Residence:</strong> {patient.residence}</p>
        <p><strong>Height:</strong> {patient.height} | <strong>Weight:</strong> {patient.weight_kg} kg</p>
      </div>

      <div className="card">
        <h2>
          Baseline Treatment
          {baseline && (
            <span style={{ float: 'right', fontSize: '0.8em' }}>
              <Link href={`/edit-baseline/${patient.id}`}>Edit Baseline</Link>
            </span>
          )}
        </h2>
        {baseline ? (
          <>
            <p><strong>Date:</strong> {baseline.date}</p>
            <p><strong>Present Complaint:</strong> {baseline.present_complaint}</p>
            <p><strong>Prescription:</strong> {baseline.prescription}</p>
          </>
        ) : (
          <p>No baseline treatment data found. <Link href={`/add-baseline/${patient.id}`}>Add Now</Link></p>
        )}
      </div>

      <div>
        <h2>Outcome Assessment History</h2>
        {outcomes.length > 0 ? outcomes.map(oa => (
          <div key={oa.id} className="assessment-item">
            <h4>
              Assessment {oa.assessment_number} ({oa.date})
              <span style={{ float: 'right', fontSize: '0.8em' }}>
                <Link href={`/edit-outcome/${oa.id}`}>Edit Assessment</Link>
              </span>
            </h4>
            <p><strong>Brief notes:</strong> {oa.brief_notes}</p>
            <p><strong>Prescription:</strong> {oa.prescription}</p>
          </div>
        )) : <p>No Outcome Assessment data found.</p>}
      </div>

      {outcomes.length < 6 && (
        <div className="card" style={{ textAlign: 'center' }}>
          <h3>Add New Outcome Assessment ({outcomes.length + 1}/6)</h3>
          <Link href={`/add-outcome/${patient.id}`} className="nav-button" style={{ width: 'auto' }}>
            Go to Assessment {outcomes.length + 1}
          </Link>
        </div>
      )}

      <div className="danger-zone">
        <h3>Danger Zone</h3>
        <p>This action is permanent and cannot be undone. It will delete the patient and all associated records.</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleDelete} className="button delete">Delete This Patient</button>
        </div>
      </div>

      <Link href="/" style={{ display: 'block', textAlign: 'center', marginTop: 20 }}>Back to Home</Link>
    </div>
  )
}
