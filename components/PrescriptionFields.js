'use client'

export default function PrescriptionFields({ defaults = {} }) {
  return (
    <>
      <h3>Prescription</h3>
      <label>Medicine Prescribed:</label>
      <input type="text" name="medicine_prescribed" defaultValue={defaults.medicine_prescribed || ''} />
      <label>Potency:</label>
      <input type="text" name="potency" defaultValue={defaults.potency || ''} />
      <label>Dose / Doses:</label>
      <input type="text" name="dose_doses" defaultValue={defaults.dose_doses || ''} />
    </>
  )
}
