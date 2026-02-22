import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a diagram generator. The user will describe a concept, process, or system.
Your job is to return ONLY a valid JSON object (no markdown, no explanation, no code blocks) representing a flowchart or diagram.

STRICT OUTPUT FORMAT:
{
  "title": "Short title for the diagram",
  "nodes": [
    { "id": "1", "label": "Start", "shape": "ellipse" },
    { "id": "2", "label": "Process Step", "shape": "rectangle" },
    { "id": "3", "label": "Decision?", "shape": "diamond" },
    { "id": "4", "label": "End", "shape": "ellipse" }
  ],
  "edges": [
    { "from": "1", "to": "2", "label": "" },
    { "from": "2", "to": "3", "label": "check" },
    { "from": "3", "to": "4", "label": "yes" }
  ]
}

STRICT RULES:
- "shape" must be EXACTLY one of: "rectangle", "diamond", "ellipse"
- "ellipse" = start/end terminal nodes only
- "diamond" = decision/condition nodes only
- "rectangle" = process/action nodes
- Maximum 14 nodes total
- Every "from" and "to" in edges MUST match an existing node "id"
- "label" on edges can be empty string ""
- Make it a logical, clean flow
- Return ONLY the raw JSON object. No markdown fences, no text before or after.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not set in environment variables." },
      { status: 500 }
    );
  }

  const { prompt } = await req.json();
  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${SYSTEM_PROMPT}\n\nUser request: ${prompt}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("[generate-diagram] Gemini API error:", err);
      return NextResponse.json({ error: "Gemini API request failed", details: err }, { status: 502 });
    }

    const data = await response.json();
    const rawText: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!rawText) {
      return NextResponse.json({ error: "Empty response from Gemini" }, { status: 502 });
    }

    // Strip any accidental markdown fences
    const cleaned = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let diagram: unknown;
    try {
      diagram = JSON.parse(cleaned);
    } catch {
      console.error("[generate-diagram] Failed to parse Gemini output:", cleaned);
      return NextResponse.json({ error: "Gemini returned invalid JSON", raw: cleaned }, { status: 502 });
    }

    return NextResponse.json(diagram);
  } catch (err) {
    console.error("[generate-diagram] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
