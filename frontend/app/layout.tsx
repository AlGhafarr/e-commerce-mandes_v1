import type { Metadata, Viewport } from 'next'
import { Inter, Poppins } from 'next/font/google'
import './globals.css'
import ClientLayout from './ClientLayout'; 

// --- 1. FONT CONFIGURATION ---
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
})

// --- 2. METADATA CONFIGURATION (SEO) ---
export const metadata: Metadata = {
  title: {
    default: 'Mandes Snack & Food - Toko Cemilan Online Terpercaya',
    template: '%s | Mandes Snack & Food'
  },
  description: 'Nikmati berbagai pilihan snack berkualitas dengan harga terjangkau. Cemilan lezat untuk keluarga Indonesia.',
  keywords: ['toko cemilan online', 'snack murah', 'jual cemilan', 'keripik singkong', 'kacang mete'],
  authors: [{ name: 'Mandes Snack & Food' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: '/',
    title: 'Mandes Snack & Food',
    description: 'Cemilan lezat untuk keluarga Indonesia',
    siteName: 'Mandes Snack & Food',
  },
}

// --- 3. VIEWPORT CONFIGURATION ---
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#FCF9EA',
}

// --- 4. ROOT LAYOUT COMPONENT ---
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      
      <body className={`${inter.className} antialiased`}>
        {/* Panggil ClientLayout yang berisi Provider & Modal */}
        <ClientLayout>
            {children}
        </ClientLayout>
      </body>
    </html>
  )
}