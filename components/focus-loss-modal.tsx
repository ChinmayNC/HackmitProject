"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

interface FocusLossModalProps {
  isOpen: boolean
  onLockBackIn: () => void
  onStayDistracted: () => void
  sessionTime: number
  focusedTime: number
  violations: number
}

export function FocusLossModal({ 
  isOpen, 
  onLockBackIn, 
  onStayDistracted, 
  sessionTime, 
  focusedTime, 
  violations 
}: FocusLossModalProps) {
  const [roastMessage, setRoastMessage] = useState("Really? Already?")
  const [isLoading, setIsLoading] = useState(true)
  const [hasGenerated, setHasGenerated] = useState(false)

  useEffect(() => {
    if (isOpen && !hasGenerated) {
      generateRoastMessage()
    } else if (!isOpen) {
      // Reset when modal closes so it can generate new message next time
      setHasGenerated(false)
      setIsLoading(true)
    }
  }, [isOpen, hasGenerated]) // Only regenerate when modal opens and hasn't generated yet

  const generateRoastMessage = async () => {
    if (hasGenerated) return // Prevent multiple calls
    setIsLoading(true)
    setHasGenerated(true)
    try {
      const response = await fetch("/api/llm/guard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionTime,
          focusedTime,
          violations,
          focusRate: sessionTime > 0 ? Math.round((focusedTime / sessionTime) * 100) : 100,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setRoastMessage(data.message || "Really? Already?")
      } else {
        // Fallback roast messages
        const fallbackRoasts = [
          "Really? Already? Your attention span is shorter than a goldfish's memory!",
          "Come on! You couldn't even focus for 2 seconds? Time to get serious!",
          "Distraction detected! Your future self will thank you for staying focused.",
          "Focus slipping? Remember why you started this session!",
          "That was quick! Ready to dive back into deep work?",
        ]
        const randomRoast = fallbackRoasts[Math.floor(Math.random() * fallbackRoasts.length)]
        setRoastMessage(randomRoast)
      }
    } catch (error) {
      console.error("Error generating roast message:", error)
      setRoastMessage("Really? Already? Time to get serious about your goals!")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-8 max-w-md mx-4 text-center">
        <div className="text-6xl mb-4">😤</div>
        <h2 className="text-2xl font-bold mb-4">Focus Lost!</h2>
        {isLoading ? (
          <div className="flex items-center justify-center mb-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : (
          <p className="text-muted-foreground mb-6">
            {roastMessage}
          </p>
        )}
        <div className="flex gap-3">
          <Button 
            onClick={onLockBackIn}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            🔒 Lock Back In
          </Button>
          <Button 
            onClick={onStayDistracted}
            variant="outline"
            className="flex-1"
          >
            I'll Stay Distracted
          </Button>
        </div>
      </div>
    </div>
  )
}
