"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Play, Pause, Square } from "lucide-react"

interface TimerProps {
  sessionTime: number
  focusedTime: number
  isActive: boolean
  isVisible: boolean
  isFullscreen: boolean
  onEnd: () => void
  onTimeUpdate: (sessionTime: number, focusedTime: number) => void
}

export function Timer({
  sessionTime,
  focusedTime,
  isActive,
  isVisible,
  isFullscreen,
  onEnd,
  onTimeUpdate,
}: TimerProps) {
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (!isActive || isPaused) return

    const interval = setInterval(() => {
      const newSessionTime = sessionTime + 1
      // Only increment focused time if visible and fullscreen
      const newFocusedTime = isVisible && isFullscreen ? focusedTime + 1 : focusedTime

      onTimeUpdate(newSessionTime, newFocusedTime)
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, isPaused, sessionTime, focusedTime, isVisible, isFullscreen, onTimeUpdate])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const focusPercentage = sessionTime > 0 ? Math.round((focusedTime / sessionTime) * 100) : 100

  return (
    <Card className="p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Focus Session</h2>

        {/* Main Timer Display */}
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Locked in for:</p>
            <div className="text-4xl font-mono font-bold text-accent">{formatTime(focusedTime)}</div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Total time:</p>
            <div className="text-2xl font-mono">{formatTime(sessionTime)}</div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Focus rate:</p>
            <div className="text-xl font-semibold">{focusPercentage}%</div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="mt-6 space-y-2">
          <div
            className={`flex items-center justify-center gap-2 text-sm ${
              isVisible && isFullscreen ? "text-green-500" : "text-yellow-500"
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${isVisible && isFullscreen ? "bg-green-500" : "bg-yellow-500"}`} />
            {isVisible && isFullscreen ? "Focused" : "Distracted"}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2 mt-6">
          <Button variant="outline" size="sm" onClick={() => setIsPaused(!isPaused)} className="flex-1">
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {isPaused ? "Resume" : "Pause"}
          </Button>
          <Button variant="destructive" size="sm" onClick={onEnd} className="flex-1">
            <Square className="w-4 h-4 mr-1" />
            End Session
          </Button>
        </div>
      </div>
    </Card>
  )
}
