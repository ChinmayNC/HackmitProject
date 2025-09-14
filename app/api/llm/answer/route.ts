import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { question, sessionContext } = await request.json()

    // For now, return intelligent fallback responses
    // In production, this would call Cerebras LLM API
    const responses = generateContextualResponse(question, sessionContext)

    return NextResponse.json({ text: responses })
  } catch (error) {
    console.error("Error in LLM answer API:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}

function generateContextualResponse(question: string, context: any): string {
  const q = question.toLowerCase()
  const focusRate = context.focusRate || 100
  const sessionMinutes = Math.floor(context.sessionTime / 60)

  // Focus and concentration questions
  if (q.includes("focus") || q.includes("concentrate") || q.includes("distracted")) {
    if (focusRate < 70) {
      return "I notice your focus rate is lower today. Try the 2-minute rule: commit to just 2 minutes of focused work. Often, starting is the hardest part, and you'll naturally continue beyond 2 minutes."
    }
    return "Great focus so far! To maintain it, try the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds. This prevents eye strain and mental fatigue."
  }

  // Motivation and energy questions
  if (q.includes("motivation") || q.includes("tired") || q.includes("energy") || q.includes("lazy")) {
    return `You've been working for ${sessionMinutes} minutes - that's already progress! Try a 30-second desk stretch or take 3 deep breaths. Small energy boosts can make a big difference.`
  }

  // Study techniques and learning
  if (q.includes("study") || q.includes("learn") || q.includes("remember") || q.includes("memorize")) {
    return "Try active recall: close your materials and write down everything you remember, then check what you missed. This is more effective than re-reading. What subject are you working on?"
  }

  // Time management
  if (q.includes("time") || q.includes("schedule") || q.includes("plan")) {
    return "Time-blocking works well: assign specific time slots to specific tasks. You're already doing great by using focused sessions! Consider planning your next session's goals now."
  }

  // Stress and anxiety
  if (q.includes("stress") || q.includes("anxious") || q.includes("overwhelmed") || q.includes("pressure")) {
    return "Feeling overwhelmed is normal. Break your work into smaller, specific tasks. Instead of 'study math,' try 'complete 5 algebra problems.' Small wins build momentum and reduce stress."
  }

  // General encouragement based on session performance
  if (focusRate >= 80) {
    return "You're doing excellent work! Your focus rate is strong. Keep up this momentum and remember to take breaks when needed."
  } else if (focusRate >= 60) {
    return "Good progress! If you're getting distracted, try the Pomodoro technique: 25 minutes focused work, 5 minute break. What's your biggest distraction right now?"
  }

  // Default helpful response
  return "I'm here to help with your study session! I can assist with focus techniques, motivation, study strategies, or just provide encouragement. What would be most helpful right now?"
}
