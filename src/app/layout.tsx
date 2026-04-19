import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Zerocast — Browser-based Live Studio",
  description:
    "Invite guests, unify chat, go live across YouTube, Twitch, Kick and TikTok — all from your browser.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#080808] text-white antialiased`}>
        {children}
      </body>
    </html>
  )
}
