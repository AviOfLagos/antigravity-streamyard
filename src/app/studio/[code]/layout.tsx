import "@livekit/components-styles"
import { Toaster } from "sonner"

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <Toaster position="top-right" theme="dark" />
    </>
  )
}
