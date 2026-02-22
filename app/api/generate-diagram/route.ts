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

  // TODO: call Gemini API using SYSTEM_PROMPT and return diagram JSON
  return NextResponse.json({ message: "Not implemented yet" }, { status: 501 });
}
