"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface SessionGoal {
  id: string
  text: string
  completed: boolean
}

interface SessionSetupData {
  goal: string
  duration: number
  checklist: SessionGoal[]
}

interface SessionSetupModalProps {
  isOpen: boolean
  onClose: () => void
  onStart: (data: SessionSetupData) => void
}

export function SessionSetupModal({ isOpen, onClose, onStart }: SessionSetupModalProps) {
  const [goal, setGoal] = useState("")
  const [duration, setDuration] = useState(60)
  const [checklist, setChecklist] = useState<SessionGoal[]>([])
  const [newChecklistItem, setNewChecklistItem] = useState("")

  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      const newItem: SessionGoal = {
        id: Date.now().toString(),
        text: newChecklistItem.trim(),
        completed: false,
      }
      setChecklist([...checklist, newItem])
      setNewChecklistItem("")
    }
  }

  const removeChecklistItem = (id: string) => {
    setChecklist(checklist.filter((item) => item.id !== id))
  }

  const handleStart = () => {
    if (!goal.trim()) return

    onStart({
      goal: goal.trim(),
      duration,
      checklist,
    })

    // Reset form
    setGoal("")
    setDuration(60)
    setChecklist([])
    setNewChecklistItem("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Setup Focus Session</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Goal */}
          <div className="space-y-2">
            <Label htmlFor="goal">What's your main goal for this session?</Label>
            <Textarea
              id="goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g., Complete Chapter 5 math problems, Review biology notes for exam..."
              className="min-h-20"
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Target duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number.parseInt(e.target.value) || 60)}
              min={5}
              max={480}
              className="w-full"
            />
          </div>

          {/* Optional Checklist */}
          <div className="space-y-2">
            <Label>Optional checklist</Label>
            <div className="flex gap-2">
              <Input
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                placeholder="Add a task..."
                onKeyPress={(e) => e.key === "Enter" && addChecklistItem()}
              />
              <Button onClick={addChecklistItem} variant="outline" size="sm">
                Add
              </Button>
            </div>

            {checklist.length > 0 && (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm">
                    <Checkbox disabled />
                    <span className="flex-1">{item.text}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeChecklistItem(item.id)}>
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button onClick={handleStart} disabled={!goal.trim()} className="flex-1">
              Start Session
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
