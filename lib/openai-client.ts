import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { z } from "zod";

let client: OpenAI | undefined;

export class ConfigurationError extends Error {}
export class OutputValidationError extends Error {}
export class ResearchError extends Error {}

function getClient() {
  if (!process.env.OPENAI_API_KEY) throw new ConfigurationError("OpenAI is not configured on the server.");
  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

export async function structuredResponse<T extends z.ZodType>(options: {
  schema: T;
  schemaName: string;
  instructions: string;
  input: string;
  webSearch?: boolean;
  validate?: (data: z.infer<T>, sourceUrls: string[]) => void;
}): Promise<z.infer<T>> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await getClient().responses.parse({
        model: process.env.OPENAI_MODEL || "gpt-5.5",
        instructions: `${options.instructions}${attempt ? "\nA prior output failed deterministic validation. Carefully satisfy every count, ordering, length, grounding, and schema rule." : ""}`,
        input: options.input,
        tools: options.webSearch ? [{ type: "web_search" as const }] : undefined,
        include: options.webSearch ? ["web_search_call.action.sources"] : undefined,
        text: { format: zodTextFormat(options.schema, options.schemaName) },
      });
      if (!response.output_parsed) throw new Error("The provider returned no structured output.");
      const parsed = options.schema.parse(response.output_parsed);
      const searchCalls = response.output.filter((item) => item.type === "web_search_call");
      if (options.webSearch && !searchCalls.some((item) => item.status === "completed")) {
        throw new ResearchError("Live web research did not complete.");
      }
      const sourceUrls = searchCalls.flatMap((item) => {
        if (item.action.type === "search") return item.action.sources?.map((source) => source.url) || [];
        if (item.action.type === "open_page") return item.action.url ? [item.action.url] : [];
        return [item.action.url];
      });
      options.validate?.(parsed, sourceUrls);
      return parsed;
    } catch (error) {
      if (error instanceof ConfigurationError || error instanceof OpenAI.RateLimitError) throw error;
      lastError = error;
    }
  }
  if (lastError instanceof ResearchError) throw lastError;
  throw new OutputValidationError(lastError instanceof Error ? lastError.message : "The generated output was invalid.");
}
