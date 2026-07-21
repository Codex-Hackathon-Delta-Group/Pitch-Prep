import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-errors";
import { SYSTEM_ROLE, analysisPrompt } from "@/lib/prompts";
import { structuredResponse } from "@/lib/openai-client";
import { analysisSchema, analyzeRequestSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const input = analyzeRequestSchema.parse(await request.json());
    const generated = await structuredResponse({
      schema: analysisSchema,
      schemaName: "pitch_prep_analysis",
      instructions: SYSTEM_ROLE,
      input: analysisPrompt(input.idea, input.audience),
      webSearch: true,
      validate: (data, sourceUrls) => {
        const researched = new Set(sourceUrls.map(normalizeUrl));
        if (data.alternatives.some((alternative) => !researched.has(normalizeUrl(alternative.source.url)))) {
          throw new Error("An alternative source was not present in the web research results.");
        }
      },
    });
    const data = analysisSchema.parse({
      ...generated,
      analysisId: crypto.randomUUID(),
      analyzedAt: new Date().toISOString(),
    });
    return NextResponse.json({ data });
  } catch (error) {
    return apiError(error);
  }
}

function normalizeUrl(value: string) {
  const url = new URL(value);
  return `${url.origin.toLowerCase()}${url.pathname.replace(/\/$/, "")}`;
}
