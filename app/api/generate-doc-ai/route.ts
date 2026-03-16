import { NextRequest, NextResponse } from "next/server";

type DocAiAction =
  | "summarize"
  | "elaborate"
  | "generate"
  | "fix-grammar"
  | "change-tone";

type ToneOption = "professional" | "casual" | "formal" | "friendly";

function buildSystemPrompt(action: DocAiAction, tone?: ToneOption): string {
  const base = `You are an AI writing assistant inside VBase, a collaborative document editor.
You help users improve and generate text for their documents.

STRICT RULES:
- Return ONLY the resulting text. No markdown fences, no explanations, no preamble like "Here is the result:".
- Do NOT wrap output in \`\`\`code blocks\`\`\` or use markdown headers.
- Output plain text paragraphs only. Preserve any natural paragraph breaks.
- Do NOT include any meta-commentary about what you did.`;

  switch (action) {
    case "summarize":
      return `${base}

TASK: Summarize the user's selected text.
- Condense the text to its key points.
- Keep the summary clear and concise — roughly 1/3 the original length.
- Preserve the original meaning and important details.
- Maintain the same language/tone as the original.`;

    case "elaborate":
      return `${base}

TASK: Elaborate on the user's selected text.
- Expand the text with more detail, examples, or explanations.
- Roughly double the length of the original.
- Keep the same tone and style as the original.
- Add meaningful content, not filler words.`;

    case "generate":
      return `${base}

TASK: Generate new content based on the user's prompt.
- Write clear, well-structured text.
- Use a neutral, professional tone unless specified otherwise.
- Keep the output focused and relevant to the prompt.
- Aim for 2-4 paragraphs unless the prompt specifies otherwise.`;

    case "fix-grammar":
      return `${base}

TASK: Fix grammar, spelling, and punctuation in the user's selected text.
- Correct all grammatical errors, typos, and punctuation issues.
- Improve sentence structure where needed.
- Preserve the original meaning and tone.
- Do NOT change the content or style, only fix errors.`;

    case "change-tone":
      return `${base}

TASK: Rewrite the user's selected text in a ${tone || "professional"} tone.
- Transform the writing style to be ${tone || "professional"}.
- Preserve the original meaning and key information.
- Adjust vocabulary and sentence structure to match the desired tone.
${tone === "casual" ? "- Use conversational language, contractions, and a relaxed style." : ""}
${tone === "formal" ? "- Use sophisticated vocabulary, complete sentences, and an authoritative style." : ""}
${tone === "friendly" ? "- Use warm, approachable language with an encouraging style." : ""}
${tone === "professional" ? "- Use clear, polished language suitable for business communication." : ""}`;

    default:
      return base;
  }
}

function getTemperature(action: DocAiAction): number {
  switch (action) {
    case "fix-grammar":
      return 0.3;
    case "summarize":
    case "change-tone":
      return 0.4;
    case "elaborate":
    case "generate":
      return 0.6;
    default:
      return 0.4;
  }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not set in environment variables." },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { action, selectedText, customPrompt, tone } = body as {
    action?: DocAiAction;
    selectedText?: string;
    customPrompt?: string;
    tone?: ToneOption;
  };

  if (!action) {
    return NextResponse.json({ error: "Missing action" }, { status: 400 });
  }

  // For generate action, customPrompt is required. For others, selectedText is required.
  if (action === "generate") {
    if (!customPrompt || typeof customPrompt !== "string") {
      return NextResponse.json(
        { error: "Missing customPrompt for generate action" },
        { status: 400 }
      );
    }
  } else {
    if (!selectedText || typeof selectedText !== "string") {
      return NextResponse.json(
        { error: "Missing selectedText" },
        { status: 400 }
      );
    }
  }

  const systemPrompt = buildSystemPrompt(action, tone);
  const temperature = getTemperature(action);

  // Build user message
  let userMessage: string;
  if (action === "generate") {
    userMessage = `Generate text based on this prompt:\n\n${customPrompt}`;
  } else {
    // Truncate long selections to ~3000 chars
    const text =
      selectedText!.length > 3000
        ? selectedText!.slice(0, 3000) + "\n\n[Text truncated for processing]"
        : selectedText!;
    userMessage = `Here is the selected text:\n\n${text}`;
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
                  text: `${systemPrompt}\n\n${userMessage}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("[generate-doc-ai] Gemini API error:", err);
      return NextResponse.json(
        { error: "Gemini API request failed", details: err },
        { status: 502 }
      );
    }

    const data = await response.json();
    const rawText: string =
      data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!rawText) {
      return NextResponse.json(
        { error: "Empty response from Gemini" },
        { status: 502 }
      );
    }

    // Strip any accidental markdown fences
    const result = rawText
      .replace(/^```[\w]*\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "")
      .trim();

    return NextResponse.json({ result, action });
  } catch (err) {
    console.error("[generate-doc-ai] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
