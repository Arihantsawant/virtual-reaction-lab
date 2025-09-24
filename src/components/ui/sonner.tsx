import { Toaster as Sonner, ToasterProps } from "sonner"
import type { CSSProperties } from "react"

const Toaster = ({ ...props }: ToasterProps) => {
  const theme: ToasterProps["theme"] = "system"

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }