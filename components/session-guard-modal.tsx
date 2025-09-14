"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Clock, Target, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

interface SessionGoal {
  id: string
  text: string
  completed: boolean
}

interface SessionStats {
  goal: string
  targetDuration: number
  sessionTime: number
  focusedTime: number
  violations: number
  checklist: SessionGoal[]
}

interface SessionGuardModalProps {
  isOpen: boolean
  stats: SessionStats
  onApprove: () => void
  onDeny: (feedback: string) => void
}

export function SessionGuardModal({ isOpen, stats, onApprove, onDeny }: SessionGuardModalProps) {
  const [reflection, setReflection] = useState("")
  const [checklist, setChecklist] = useState<SessionGoal[]>(stats.checklist)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [aiResponse, setAiResponse] = useState<{ allow: boolean; feedback: string; roast: string } | null>(null)

  const focusPercentage = stats.sessionTime > 0 ? Math.round((stats.focusedTime / stats.sessionTime) * 100) : 100
  const targetPercentage = Math.round((stats.sessionTime / (stats.targetDuration * 60)) * 100)
  const completedTasks = checklist.filter((item) => item.completed).length

  const toggleChecklistItem = (id: string) => {
    setChecklist(checklist.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)))
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const evaluateSession = async () => {
    setIsEvaluating(true)

    try {
      const response = await fetch("/api/llm/guard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalMinutes: stats.targetDuration,
          elapsedSeconds: stats.sessionTime,
          violations: stats.violations,
          reflection,
          checklistComplete: completedTasks === checklist.length && checklist.length > 0,
          focusPercentage,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setAiResponse(data)

        if (data.allow) {
          setTimeout(() => onApprove(), 2000)
        }
      } else {
        // Fallback evaluation logic
        const reflectionBullets = reflection.split("\n").filter((line) => line.trim().length > 10).length
        const timeGoalMet = targetPercentage >= 80
        const shouldAllow = reflectionBullets >= 3 || timeGoalMet

        setAiResponse({
          allow: shouldAllow,
          feedback: shouldAllow
            ? "Great work! You've demonstrated good reflection on your session."
            : "Please provide more detailed reflection on what you learned or accomplished.",
          roast: shouldAllow ? "" : "Come on, give me more than that! What did you actually learn?",
        })

        if (shouldAllow) {
          setTimeout(() => onApprove(), 2000)
        }
      }
    } catch (error) {
      console.error("Error evaluating session:", error)
      setAiResponse({
        allow: false,
        feedback: "Unable to evaluate session right now. This could be due to network issues or the AI service being temporarily unavailable. Please try again.",
        roast: "Oops! Looks like I'm having a technical hiccup. Give me another shot!",
      })
    } finally {
      setIsEvaluating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            Session Guard
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Time</span>
              </div>
              <div className="text-lg font-bold">{formatTime(stats.focusedTime)}</div>
              <div className="text-xs text-muted-foreground">
                {formatTime(stats.sessionTime)} total ({focusPercentage}% focused)
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Goal Progress</span>
              </div>
              <div className="text-lg font-bold">{targetPercentage}%</div>
              <div className="text-xs text-muted-foreground">of {stats.targetDuration}m target</div>
            </Card>
          </div>

          {/* Goal */}
          <div>
            <h4 className="font-medium mb-2">Session Goal</h4>
            <p className="text-sm text-muted-foreground bg-secondary p-3 rounded">{stats.goal}</p>
          </div>

          {/* Checklist */}
          {checklist.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">
                Tasks ({completedTasks}/{checklist.length} completed)
              </h4>
              <div className="space-y-2">
                {checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <Checkbox checked={item.completed} onCheckedChange={() => toggleChecklistItem(item.id)} />
                    <span className={`text-sm ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reflection */}
          <div>
            <h4 className="font-medium mb-2">Reflection (required to end session)</h4>
            <Textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="What did you accomplish? What did you learn? What challenges did you face? (Provide at least 3 detailed points)"
              className="min-h-24"
              disabled={isEvaluating || aiResponse?.allow}
            />
          </div>

          {/* AI Response */}
          {aiResponse && (
            <Card
              className={`p-4 ${aiResponse.allow ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}`}
            >
              <div className="flex items-center gap-2 mb-2">
                {aiResponse.allow ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                )}
                <span className="font-medium">{aiResponse.allow ? "Session Approved!" : "Not Quite There"}</span>
              </div>
              <p className="text-sm mb-2">{aiResponse.feedback}</p>
              {aiResponse.roast && <p className="text-sm italic text-muted-foreground">"{aiResponse.roast}"</p>}
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {!aiResponse?.allow && (
              <Button
                onClick={evaluateSession}
                disabled={isEvaluating || !reflection.trim()}
                className="flex-1"
                variant={aiResponse && !aiResponse.allow ? "outline" : "default"}
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Evaluating...
                  </>
                ) : (
                  "Request to End Session"
                )}
              </Button>
            )}

            {aiResponse?.allow && (
              <Button onClick={onApprove} className="flex-1">
                <CheckCircle className="w-4 h-4 mr-2" />
                End Session
              </Button>
            )}
          </div>

          {aiResponse && !aiResponse.allow && (
            <p className="text-xs text-center text-muted-foreground">
              Tip: Provide more detailed reflection or reach 80% of your time goal to end the session
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
