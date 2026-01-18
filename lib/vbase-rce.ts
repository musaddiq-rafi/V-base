/**
 * VBase RCE (Remote Code Execution) API client
 * Custom-built RCE engine compatible with Piston API v2 format
 */

// Available languages and versions for VBase RCE
export const VBASE_LANGUAGE_VERSIONS: Record<string, string> = {
  javascript: "20.0.0",
  python: "3.12.0",
  java: "21.0.0",
  c: "13.2.0",
  cpp: "13.2.0",
};

export const VBASE_RUNTIME_ALIASES: Record<string, string> = {
  javascript: "javascript",
  python: "python",
  java: "java",
  c: "c",
  cpp: "c++",
};

export interface VBaseExecutionResult {
  language: string;
  version: string;
  run: {
    stdout: string;
    stderr: string;
    output: string;
    code: number | null;
    signal: string | null;
  };
  compile?: {
    stdout: string;
    stderr: string;
    output: string;
    code: number | null;
    signal: string | null;
  };
  message?: string; // For API errors
}

export interface VBaseRuntime {
  language: string;
  version: string;
  aliases: string[];
  runtime: string | null;
}

const VBASE_RCE_BASE_URL = process.env.NEXT_PUBLIC_VBASE_RCE_BASE_URL || "";
const VBASE_RCE_API_SECRET = process.env.NEXT_PUBLIC_VBASE_RCE_API_SECRET || "";

/**
 * Get list of available runtimes from VBase RCE
 */
export async function getVBaseRuntimes(): Promise<VBaseRuntime[]> {
  const response = await fetch(`${VBASE_RCE_BASE_URL}api/v2/runtimes`, {
    method: "GET",
    headers: {
      "X-API-Key": VBASE_RCE_API_SECRET,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.message || `Failed to fetch runtimes: ${response.status}`,
    );
  }

  return response.json();
}

/**
 * Execute code using VBase RCE API
 * Request/response format is compatible with Piston API v2
 */
export async function executeCodeVBase(
  language: string,
  code: string,
  stdin?: string,
): Promise<VBaseExecutionResult> {
  const runtime = VBASE_RUNTIME_ALIASES[language];
  const version = VBASE_LANGUAGE_VERSIONS[language];

  if (!runtime || !version) {
    throw new Error(`Unsupported language for VBase RCE: ${language}`);
  }

  const response = await fetch(`${VBASE_RCE_BASE_URL}api/v2/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": VBASE_RCE_API_SECRET,
    },
    body: JSON.stringify({
      language: runtime,
      version: version,
      files: [
        {
          content: code,
        },
      ],
      stdin: stdin || "",
      args: [],
      run_timeout: 10000,
      compile_timeout: 10000,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.detail?.message ||
        error.message ||
        `Execution failed: ${response.status}`,
    );
  }

  const data = await response.json();
  return data;
}

/**
 * Check if a language is supported by VBase RCE
 */
export function isLanguageSupportedByVBase(language: string): boolean {
  return language in VBASE_LANGUAGE_VERSIONS;
}
