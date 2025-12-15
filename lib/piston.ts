// Map your frontend language selection to Piston API's expected format
// You can check available runtimes at: https://emkc.org/api/v2/piston/runtimes
export const LANGUAGE_VERSIONS: Record<string, string> = {
  javascript: "18.15.0",
  typescript: "5.0.3",
  python: "3.10.0",
  java: "15.0.2",
  c: "10.2.0",
  cpp: "10.2.0",
};

export const RUNTIME_ALIASES: Record<string, string> = {
  javascript: "javascript", // or 'node'
  typescript: "typescript",
  python: "python",
  java: "java",
  c: "gcc",
  cpp: "g++",
};

export interface ExecutionResult {
  run: {
    stdout: string;
    stderr: string;
    output: string;
    code: number;
    signal: string | null;
  };
  message?: string; // For API errors
}

export async function executeCode(
  language: string,
  code: string
): Promise<ExecutionResult> {
  const runtime = RUNTIME_ALIASES[language];
  const version = LANGUAGE_VERSIONS[language];

  if (!runtime || !version) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const response = await fetch("https://emkc.org/api/v2/piston/execute", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      language: runtime,
      version: version,
      files: [
        {
          content: code,
        },
      ],
    }),
  });

  const data = await response.json();
  return data;
}
