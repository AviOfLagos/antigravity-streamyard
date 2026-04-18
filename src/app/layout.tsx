import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import "@livekit/components-styles"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "StreamYard Clone",
  description: "Go live in seconds",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950 text-white antialiased`}>
        {children}
      </body>
    </html>
  )
}
