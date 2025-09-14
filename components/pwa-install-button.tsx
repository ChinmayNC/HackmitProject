"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, X } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
      return
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallBanner(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallBanner(false)
      setDeferredPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      setShowInstallBanner(false)
    }

    setDeferredPrompt(null)
  }

  if (isInstalled || !showInstallBanner) {
    return null
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-card border rounded-lg shadow-lg p-4 flex items-center gap-3 max-w-sm">
        <Download className="w-5 h-5 text-accent" />
        <div className="flex-1">
          <p className="text-sm font-medium">Install Lock-In</p>
          <p className="text-xs text-muted-foreground">Get the full experience</p>
        </div>
        <Button size="sm" onClick={handleInstallClick}>
          Install
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setShowInstallBanner(false)} className="w-8 h-8">
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
