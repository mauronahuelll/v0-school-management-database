import type { Metadata, Viewport } from 'next'
import { Geist, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/lib/context/auth-context'
import { SchoolSettingsProvider } from '@/lib/context/school-settings-context'
import { StaffFieldsProvider } from '@/lib/context/staff-fields-context'
import { AppShell } from '@/components/layout/app-shell'
import './globals.css'

const geist = Geist({ 
  subsets: ["latin"],
  variable: "--font-geist",
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f5f2" },
    { media: "(prefers-color-scheme: dark)", color: "#131319" },
  ],
};

export const metadata: Metadata = {
  title: 'Sequency - Hub Académico',
  description: 'Sistema de Gestión Escolar que conecta escuelas, docentes y familias',
  generator: 'Sequency',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${geist.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased bg-background overflow-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          <AuthProvider>
            <SchoolSettingsProvider>
              <StaffFieldsProvider>
                <AppShell>
                  {children}
                </AppShell>
              </StaffFieldsProvider>
            </SchoolSettingsProvider>
          </AuthProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
