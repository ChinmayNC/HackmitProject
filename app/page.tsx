"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { StudyBuddy } from "@/components/study-buddy"
import { PdfViewer } from "@/components/pdf-viewer"
import { Timer } from "@/components/timer"
import { SessionSetupModal } from "@/components/session-setup-modal"
import { SessionGuardModal } from "@/components/session-guard-modal"
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
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [showGuardModal, setShowGuardModal] = useState(false)
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [lastViolationTime, setLastViolationTime] = useState(0)

  // Timer functionality
  const updateTime = (newSessionTime: number, newFocusedTime: number) => {
    setSessionTime(newSessionTime)
    setFocusedTime(newFocusedTime)
  }

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

  // Track visibility and fullscreen changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      const newIsVisible = !document.hidden
      setIsVisible(newIsVisible)

      // Track violations when losing focus during active session
      if (isSessionActive && !newIsVisible) {
        const now = Date.now()
        if (now - lastViolationTime > 5000) {
          // Only count if 5+ seconds since last violation
          setViolations((prev) => prev + 1)
          setLastViolationTime(now)
        }
      }
    }

    const handleFullscreenChange = () => {
      const newIsFullscreen = !!document.fullscreenElement
      setIsFullscreen(newIsFullscreen)

      // Track violations when exiting fullscreen during active session
      if (isSessionActive && !newIsFullscreen && isVisible) {
        const now = Date.now()
        if (now - lastViolationTime > 5000) {
          setViolations((prev) => prev + 1)
          setLastViolationTime(now)
        }
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
            <div className="flex items-center justify-between px-6 py-4">
              <h1 className="text-2xl font-medium text-foreground">Lock-In</h1>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Locked in for:</div>
                  <div className="text-2xl font-medium text-foreground">
                    {Math.floor(sessionTime / 3600)
                      .toString()
                      .padStart(2, "0")}
                    :
                    {Math.floor((sessionTime % 3600) / 60)
                      .toString()
                      .padStart(2, "0")}
                    :{(sessionTime % 60).toString().padStart(2, "0")}
                  </div>
                </div>
                <Button
                  onClick={requestEndSession}
                  variant="outline"
                  className="border-border hover:bg-secondary bg-transparent"
                >
                  End Session
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex">
            {/* PDF Viewer Section (Left) */}
            <div className="flex-1 border-r border-border/50">
              <div className="h-full flex flex-col">
                <div className="border-b border-border/50 bg-card px-6 py-3">
                  <h2 className="text-lg font-medium text-foreground">PDF Viewer</h2>
                </div>
                <div className="flex-1">
                  <PdfViewer />
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-96 bg-sidebar flex flex-col">
              {/* Timer Section */}
              <div className="border-b border-sidebar-border bg-sidebar px-6 py-3">
                <h2 className="text-lg font-medium text-sidebar-foreground">Session Timer</h2>
              </div>
              <div className="p-4">
                <Timer
                  sessionTime={sessionTime}
                  focusedTime={focusedTime}
                  isActive={isSessionActive}
                  isVisible={isVisible}
                  isFullscreen={isFullscreen}
                  onEnd={requestEndSession}
                  onTimeUpdate={updateTime}
                />
              </div>

              {/* Study Buddy Section */}
              <div className="border-t border-sidebar-border bg-sidebar px-6 py-3">
                <h2 className="text-lg font-medium text-sidebar-foreground">Study Buddy</h2>
              </div>
              <div className="flex-1">
                <StudyBuddy
                  isVisible={isVisible}
                  isFullscreen={isFullscreen}
                  sessionTime={sessionTime}
                  focusedTime={focusedTime}
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
        />
      )}
    </div>
  )
}
