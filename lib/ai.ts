import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export const SUPPORTED_IMAGE_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

export type ImageMediaType = (typeof SUPPORTED_IMAGE_MEDIA_TYPES)[number];

export type AskJsonImage = {
  /** Base64 payload without the `data:` prefix. */
  base64: string;
  mediaType: ImageMediaType;
};

export type AskJsonInput = {
  /** The user-facing instruction. Should describe the JSON shape you expect. */
  prompt: string;
  /** Optional system prompt. A JSON-only instruction is always appended. */
  system?: string;
  /** Zero or more images sent together in one request, in order. */
  images?: AskJsonImage[];
  maxTokens?: number;
};

const JSON_ONLY_INSTRUCTION =
  "Respond with a single valid JSON value and nothing else. " +
  "No prose, no explanation, no markdown code fences.";

const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-5";
const DEFAULT_XAI_MODEL = "grok-2-vision-1212";
const DEFAULT_MAX_TOKENS = 4096;

function stripCodeFences(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("```")) return trimmed;

  return trimmed
    .replace(/^```(?:json|JSON)?\s*\n?/, "")
    .replace(/\n?```$/, "")
    .trim();
}

function parseJsonResponse<T>(raw: string): T {
  const cleaned = stripCodeFences(raw);
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Models sometimes wrap the object in a sentence; salvage the outermost
    // brace/bracket pair before giving up.
    const start = cleaned.search(/[{[]/);
    const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
    if (start !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    }
    throw new Error("Model response was not valid JSON.");
  }
}

async function callAnthropic(
  apiKey: string,
  input: AskJsonInput,
  system: string,
): Promise<string> {
  const client = new Anthropic({ apiKey });

  const content: Anthropic.ContentBlockParam[] = [];
  for (const image of input.images ?? []) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: image.mediaType,
        data: image.base64,
      },
    });
  }
  content.push({ type: "text", text: input.prompt });

  const message = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? DEFAULT_ANTHROPIC_MODEL,
    max_tokens: input.maxTokens ?? DEFAULT_MAX_TOKENS,
    system,
    messages: [{ role: "user", content }],
  });

  return message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}

async function callXai(
  apiKey: string,
  input: AskJsonInput,
  system: string,
): Promise<string> {
  const client = new OpenAI({ apiKey, baseURL: "https://api.x.ai/v1" });

  const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];
  for (const image of input.images ?? []) {
    content.push({
      type: "image_url",
      image_url: {
        url: `data:${image.mediaType};base64,${image.base64}`,
      },
    });
  }
  content.push({ type: "text", text: input.prompt });

  const completion = await client.chat.completions.create({
    model: process.env.XAI_MODEL ?? DEFAULT_XAI_MODEL,
    max_tokens: input.maxTokens ?? DEFAULT_MAX_TOKENS,
    messages: [
      { role: "system", content: system },
      { role: "user", content },
    ],
  });

  return completion.choices[0]?.message?.content ?? "";
}

/**
 * Sends text (and optionally one image) to a vision-capable model and returns
 * the parsed JSON response.
 *
 * Uses Anthropic when `ANTHROPIC_API_KEY` is set, otherwise xAI through the
 * OpenAI-compatible endpoint. Retries once when the first answer does not parse.
 */
export async function askForJson<T = unknown>(input: AskJsonInput): Promise<T> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const xaiKey = process.env.XAI_API_KEY;

  if (!anthropicKey && !xaiKey) {
    throw new Error(
      "No AI provider configured. Set ANTHROPIC_API_KEY or XAI_API_KEY in .env.local.",
    );
  }

  const system = input.system
    ? `${input.system}\n\n${JSON_ONLY_INSTRUCTION}`
    : JSON_ONLY_INSTRUCTION;

  const send = (attempt: AskJsonInput) =>
    anthropicKey
      ? callAnthropic(anthropicKey, attempt, system)
      : callXai(xaiKey as string, attempt, system);

  const first = await send(input);
  try {
    return parseJsonResponse<T>(first);
  } catch {
    const retry = await send({
      ...input,
      prompt: `${input.prompt}\n\nYour previous answer was not parseable as JSON. ${JSON_ONLY_INSTRUCTION}`,
    });
    return parseJsonResponse<T>(retry);
  }
}
