import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { term, context } = await request.json()

    // For now, return intelligent fallback definitions
    // In production, this would call Cerebras LLM API
    const definition = generateDefinition(term, context)

    return NextResponse.json({
      summary: definition.summary,
      bullets: definition.bullets,
    })
  } catch (error) {
    console.error("Error in LLM define API:", error)
    return NextResponse.json({ error: "Failed to generate definition" }, { status: 500 })
  }
}

function generateDefinition(term: string, context: string) {
  const t = term.toLowerCase().trim()

  // Academic and scientific terms
  const definitions: Record<string, { summary: string; bullets: string[] }> = {
    photosynthesis: {
      summary:
        "The process by which plants convert light energy into chemical energy (glucose) using carbon dioxide and water.",
      bullets: [
        "Occurs in chloroplasts of plant cells",
        "Requires sunlight, CO2, and water",
        "Produces glucose and oxygen as byproducts",
        "Essential for most life on Earth",
      ],
    },
    mitochondria: {
      summary: "The powerhouse of the cell - organelles that produce ATP energy through cellular respiration.",
      bullets: [
        "Found in most eukaryotic cells",
        "Contains its own DNA",
        "Site of aerobic respiration",
        "Critical for cellular energy production",
      ],
    },
    algorithm: {
      summary: "A step-by-step procedure or set of rules designed to solve a problem or complete a task.",
      bullets: [
        "Must be finite and well-defined",
        "Takes input and produces output",
        "Used extensively in computer science",
        "Can be expressed in pseudocode or programming languages",
      ],
    },
    democracy: {
      summary:
        "A system of government where power is held by the people, either directly or through elected representatives.",
      bullets: [
        "Based on majority rule with minority rights",
        "Includes free and fair elections",
        "Emphasizes individual freedoms and rights",
        "Requires active citizen participation",
      ],
    },
    entropy: {
      summary: "A measure of disorder or randomness in a system, fundamental to thermodynamics and information theory.",
      bullets: [
        "Always increases in isolated systems",
        "Related to the second law of thermodynamics",
        "Measures energy unavailable for work",
        "Used in physics, chemistry, and information science",
      ],
    },
  }

  // Check for exact matches first
  if (definitions[t]) {
    return definitions[t]
  }

  // Check for partial matches
  for (const [key, value] of Object.entries(definitions)) {
    if (t.includes(key) || key.includes(t)) {
      return value
    }
  }

  // Generate contextual definition based on common academic patterns
  if (t.length < 3) {
    return {
      summary: `"${term}" - Term too short for meaningful definition.`,
      bullets: ["Try selecting a longer phrase or complete word"],
    }
  }

  // Math/Science terms
  if (context.includes("math") || context.includes("science") || /^[a-z]+tion$/.test(t)) {
    return {
      summary: `"${term}" appears to be a technical or scientific term. This concept likely relates to ${context}.`,
      bullets: [
        "Consider checking your textbook glossary",
        "Look for related terms in the same chapter",
        "Try breaking down the word into root parts",
        "Ask your instructor for clarification",
      ],
    }
  }

  // General academic term
  return {
    summary: `"${term}" - This term appears in your study material and may be important for understanding the topic.`,
    bullets: [
      "Look for context clues in surrounding text",
      "Check if it's defined elsewhere in the document",
      "Consider how it relates to the main topic",
      "Make a note to research this term further",
    ],
  }
}
