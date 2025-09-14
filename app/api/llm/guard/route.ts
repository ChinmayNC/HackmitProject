import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { goalMinutes, elapsedSeconds, violations, reflection, checklistComplete, focusPercentage } =
      await request.json()

    // Evaluate session completion
    const evaluation = evaluateSession({
      goalMinutes,
      elapsedSeconds,
      violations,
      reflection,
      checklistComplete,
      focusPercentage,
    })

    return NextResponse.json(evaluation)
  } catch (error) {
    console.error("Error in LLM guard API:", error)
    return NextResponse.json({ error: "Failed to evaluate session" }, { status: 500 })
  }
}

interface SessionEvaluation {
  goalMinutes: number
  elapsedSeconds: number
  violations: number
  reflection: string
  checklistComplete: boolean
  focusPercentage: number
}

function evaluateSession(data: SessionEvaluation) {
  const { goalMinutes, elapsedSeconds, violations, reflection, checklistComplete, focusPercentage } = data

  const elapsedMinutes = elapsedSeconds / 60
  const timeGoalPercentage = (elapsedMinutes / goalMinutes) * 100
  const reflectionBullets = reflection.split("\n").filter((line) => line.trim().length > 10).length
  const reflectionWords = reflection.trim().split(/\s+/).length

  // Evaluation criteria
  const timeGoalMet = timeGoalPercentage >= 80
  const goodReflection = reflectionBullets >= 3 && reflectionWords >= 30
  const excellentFocus = focusPercentage >= 85
  const decentFocus = focusPercentage >= 60
  const lowViolations = violations <= 3

  // Decision logic
  let allow = false
  let feedback = ""
  let roast = ""

  if (timeGoalMet && decentFocus && lowViolations) {
    allow = true
    feedback = `Excellent! You completed ${Math.round(timeGoalPercentage)}% of your time goal with ${focusPercentage}% focus. Well done!`
  } else if (goodReflection && decentFocus) {
    allow = true
    feedback =
      "Great reflection! You've clearly thought about your learning process. Your detailed insights show real engagement with the material."
  } else if (checklistComplete && excellentFocus) {
    allow = true
    feedback = "Outstanding focus and task completion! You've demonstrated excellent self-discipline and productivity."
  } else {
    // Provide specific feedback on what's missing
    const issues = []

    if (timeGoalPercentage < 50) {
      issues.push(`only ${Math.round(timeGoalPercentage)}% of your time goal`)
    }

    if (focusPercentage < 60) {
      issues.push(`low focus rate (${focusPercentage}%)`)
    }

    if (violations > 5) {
      issues.push(`too many distractions (${violations} violations)`)
    }

    if (reflectionWords < 20) {
      issues.push("insufficient reflection detail")
    }

    if (issues.length > 0) {
      feedback = `Not quite ready to end: ${issues.join(", ")}. `
    }

    if (reflectionBullets < 3) {
      feedback += "Please provide at least 3 detailed points about what you learned or accomplished."
      roast = "Come on, give me more than that! What did you actually learn or struggle with?"
    } else if (timeGoalPercentage < 30) {
      feedback += "You've barely started! Try to reach at least 50% of your time goal."
      roast = "That was quick! Are you sure you gave it your best effort?"
    } else if (focusPercentage < 40) {
      feedback += "Your focus was quite scattered. What kept distracting you?"
      roast = "Looks like your attention was everywhere except your work!"
    } else {
      feedback += "You're close! Just need a bit more effort or reflection."
      roast = "Almost there! Don't give up when you're so close to the finish line."
    }
  }

  return { allow, feedback, roast }
}
