import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { question, sessionContext, pdfContext } = await request.json()

    // Call Cerebras API
    console.log("Calling Cerebras API...")
    const cerebrasResponse = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer csk-96hc22m8fvpx4w8k55drne86r5pvm4wcpce9thhenecpy339`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `You are a professional study assistant and academic coach. The user is currently in a ${Math.floor(sessionContext.sessionTime / 60)} minute study session with ${sessionContext.focusRate}% focus rate. 

${pdfContext ? `The user is studying from a PDF document titled "${pdfContext.filename}". Here is the content of their study material:

"${pdfContext.text}"

Use this content to provide contextually relevant help and answer questions about the material they're studying.` : ''}

Your role is to:
- Provide clear, actionable study advice
- Help with academic questions and concepts about their study material
- Offer motivation and focus techniques
- Suggest effective learning strategies
- Answer questions about study methods, time management, and productivity
- Help explain concepts from their PDF content when relevant

Guidelines:
- Be professional and encouraging
- Keep responses concise (2-3 sentences max)
- Focus on practical, actionable advice
- Reference specific content from their PDF when relevant
- Avoid emojis, casual language, or excessive enthusiasm
- Use a supportive but academic tone
- If asked about focus issues, provide specific techniques like Pomodoro, active recall, or spaced repetition`
          },
          {
            role: "user",
            content: question
          }
        ],
        model: "llama-4-scout-17b-16e-instruct",
        max_completion_tokens: 200,
        temperature: 0.7,
        top_p: 0.8,
        stream: false
      }),
    })

    console.log("Cerebras API response status:", cerebrasResponse.status)
    
    if (!cerebrasResponse.ok) {
      const errorText = await cerebrasResponse.text()
      console.error("Cerebras API error:", cerebrasResponse.status, errorText)
      throw new Error(`Cerebras API error: ${cerebrasResponse.status} - ${errorText}`)
    }

    const data = await cerebrasResponse.json()
    console.log("Cerebras API response data:", data)
    const aiResponse = data.choices?.[0]?.message?.content || generateContextualResponse(question, sessionContext)

    return NextResponse.json({ text: aiResponse })
  } catch (error) {
    console.error("Error in LLM answer API:", error)
    // Fallback to contextual responses if API fails
    const { question, sessionContext } = await request.json()
    const fallbackResponse = generateContextualResponse(question, sessionContext)
    return NextResponse.json({ text: fallbackResponse })
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
