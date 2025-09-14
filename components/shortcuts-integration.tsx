"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { QrCode, Smartphone, Copy, Check } from "lucide-react"

export function ShortcutsIntegration() {
  const [copiedShortcut, setCopiedShortcut] = useState<string | null>(null)

  const shortcuts = [
    {
      name: "Lock-In Start",
      description: "Start a focus session",
      url: `shortcuts://run-shortcut?name=LockInOn&input=60`,
      qrData: `shortcuts://run-shortcut?name=LockInOn&input=60`,
    },
    {
      name: "Lock-In Stop",
      description: "End current session",
      url: `shortcuts://run-shortcut?name=LockInOff`,
      qrData: `shortcuts://run-shortcut?name=LockInOff`,
    },
  ]

  const copyToClipboard = async (text: string, shortcutName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedShortcut(shortcutName)
      setTimeout(() => setCopiedShortcut(null), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const generateQRCode = (data: string) => {
    // Simple QR code placeholder - in production, use a QR code library
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-border text-gray-700 hover:bg-accent hover:text-accent-foreground bg-transparent"
        >
          <Smartphone className="w-4 h-4 mr-2" />
          iPhone Shortcuts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            iPhone Shortcuts Integration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Set up iPhone Shortcuts to control Screen Time and launch Lock-In sessions directly from your home screen.
          </p>

          {shortcuts.map((shortcut) => (
            <Card key={shortcut.name} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium">{shortcut.name}</h4>
                  <p className="text-sm text-muted-foreground">{shortcut.description}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(shortcut.url, shortcut.name)}
                    className="w-8 h-8"
                  >
                    {copiedShortcut === shortcut.name ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <code className="text-xs bg-secondary p-2 rounded block break-all">{shortcut.url}</code>
                </div>
                <div className="text-center">
                  <QrCode className="w-4 h-4 mx-auto mb-1" />
                  <img
                    src={generateQRCode(shortcut.qrData) || "/placeholder.svg"}
                    alt={`QR code for ${shortcut.name}`}
                    className="w-16 h-16 border rounded"
                  />
                </div>
              </div>
            </Card>
          ))}

          <div className="text-xs text-muted-foreground space-y-2">
            <p>
              <strong>Setup Instructions:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open iPhone Shortcuts app</li>
              <li>Create new shortcut with the name "LockInOn" or "LockInOff"</li>
              <li>Add "Open URL" action with the URL above</li>
              <li>Optionally add Screen Time controls</li>
              <li>Save and add to home screen</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
