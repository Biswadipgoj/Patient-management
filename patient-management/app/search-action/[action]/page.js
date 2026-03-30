'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function SearchAction() {
  const router = useRouter()
  const { action } = useParams()
  const [regNo, setRegNo] = useState('')
  const [date, setDate] = useState('')
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')

  const searchByReg = async (e) => {
    e.preventDefault()
    setError('')
    const { data: p } = await supabase.from('patients').select('*, baseline_treatments(date)')
      .eq('reg_no', regNo.trim()).maybeSingle()
    if (!p) { setError('Patient not found.'); setResults(null); return }
    setResults([p])
  }

  const searchByDate = async (e) => {
    e.preventDefault()
    setError('')
    const { data: bl } = await supabase.from('baseline_treatments').select('patient_id').eq('date', date)
    if (!bl?.length) { setError('Patient not found.'); setResults(null); return }
    const ids = bl.map(b => b.patient_id)
    const { data: pts } = await supabase.from('patients').select('*, baseline_treatments(date)').in('id', ids)
    setResults(pts || [])
  }

  const handleDelete = async (patientId) => {
    if (!confirm('Are you sure you want to delete this patient?')) return
    await supabase.from('outcome_assessments').delete().eq('patient_id', patientId)
    await supabase.from('baseline_treatments').delete().eq('patient_id', patientId)
    await supabase.from('patients').delete().eq('id', patientId)
    setResults(prev => prev.filter(p => p.id !== patientId))
  }

  const label = action === 'delete' ? 'Delete' : 'Modify'

  return (
    <>
      <div className="card">
        <h2>Search for Patient to {label}</h2>
        {error && <div className="flash-message error">{error}</div>}
        <form onSubmit={searchByReg} style={{ marginBottom: 20 }} autoComplete="off">
          <label>Search by Reg. No.</label>
          <div className="search-row">
            <input type="text" placeholder="Enter Reg. No." value={regNo} onChange={e => setRegNo(e.target.value)} required />
            <button type="submit" className="button">Search</button>
          </div>
        </form>
        <form onSubmit={searchByDate} autoComplete="off">
          <label>Search by Baseline Date</label>
          <div className="search-row">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
            <button type="submit" className="button">Search</button>
          </div>
        </form>
        <Link href="/" style={{ display: 'block', textAlign: 'center', marginTop: 30 }}>Back to Home</Link>
      </div>

      {results && results.length > 0 && (
        <div className="card">
          <h2>Results: Select Patient to {label}</h2>
          <table>
            <thead><tr><th>Baseline Date</th><th>Reg. No.</th><th>Name</th><th>Actions</th></tr></thead>
            <tbody>
              {results.map(p => (
                <tr key={p.id}>
                  <td>{p.baseline_treatments?.[0]?.date || 'N/A'}</td>
                  <td>{p.reg_no}</td>
                  <td>{p.name}</td>
                  <td>
                    {action === 'modify' ? (
                      <Link href={`/patient-details?search_query=${encodeURIComponent(p.reg_no)}`} className="button">Manage</Link>
                    ) : (
                      <button onClick={() => handleDelete(p.id)} className="button delete">Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
