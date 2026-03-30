import './globals.css'

export const metadata = {
  title: 'Patient Management System',
  description: 'Patient Database Management',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          {children}
        </div>
      </body>
    </html>
  )
}
