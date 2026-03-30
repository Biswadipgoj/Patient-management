'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ViewAll() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('patients')
        .select('*, baseline_treatments(date)')
        .order('id', { ascending: true })
      // Filter to only patients with baseline
      const withBaseline = (data || []).filter(p => p.baseline_treatments?.length > 0)
      // Sort by baseline date
      withBaseline.sort((a, b) => {
        const da = a.baseline_treatments?.[0]?.date || ''
        const db = b.baseline_treatments?.[0]?.date || ''
        return da.localeCompare(db)
      })
      setPatients(withBaseline)
      setLoading(false)
    })()
  }, [])

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/export')
      if (!res.ok) { alert('No data to export.'); setExporting(false); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'patient_data.xlsx'; a.click()
      URL.revokeObjectURL(url)
    } catch (e) { alert('Export failed: ' + e.message) }
    setExporting(false)
  }

  if (loading) return <div className="card"><p>Loading...</p></div>

  return (
    <div className="card">
      <h2>
        All Patients
        <button onClick={handleExport} className="nav-button" disabled={exporting}
          style={{ float: 'right', width: 'auto', padding: '10px 20px', fontSize: '0.8em', marginTop: -10 }}>
          {exporting ? 'Exporting...' : 'Export All Data'}
        </button>
      </h2>
      {patients.length > 0 ? (
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
      ) : <p>No patients found.</p>}
      <Link href="/" style={{ display: 'block', textAlign: 'center', marginTop: 20 }}>Back to Home</Link>
    </div>
  )
}
