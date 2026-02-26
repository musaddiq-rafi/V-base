import { NextRequest, NextResponse } from "next/server";

/**
 * Build a system prompt tailored for a single-file code editor
 * with limited language support (Python, JavaScript, Java, C++, C).
 */
function buildSystemPrompt(language: string, mode: "ask" | "agent") {
  const langLabel =
    {
      python: "Python",
      javascript: "JavaScript",
      java: "Java",
      cpp: "C++",
      c: "C",
    }[language] || language;

  const baseContext = `You are an AI coding assistant inside VBase, a collaborative online code editor.
The user is working in a SINGLE-FILE editor — there is no project structure, no imports from local modules, no file system, and no package manager.
The currently selected language is ${langLabel}.

Supported languages: Python, JavaScript, Java, C++, C.
There is NO TypeScript support.

Constraints you MUST follow:
- All code must be self-contained in a single file.
- Do not reference external files, modules, or packages that need installation.
- For Java, the public class must be named "Main" (entry point: public static void main).
- Standard library imports are fine (e.g. java.util.*, stdio.h, iostream, etc.).
- Keep code concise and readable.
- If the user's prompt doesn't specify a language, write code in ${langLabel}.`;

  if (mode === "agent") {
    return `${baseContext}

MODE: Agent — You are generating code to be placed directly into the editor.
STRICT RULES:
- Return ONLY the raw source code. No markdown fences, no explanations, no comments like "here is the code".
- Do NOT wrap output in \`\`\`code blocks\`\`\`.
- The output must be valid, runnable ${langLabel} code ready to execute.
- If the user asks to modify or fix code, return the COMPLETE updated file (not a diff or partial snippet).
- If the prompt is ambiguous, make reasonable assumptions and produce working code.`;
  }

  // "ask" mode
  return `${baseContext}

MODE: Ask — You are answering the user's question in a chat interface.
RULES:
- Provide clear, concise explanations.
- When including code snippets, use markdown code fences with the language identifier.
- You can reference the user's current code if they share it.
- Keep answers focused and practical.
- If the user asks you to write code, provide it inside markdown code blocks.`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not set in environment variables." },
      { status: 500 },
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { prompt, language, mode, currentCode } = body as {
    prompt?: string;
    language?: string;
    mode?: "ask" | "agent";
    currentCode?: string;
  };

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }

  const lang = language || "python";
  const chatMode = mode === "agent" ? "agent" : "ask";
  const systemPrompt = buildSystemPrompt(lang, chatMode);

  // Build user message with optional current code context
  let userMessage = prompt;
  if (currentCode && currentCode.trim()) {
    userMessage = `Current code in the editor:\n\`\`\`${lang}\n${currentCode}\n\`\`\`\n\nUser request: ${prompt}`;
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
            temperature: chatMode === "agent" ? 0.2 : 0.5,
            maxOutputTokens: 8192,
          },
        }),
      },
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("[generate-code] Gemini API error:", err);
      return NextResponse.json(
        { error: "Gemini API request failed", details: err },
        { status: 502 },
      );
    }

    const data = await response.json();
    const rawText: string =
      data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!rawText) {
      return NextResponse.json(
        { error: "Empty response from Gemini" },
        { status: 502 },
      );
    }

    // For agent mode, strip any accidental markdown fences
    let result = rawText;
    if (chatMode === "agent") {
      result = result
        .replace(/^```[\w]*\s*\n?/i, "")
        .replace(/\n?```\s*$/i, "")
        .trim();
    }

    return NextResponse.json({ result, mode: chatMode });
  } catch (err) {
    console.error("[generate-code] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
