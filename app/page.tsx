"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { StudyBuddy } from "@/components/study-buddy"
import { PdfViewer } from "@/components/pdf-viewer"
import { Timer } from "@/components/timer"
import { SessionSetupModal } from "@/components/session-setup-modal"
import { SessionGuardModal } from "@/components/session-guard-modal"
import { FocusLossModal } from "@/components/focus-loss-modal"
import { PWAInstallButton } from "@/components/pwa-install-button"
import { WakeLockManager } from "@/components/wake-lock-manager"
import { ShortcutsIntegration } from "@/components/shortcuts-integration"

interface SessionGoal {
  id: string
  text: string
  completed: boolean
}

interface SessionData {
  goal: string
  duration: number
  checklist: SessionGoal[]
  startTime: Date
}

export default function LockInApp() {
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [sessionTime, setSessionTime] = useState(0)
  const [focusedTime, setFocusedTime] = useState(0)
  const [violations, setViolations] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showFocusLossModal, setShowFocusLossModal] = useState(false)
  const [showFullscreenModal, setShowFullscreenModal] = useState(false)
  const [isFocused, setIsFocused] = useState(true) // Track if user is actually focused
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [showGuardModal, setShowGuardModal] = useState(false)
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [lastViolationTime, setLastViolationTime] = useState(0)
  const [pdfContext, setPdfContext] = useState<{ text: string; filename: string } | null>(null)
  const [isPaused, setIsPaused] = useState(false)

  // Handle PDF text extraction
  const handlePdfTextExtracted = (text: string, filename: string) => {
    setPdfContext({ text, filename })
  }

  // Handle pause/resume
  const handlePauseResume = () => {
    if (isPaused) {
      // Resume - set as focused
      setIsPaused(false)
      setIsFocused(true)
    } else {
      // Pause - set as unfocused
      setIsPaused(true)
      setIsFocused(false)
    }
  }

  // Timer functionality
  const updateTime = (newSessionTime: number, newFocusedTime: number) => {
    setSessionTime(newSessionTime)
    setFocusedTime(newFocusedTime)
  }

  // Update focused time based on focus status
  useEffect(() => {
    if (!isSessionActive || isPaused) return

    const interval = setInterval(() => {
      setSessionTime(prev => prev + 1)
      // Only increment focused time if actually focused
      if (isFocused) {
        setFocusedTime(prev => prev + 1)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isSessionActive, isFocused, isPaused])

  // Handle URL parameters for quick sessions
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const quickSession = urlParams.get("quick")

    if (quickSession && !isSessionActive) {
      const duration = Number.parseInt(quickSession) || 25
      startSession({
        goal: `Quick ${duration}-minute focus session`,
        duration,
        checklist: [],
      })
    }
  }, [isSessionActive])

  // Track visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      const newIsVisible = !document.hidden
      setIsVisible(newIsVisible)

      // Show roast modal when losing focus during active session
      if (isSessionActive && !newIsVisible) {
        const now = Date.now()
        if (now - lastViolationTime > 2000) { // Reduced to 2 seconds
          setViolations((prev) => prev + 1)
          setLastViolationTime(now)
          setIsFocused(false) // Set to unfocused
          setShowFocusLossModal(true)
        }
      }
    }

    const handleFullscreenChange = () => {
      const newIsFullscreen = !!document.fullscreenElement
      setIsFullscreen(newIsFullscreen)
      
      // Show fullscreen modal if user exits fullscreen during active session
      if (isSessionActive && !newIsFullscreen && isVisible) {
        setShowFullscreenModal(true)
      }
    }

    // Handle beforeunload warning
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSessionActive) {
        e.preventDefault()
        e.returnValue = "You have an active focus session. Are you sure you want to leave?"
        return "You have an active focus session. Are you sure you want to leave?"
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [isSessionActive, isVisible, lastViolationTime])

  const startSession = async (data: { goal: string; duration: number; checklist: SessionGoal[] }) => {
    try {
      // Request fullscreen
      await document.documentElement.requestFullscreen()
    } catch (error) {
      console.log("Fullscreen not supported or denied")
    }

    setSessionData({
      ...data,
      startTime: new Date(),
    })
    setIsSessionActive(true)
    setSessionTime(0)
    setFocusedTime(0)
    setViolations(0)
    setShowSetupModal(false)
  }

  const requestEndSession = () => {
    setShowGuardModal(true)
  }

  const approveEndSession = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    }
    setIsSessionActive(false)
    setShowGuardModal(false)
    setSessionData(null)
  }

  const denyEndSession = (feedback: string) => {
    setShowGuardModal(false)
    // Could show feedback to user here
    console.log("Session end denied:", feedback)
  }

  const lockBackIn = async () => {
    try {
      // Request fullscreen
      await document.documentElement.requestFullscreen()
      setIsFocused(true) // Set back to focused
      setShowFocusLossModal(false)
    } catch (error) {
      console.log("Fullscreen not supported or denied")
      setIsFocused(true) // Set back to focused even if fullscreen fails
      setShowFocusLossModal(false)
    }
  }

  const returnToFullscreen = async () => {
    try {
      // Request fullscreen
      await document.documentElement.requestFullscreen()
      setShowFullscreenModal(false)
    } catch (error) {
      console.log("Fullscreen not supported or denied")
      setShowFullscreenModal(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* PWA Install Banner */}
      <PWAInstallButton />

      {/* Wake Lock Manager */}
      <WakeLockManager isActive={isSessionActive} isVisible={isVisible} />

      {!isSessionActive ? (
        // Welcome Screen
        <div className="flex items-center justify-center min-h-screen p-6">
          <Card className="p-12 text-center max-w-lg border-border/50 shadow-sm">
            <h1 className="text-5xl font-medium mb-8 text-balance text-foreground">Welcome to Lock-In</h1>
            <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
              Enter a distraction-free focus session with AI-powered study tools
            </p>
            <div className="space-y-6">
              <Button
                onClick={() => setShowSetupModal(true)}
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-4 text-lg"
              >
                Start Session
              </Button>
              <div className="flex justify-center">
                <ShortcutsIntegration />
              </div>
            </div>
          </Card>
        </div>
      ) : (
        // Active Session Interface
        <div className="h-screen flex flex-col">
          {/* Top Header Section */}
          <div className="border-b border-border/50 bg-card">
            <div className="flex items-center justify-center px-6 py-6">
              <h1 className="text-4xl font-medium text-foreground flex items-center gap-2">
                🌱 Lock-In
              </h1>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex min-h-0">
            {/* PDF Viewer Section (Left) */}
            <div className="flex-1 border-r border-border/50 min-h-0">
              <div className="h-full flex flex-col min-h-0">
                <div className="border-b border-border/50 bg-card px-6 py-3">
                </div>
                <div className="flex-1 pl-1">
                  <PdfViewer onPdfTextExtracted={handlePdfTextExtracted} />
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-96 bg-sidebar flex flex-col min-h-0">
              {/* Timer Section */}
              <div className="px-4 pt-4">
                <Timer
                  sessionTime={sessionTime}
                  focusedTime={focusedTime}
                  isActive={isSessionActive}
                  isVisible={isFocused} // Use focus status instead of visibility
                  isFullscreen={isFocused} // Use focus status instead of fullscreen
                  isPaused={isPaused}
                  onEnd={requestEndSession}
                  onPauseResume={handlePauseResume}
                  onTimeUpdate={() => {}} // No longer needed
                />
              </div>

              {/* Study Buddy Section */}
              <div className="flex-1 min-h-0 max-h-[calc(100vh-200px)]">
                <StudyBuddy
                  isVisible={isFocused}
                  isFullscreen={isFocused}
                  sessionTime={sessionTime}
                  focusedTime={focusedTime}
                  pdfContext={pdfContext}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session Setup Modal */}
      <SessionSetupModal isOpen={showSetupModal} onClose={() => setShowSetupModal(false)} onStart={startSession} />

      {/* Session Guard Modal */}
      {sessionData && (
        <SessionGuardModal
          isOpen={showGuardModal}
          stats={{
            goal: sessionData.goal,
            targetDuration: sessionData.duration,
            sessionTime,
            focusedTime,
            violations,
            checklist: sessionData.checklist,
          }}
          onApprove={approveEndSession}
          onDeny={denyEndSession}
          onClose={() => setShowGuardModal(false)}
        />
      )}

      {/* Focus Loss Modal */}
      {showFocusLossModal && (
        <FocusLossModal 
          isOpen={showFocusLossModal}
          onLockBackIn={lockBackIn}
          onStayDistracted={() => setShowFocusLossModal(false)}
          sessionTime={sessionTime}
          focusedTime={focusedTime}
          violations={violations}
        />
      )}

      {/* Fullscreen Modal */}
      {showFullscreenModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-8 max-w-md mx-4 text-center">
            <div className="text-6xl mb-4">🖥️</div>
            <h2 className="text-2xl font-bold mb-4">Not in Fullscreen</h2>
            <p className="text-muted-foreground mb-6">
              You've exited fullscreen mode. For the best focus experience, please return to fullscreen to continue your session.
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={returnToFullscreen}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Return to Fullscreen
              </Button>
              <Button 
                onClick={() => setShowFullscreenModal(false)}
                variant="outline"
                className="flex-1"
              >
                Continue in Window
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
