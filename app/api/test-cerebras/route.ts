import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("Testing Cerebras API...")
    
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
            content: "You are a helpful assistant. Respond briefly and professionally."
          },
          {
            role: "user",
            content: "Hello, can you help me study?"
          }
        ],
        model: "llama-4-scout-17b-16e-instruct",
        max_completion_tokens: 100,
        temperature: 0.7,
        stream: false
      }),
    })

    console.log("Cerebras API response status:", cerebrasResponse.status)
    
    if (!cerebrasResponse.ok) {
      const errorText = await cerebrasResponse.text()
      console.error("Cerebras API error:", cerebrasResponse.status, errorText)
      return NextResponse.json({ 
        error: `API Error: ${cerebrasResponse.status}`, 
        details: errorText,
        status: cerebrasResponse.status 
      })
    }

    const data = await cerebrasResponse.json()
    console.log("Cerebras API response data:", data)
    
    return NextResponse.json({ 
      success: true, 
      response: data.choices?.[0]?.message?.content || "No content",
      fullResponse: data
    })
  } catch (error) {
    console.error("Error testing Cerebras API:", error)
    return NextResponse.json({ 
      error: "Failed to test API", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
