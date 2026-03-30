'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()
  const [regNo, setRegNo] = useState('')
  const [date, setDate] = useState('')
  const [error, setError] = useState('')

  const searchByReg = (e) => {
    e.preventDefault()
    if (regNo.trim()) router.push(`/patient-details?search_query=${encodeURIComponent(regNo.trim())}`)
  }

  const searchByDate = (e) => {
    e.preventDefault()
    if (date) router.push(`/patient-details?search_query=${encodeURIComponent(date)}&search_by_date=1`)
  }

  return (
    <>
      <div className="header" style={{ textAlign: 'center', padding: '40px 0', marginBottom: '40px' }}>
        <h1>PATIENT DATABASE MANAGEMENT</h1>
      </div>

      <div className="nav">
        <Link href="/add-patient" className="nav-button">Add Patient</Link>
        <Link href="/view-all" className="nav-button">View All Data</Link>
        <Link href="/search-action/modify" className="nav-button">Modify Patient</Link>
        <Link href="/search-action/delete" className="nav-button">Delete Patient</Link>
      </div>

      {error && <div className="flash-message error">{error}</div>}

      <div className="card">
        <h2>Search Directly for a Patient</h2>
        <form onSubmit={searchByReg} style={{ marginBottom: '20px' }} autoComplete="off">
          <label htmlFor="search_query_reg">Search by Reg. No.</label>
          <div className="search-row">
            <input type="text" id="search_query_reg" placeholder="Enter Reg. No."
              value={regNo} onChange={e => setRegNo(e.target.value)} required />
            <button type="submit" className="button">Search</button>
          </div>
        </form>
        <form onSubmit={searchByDate} autoComplete="off">
          <label htmlFor="search_query_date">Search by Baseline Date</label>
          <div className="search-row">
            <input type="date" id="search_query_date"
              value={date} onChange={e => setDate(e.target.value)} required />
            <button type="submit" className="button">Search</button>
          </div>
        </form>
      </div>
    </>
  )
}
