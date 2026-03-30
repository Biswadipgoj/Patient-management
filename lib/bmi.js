/**
 * Calculate BMI from height and weight.
 * Accepts height in cm (e.g. "170"), feet-inches (e.g. "5'6", "5.6"),
 * or meters (e.g. "1.7"). Weight must be in kg.
 * Returns BMI rounded to 1 decimal, or null if not calculable.
 */
export function calculateBMI(heightRaw, weightRaw) {
  if (!heightRaw || !weightRaw) return null

  const h = String(heightRaw).trim()
  const w = parseFloat(String(weightRaw).trim())
  if (isNaN(w) || w <= 0) return null

  let heightM = null

  // Pattern: 5'6 or 5'6" or 5' 6" (feet + inches)
  const ftIn = h.match(/^(\d+)['']\s*(\d*\.?\d*)["""]?\s*$/)
  if (ftIn) {
    const feet = parseFloat(ftIn[1])
    const inches = ftIn[2] ? parseFloat(ftIn[2]) : 0
    heightM = ((feet * 12) + inches) * 0.0254
  }

  // Pattern: plain number
  if (!heightM) {
    const num = parseFloat(h)
    if (isNaN(num) || num <= 0) return null

    if (num > 100) {
      // Likely cm (e.g. 170)
      heightM = num / 100
    } else if (num > 3) {
      // Likely feet decimal (e.g. 5.6 = 5 feet 6 inches)
      const feet = Math.floor(num)
      const inches = Math.round((num - feet) * 10)
      heightM = ((feet * 12) + inches) * 0.0254
    } else {
      // Likely meters (e.g. 1.7)
      heightM = num
    }
  }

  if (!heightM || heightM <= 0) return null

  const bmi = w / (heightM * heightM)
  if (bmi < 5 || bmi > 100) return null // sanity check
  return Math.round(bmi * 10) / 10
}
