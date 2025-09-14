"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send } from "lucide-react"

interface Message {
  id: string
  type: "user" | "assistant" | "roast"
  content: string
  timestamp: Date
}

interface StudyBuddyProps {
  isVisible: boolean
  isFullscreen: boolean
  sessionTime: number
  focusedTime: number
}

export function StudyBuddy({ isVisible, isFullscreen, sessionTime, focusedTime }: StudyBuddyProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "assistant",
      content: "Hey",
      timestamp: new Date(),
    },
    {
      id: "2",
      type: "assistant",
      content: "Ready to study?",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [lastViolationTime, setLastViolationTime] = useState<number>(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Detect focus violations and trigger roasts
  useEffect(() => {
    const now = Date.now()
    const wasViolation = !isVisible || !isFullscreen
    const timeSinceLastRoast = now - lastViolationTime

    // Only roast if it's been more than 10 seconds since last roast to avoid spam
    if (wasViolation && sessionTime > 0 && timeSinceLastRoast > 10000) {
      triggerRoast()
      setLastViolationTime(now)
    }
  }, [isVisible, isFullscreen, sessionTime, lastViolationTime])

  const triggerRoast = async () => {
    const roastMessages = [
      "Hey! Eyes back on the screen. That notification can wait! 👀",
      "Focus slipping? Remember why you started this session!",
      "Distraction detected! Your future self will thank you for staying focused.",
      "Come on, you've got this! Don't let that tab switch break your flow.",
      "Focus mode activated... or was it? Get back in there!",
      "That was a quick break! Ready to dive back into deep work?",
    ]

    const randomRoast = roastMessages[Math.floor(Math.random() * roastMessages.length)]

    const roastMessage: Message = {
      id: Date.now().toString(),
      type: "roast",
      content: randomRoast,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, roastMessage])
  }

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      // Simulate AI response (replace with actual API call)
      const response = await fetch("/api/llm/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: inputValue,
          sessionContext: {
            sessionTime,
            focusedTime,
            focusRate: sessionTime > 0 ? Math.round((focusedTime / sessionTime) * 100) : 100,
          },
        }),
      })

      let aiResponse = "I'm here to help! Could you be more specific about what you'd like to know?"

      if (response.ok) {
        const data = await response.json()
        aiResponse = data.text || aiResponse
      } else {
        // Fallback responses for common study questions
        const question = inputValue.toLowerCase()
        if (question.includes("focus") || question.includes("concentrate")) {
          aiResponse =
            "Try the Pomodoro technique: 25 minutes focused work, 5 minute break. Also, eliminate distractions and set clear goals for each session."
        } else if (question.includes("motivation") || question.includes("tired")) {
          aiResponse =
            "Remember your goals! Take a 2-minute walk, drink water, or do some deep breathing. Small breaks can recharge your focus."
        } else if (question.includes("study") || question.includes("learn")) {
          aiResponse =
            "Active learning works best: summarize concepts in your own words, teach someone else, or create mind maps. What subject are you working on?"
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "Sorry, I'm having trouble connecting right now. This could be due to network issues or the AI service being temporarily unavailable. Try asking again in a moment!",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="h-full flex flex-col bg-sidebar">
      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-lg p-3 text-sm ${
                  message.type === "user"
                    ? "bg-primary text-primary-foreground"
                    : message.type === "roast"
                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                      : "bg-card text-card-foreground border border-border/50"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-card text-card-foreground border border-border/50 rounded-lg p-3 text-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            disabled={isLoading}
            className="flex-1 bg-background border-border"
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !inputValue.trim()}
            size="icon"
            className="bg-primary hover:bg-primary/90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
