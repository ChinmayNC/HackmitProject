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
  isPaused: boolean
  onEnd: () => void
  onPauseResume: () => void
  onTimeUpdate: (sessionTime: number, focusedTime: number) => void
}

export function Timer({
  sessionTime,
  focusedTime,
  isActive,
  isVisible,
  isFullscreen,
  isPaused,
  onEnd,
  onPauseResume,
  onTimeUpdate,
}: TimerProps) {

  // Timer logic is now handled in the parent component

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const focusPercentage = sessionTime > 0 ? Math.round((focusedTime / sessionTime) * 100) : 100

  return (
    <Card className="p-4 space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-3">Focus Session</h2>

        {/* Main Timer Display */}
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Locked in for:</p>
            <div className="text-3xl font-mono font-bold text-accent">{formatTime(focusedTime)}</div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Total time:</p>
            <div className="text-xl font-mono">{formatTime(sessionTime)}</div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Focus rate:</p>
            <div className="text-lg font-semibold">{focusPercentage}%</div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="mt-4 space-y-2">
          <div
            className={`flex items-center justify-center gap-2 text-sm ${
              isVisible ? "text-green-500" : "text-red-500"
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${isVisible ? "bg-green-500" : "bg-red-500"}`} />
            {isVisible ? "Focused" : "Unfocused"}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={onPauseResume} className="flex-1">
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
