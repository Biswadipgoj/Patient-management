import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// --- Miasm scoring logic (server-side for export) ---
const MIASM_BINARY_ITEMS = new Set([32,33,34,36,45,49])
const PSORIC_SET = new Set([1,2,3,4,5,6,7,8,9,28,29,41,43,45,46,53,55,58,62,65,66,70])
const SYPHILITIC_SET = new Set([10,11,12,13,14,15,31,32,33,34,36,37,38,49,54,56,59,61,69,71])
const SYCOTIC_SET = new Set([17,18,19,20,21,22,23,24,25,26,27,42,44,47,48,50,51,52,57,60,63,64,67,68,72])

const miasm_questions = [
  "Anxious","Restless","Fearful","Easily gets angry from trifles","Quick, active",
  "Aggravation from mental excitement","Nervous","Dislike for bathing","Weeping disposition","Idiotic",
  "Suicidal tendency / thoughts","Keeping troubles to themselves","Impulsive","Obstinate","Fixed ideas",
  "Cruel","Cunning","Secretive","Suspicious","Selfish","Jealous","Mischievous","Cross","Rage",
  "Workaholics","Greedy","Avaricious","Easily fatigued mentally and physically","Hypersensitive mentally and physically",
  "Hair lustreless, breaks easily","Premature greying of hair","Depressed nasal root","High-arched palate",
  "Excessive salivation","Halitosis","Tongue large, flabby, imprinted","Crack on tongue",
  "Teeth irregular in shape and / or irregular alignment","Aversion to meat","Desire for cold food and drink",
  "Desire for hot food","Desire for both hot and cold food","Desire for sweet","Intolerance of meat",
  "History of suppressed eruptions","Skin dry, rough, unwashed appearance","Warts and warty growth",
  "Hair on unusual body parts","Congenital malformations","Offensive discharge","Thick, greenish-yellow discharge",
  "Fishy or Hering-brine odour","Burning sensation in different body parts","Asymmetrical body parts",
  "Chilly patient","Hot patient","Affected by both chill and heat","Aggravation from standing","Aggravation from heat",
  "Aggravation from rest","Aggravation at night","Aggravation in the morning","Aggravation from damp weather",
  "Aggravation from natural discharge","Amelioration from natural discharge",
  "Amelioration from reappearance of suppressed skin eruption","Amelioration from abnormal discharge",
  "Amelioration from continued motion","Amelioration from haemorrhage","Amelioration by rest",
  "Amelioration from breaking out of an ulcer","Amelioration from cold"
]

const susc_questions = [
  "Intelligence","Age (years)","Frequency of consuming allopathic medicines",
  "Frequency of consuming homeopathy and/or other AYUSH medicines",
  "Tendency to catch ailments, reaction to environmental changes","Familial predisposition to diseases",
  "Pathological state of present suffering","Substance abuse and/or dependence","Emotional state",
  "Degree of similarity obtained with the indicated homoeopathic medicine","Nature of symptoms","Mode of onset",
  "Duration of suffering","Perceived stress (PSS-14)","Organs involved","Occupation","History of similar sufferings",
  "Nature or gravity of disease","Body mass index","Reduced muscle mass (ASMI)",
  "Involuntary weight loss (%)","Reduced food intake"
]

function safeInt(x) {
  if (x == null) return 0
  const s = String(x).trim()
  if (s === '') return 0
  const n = parseInt(parseFloat(s))
  return isNaN(n) ? 0 : n
}

function scoreMiasmValue(raw, isBinary) {
  if (raw == null) return 0
  const v = String(raw).trim().toLowerCase()
  if (v === '' || v === '0') return 0
  if (isBinary) return ['yes','y','true','1','3'].includes(v) ? 3 : 0
  if (['strong','s'].includes(v)) return 3
  if (['moderate','mod','m'].includes(v)) return 2
  if (['mild','mi'].includes(v)) return 1
  if (['absent','a','no','n'].includes(v)) return 0
  const n = safeInt(v)
  return [0,1,2,3].includes(n) ? n : 0
}

function calcMiasmTotals(mj) {
  let ps=0,sy=0,sc=0
  for (let i=1;i<=72;i++){
    const raw = mj?.[`miasm_${i}`]
    const score = scoreMiasmValue(raw, MIASM_BINARY_ITEMS.has(i))
    if (PSORIC_SET.has(i)) ps+=score
    else if (SYPHILITIC_SET.has(i)) sy+=score
    else if (SYCOTIC_SET.has(i)) sc+=score
  }
  return {psoric:ps,syphilitic:sy,sycotic:sc}
}

function calcSuscTotal(sj) {
  let t=0
  for (let i=1;i<=susc_questions.length;i++) t+=safeInt(sj?.[`susc_${i}`])
  return t
}

/** Miasm value for Excel: empty/null → 0 */
function miasmExportVal(mj, idx) {
  const v = mj?.[`miasm_${idx}`]
  if (v == null || String(v).trim() === '') return 0
  return v
}

export async function GET() {
  const ExcelJS = (await import('exceljs')).default

  const { data: allPatients } = await supabase
    .from('patients').select('*').order('id')
  const { data: allBaselines } = await supabase
    .from('baseline_treatments').select('*')
  const { data: allOutcomes } = await supabase
    .from('outcome_assessments').select('*').order('assessment_number')

  const baselineMap = {}
  ;(allBaselines || []).forEach(b => { baselineMap[b.patient_id] = b })
  const outcomeMap = {}
  ;(allOutcomes || []).forEach(o => {
    if (!outcomeMap[o.patient_id]) outcomeMap[o.patient_id] = []
    outcomeMap[o.patient_id].push(o)
  })

  // Only patients with baseline, sorted by baseline date (exact Python behavior)
  const patients = (allPatients || []).filter(p => baselineMap[p.id])
  patients.sort((a, b) => (baselineMap[a.id]?.date || '').localeCompare(baselineMap[b.id]?.date || ''))

  if (!patients.length) {
    return new Response('No data to export', { status: 404 })
  }

  const wb = new ExcelJS.Workbook()
  const miasmFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFADD8E6' } }
  const suscFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } }
  const oridlFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFE0' } }

  // ======================================================
  // Sheet 1: Patient Information (SAME AS ORIGINAL)
  // ======================================================
  const ws1 = wb.addWorksheet('Patient Information')
  ws1.columns = [
    { header: 'Screening Date', key: 'screening_date', width: 15 },
    { header: 'Reg. No.', key: 'reg_no', width: 12 },
    { header: 'Name', key: 'name', width: 20 },
    { header: 'Age', key: 'age', width: 8 },
    { header: 'Sex', key: 'sex', width: 8 },
    { header: 'Residence', key: 'residence', width: 25 },
  ]
  patients.forEach(p => ws1.addRow({
    screening_date: p.screening_date, reg_no: p.reg_no, name: p.name,
    age: p.age, sex: p.sex, residence: p.residence
  }))

  // ======================================================
  // Sheet 2: Socio-demographic Data (SAME + BMI added)
  // ======================================================
  const ws2 = wb.addWorksheet('Socio-demographic Data')
  ws2.columns = [
    { header: 'Reg. No.', key: 'reg_no', width: 12 },
    { header: 'Name', key: 'name', width: 20 },
    { header: 'Height (ft/cm)', key: 'height', width: 14 },
    { header: 'Weight (kg)', key: 'weight_kg', width: 12 },
    { header: 'BMI', key: 'bmi', width: 8 },
    { header: 'Duration of suffering from MC', key: 'duration_mc', width: 28 },
    { header: 'Co-morbidities', key: 'co_morbidities', width: 20 },
    { header: 'Risk factors', key: 'risk_factors', width: 20 },
    { header: 'Treatment taken', key: 'treatment_taken', width: 20 },
    { header: 'Education status', key: 'education_status', width: 16 },
    { header: 'Socio-economic status', key: 'socio_economic_status', width: 20 },
  ]
  patients.forEach(p => ws2.addRow({
    reg_no: p.reg_no, name: p.name, height: p.height, weight_kg: p.weight_kg,
    bmi: p.bmi || '', duration_mc: p.duration_mc, co_morbidities: p.co_morbidities,
    risk_factors: p.risk_factors, treatment_taken: p.treatment_taken,
    education_status: p.education_status, socio_economic_status: p.socio_economic_status
  }))

  // ======================================================
  // Sheet 3: Baseline Treatment (Prescription→3 fields, Miasm 0 default)
  // ======================================================
  const ws3 = wb.addWorksheet('Baseline Treatment')
  const blCols = [
    { header: 'Reg. No.', key: 'reg_no', width: 12 },
    { header: 'Name', key: 'name', width: 20 },
    { header: 'Baseline Date', key: 'bl_date', width: 14 },
    { header: 'Present Complaint', key: 'present_complaint', width: 25 },
    { header: 'Medicine Prescribed', key: 'medicine_prescribed', width: 22 },
    { header: 'Potency', key: 'potency', width: 12 },
    { header: 'Dose / Doses', key: 'dose_doses', width: 14 },
  ]
  miasm_questions.forEach((q, i) => blCols.push({ header: `Miasm Q${i+1}: ${q}`, key: `mq_${i+1}`, width: 18 }))
  blCols.push({ header: 'Psoric Total', key: 'psoric', width: 12 })
  blCols.push({ header: 'Syphilitic Total', key: 'syphilitic', width: 14 })
  blCols.push({ header: 'Sycotic Total', key: 'sycotic', width: 12 })
  susc_questions.forEach((q, i) => blCols.push({ header: `Susceptibility Q${i+1}: ${q}`, key: `sq_${i+1}`, width: 18 }))
  blCols.push({ header: 'Susceptibility Total', key: 'susc_total', width: 18 })
  ws3.columns = blCols

  patients.forEach(p => {
    const bl = baselineMap[p.id]
    const mj = bl.miasm_data || {}
    const sj = bl.susceptibility_data || {}
    const totals = calcMiasmTotals(mj)
    const row = {
      reg_no: p.reg_no, name: p.name, bl_date: bl.date,
      present_complaint: bl.present_complaint,
      medicine_prescribed: bl.medicine_prescribed || '',
      potency: bl.potency || '',
      dose_doses: bl.dose_doses || '',
    }
    miasm_questions.forEach((_, i) => { row[`mq_${i+1}`] = miasmExportVal(mj, i+1) })
    row.psoric = totals.psoric; row.syphilitic = totals.syphilitic; row.sycotic = totals.sycotic
    susc_questions.forEach((_, i) => { row[`sq_${i+1}`] = sj[`susc_${i+1}`] || '' })
    row.susc_total = calcSuscTotal(sj)
    ws3.addRow(row)
  })

  // Color baseline headers
  ws3.getRow(1).eachCell((cell) => {
    const v = String(cell.value || '')
    if (v.startsWith('Miasm') || v.startsWith('Psoric') || v.startsWith('Syphilitic') || v.startsWith('Sycotic')) cell.fill = miasmFill
    else if (v.startsWith('Susceptibility')) cell.fill = suscFill
  })

  // ======================================================
  // Sheets 4-9: Outcome Assessment 1-6 (Prescription→3 fields)
  // ======================================================
  for (let num = 1; num <= 6; num++) {
    const rows = []
    patients.forEach(p => {
      const oas = outcomeMap[p.id] || []
      const oa = oas.find(o => o.assessment_number === num)
      if (!oa) return
      const row = {
        reg_no: p.reg_no, name: p.name, date: oa.date,
        brief_notes: oa.brief_notes,
        medicine_prescribed: oa.medicine_prescribed || '',
        potency: oa.potency || '',
        dose_doses: oa.dose_doses || '',
        oridl_mc: oa.oridl_main_complaint, oridl_wb: oa.oridl_wellbeing,
        prathot: oa.prathot_version
      }
      if (num === 6) {
        const mj = oa.miasm_data || {}
        const sj = oa.susceptibility_data || {}
        const totals = calcMiasmTotals(mj)
        miasm_questions.forEach((_, i) => { row[`mq_${i+1}`] = miasmExportVal(mj, i+1) })
        row.psoric = totals.psoric; row.syphilitic = totals.syphilitic; row.sycotic = totals.sycotic
        susc_questions.forEach((_, i) => { row[`sq_${i+1}`] = sj[`susc_${i+1}`] || '' })
        row.susc_total = calcSuscTotal(sj)
      }
      rows.push(row)
    })
    if (!rows.length) continue

    const ws = wb.addWorksheet(`Outcome Assessment ${num}`)
    const cols = [
      { header: 'Reg. No.', key: 'reg_no', width: 12 },
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Brief Notes', key: 'brief_notes', width: 25 },
      { header: 'Medicine Prescribed', key: 'medicine_prescribed', width: 22 },
      { header: 'Potency', key: 'potency', width: 12 },
      { header: 'Dose / Doses', key: 'dose_doses', width: 14 },
      { header: 'ORIDL - Main Complaint', key: 'oridl_mc', width: 22 },
      { header: 'ORIDL - Overall Well-being', key: 'oridl_wb', width: 22 },
      { header: 'PRATHoT V 2.2', key: 'prathot', width: 16 },
    ]
    if (num === 6) {
      miasm_questions.forEach((q, i) => cols.push({ header: `Miasm Q${i+1}: ${q}`, key: `mq_${i+1}`, width: 18 }))
      cols.push({ header: 'Psoric Total', key: 'psoric', width: 12 })
      cols.push({ header: 'Syphilitic Total', key: 'syphilitic', width: 14 })
      cols.push({ header: 'Sycotic Total', key: 'sycotic', width: 12 })
      susc_questions.forEach((q, i) => cols.push({ header: `Susceptibility Q${i+1}: ${q}`, key: `sq_${i+1}`, width: 18 }))
      cols.push({ header: 'Susceptibility Total', key: 'susc_total', width: 18 })
    }
    ws.columns = cols
    rows.forEach(r => ws.addRow(r))

    // Color OA headers
    ws.getRow(1).eachCell((cell) => {
      const v = String(cell.value || '')
      if (v.startsWith('Miasm') || v.startsWith('Psoric') || v.startsWith('Syphilitic') || v.startsWith('Sycotic')) cell.fill = miasmFill
      else if (v.startsWith('Susceptibility')) cell.fill = suscFill
      else if (v.startsWith('ORIDL')) cell.fill = oridlFill
    })
  }

  // ======================================================
  // Sheet: Back Page Report (BMI + Miasm + Prescription)
  // ======================================================
  const wsBack = wb.addWorksheet('Back Page Report')
  const bpCols = [
    { header: 'Reg. No.', key: 'reg_no', width: 12 },
    { header: 'Name', key: 'name', width: 20 },
    { header: 'Age', key: 'age', width: 8 },
    { header: 'Sex', key: 'sex', width: 8 },
    { header: 'Height (ft/cm)', key: 'height', width: 14 },
    { header: 'Weight (kg)', key: 'weight_kg', width: 12 },
    { header: 'BMI', key: 'bmi', width: 8 },
    { header: 'Baseline Date', key: 'bl_date', width: 14 },
    { header: 'Present Complaint', key: 'present_complaint', width: 25 },
    { header: 'Medicine Prescribed', key: 'medicine_prescribed', width: 22 },
    { header: 'Potency', key: 'potency', width: 12 },
    { header: 'Dose / Doses', key: 'dose_doses', width: 14 },
  ]
  miasm_questions.forEach((q, i) => bpCols.push({ header: `Miasm Q${i+1}: ${q}`, key: `mq_${i+1}`, width: 18 }))
  bpCols.push({ header: 'Psoric Total', key: 'psoric', width: 12 })
  bpCols.push({ header: 'Syphilitic Total', key: 'syphilitic', width: 14 })
  bpCols.push({ header: 'Sycotic Total', key: 'sycotic', width: 12 })
  susc_questions.forEach((q, i) => bpCols.push({ header: `Susceptibility Q${i+1}: ${q}`, key: `sq_${i+1}`, width: 18 }))
  bpCols.push({ header: 'Susceptibility Total', key: 'susc_total', width: 18 })
  wsBack.columns = bpCols

  patients.forEach(p => {
    const bl = baselineMap[p.id]
    const mj = bl.miasm_data || {}
    const sj = bl.susceptibility_data || {}
    const totals = calcMiasmTotals(mj)
    const row = {
      reg_no: p.reg_no, name: p.name, age: p.age, sex: p.sex,
      height: p.height, weight_kg: p.weight_kg, bmi: p.bmi || '',
      bl_date: bl.date, present_complaint: bl.present_complaint,
      medicine_prescribed: bl.medicine_prescribed || '',
      potency: bl.potency || '',
      dose_doses: bl.dose_doses || '',
    }
    miasm_questions.forEach((_, i) => { row[`mq_${i+1}`] = miasmExportVal(mj, i+1) })
    row.psoric = totals.psoric; row.syphilitic = totals.syphilitic; row.sycotic = totals.sycotic
    susc_questions.forEach((_, i) => { row[`sq_${i+1}`] = sj[`susc_${i+1}`] || '' })
    row.susc_total = calcSuscTotal(sj)
    wsBack.addRow(row)
  })

  // Color back page headers
  wsBack.getRow(1).eachCell((cell) => {
    const v = String(cell.value || '')
    if (v.startsWith('Miasm') || v.startsWith('Psoric') || v.startsWith('Syphilitic') || v.startsWith('Sycotic')) cell.fill = miasmFill
    else if (v.startsWith('Susceptibility')) cell.fill = suscFill
  })

  // ======================================================
  // Auto-fit column widths (same as original Python styling)
  // ======================================================
  wb.eachSheet(ws => {
    ws.columns.forEach(col => {
      let maxLen = String(col.header || '').length
      col.eachCell({ includeEmpty: false }, cell => {
        const len = String(cell.value || '').length
        if (len > maxLen) maxLen = len
      })
      col.width = Math.min(maxLen + 2, 52)
    })
  })

  const buffer = await wb.xlsx.writeBuffer()
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="patient_data.xlsx"'
    }
  })
}
