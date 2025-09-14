"use client"

import { useEffect, useRef } from "react"

interface WakeLockManagerProps {
  isActive: boolean
  isVisible: boolean
}

export function WakeLockManager({ isActive, isVisible }: WakeLockManagerProps) {
  const wakeLockRef = useRef<WakeLock | null>(null)

  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator && isActive && isVisible) {
          wakeLockRef.current = await navigator.wakeLock.request("screen")
          console.log("[v0] Wake lock activated")
        }
      } catch (error) {
        console.log("[v0] Wake lock failed:", error)
      }
    }

    const releaseWakeLock = async () => {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release()
        wakeLockRef.current = null
        console.log("[v0] Wake lock released")
      }
    }

    if (isActive && isVisible) {
      requestWakeLock()
    } else {
      releaseWakeLock()
    }

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        releaseWakeLock()
      } else if (isActive) {
        requestWakeLock()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      releaseWakeLock()
    }
  }, [isActive, isVisible])

  return null
}
