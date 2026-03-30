'use client'
import { useEffect, useState } from 'react'

export default function FlashMessage({ message, type = 'success', onClear }) {
  const [visible, setVisible] = useState(!!message)

  useEffect(() => {
    if (message) {
      setVisible(true)
      const t = setTimeout(() => { setVisible(false); onClear?.() }, 4000)
      return () => clearTimeout(t)
    }
  }, [message])

  if (!visible || !message) return null

  return (
    <div className={`flash-message ${type}`}>
      {message}
    </div>
  )
}
