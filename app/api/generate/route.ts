import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-errors";
import { SYSTEM_ROLE, generationPrompt } from "@/lib/prompts";
import { structuredResponse } from "@/lib/openai-client";
import { generateRequestSchema, pitchKitSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const input = generateRequestSchema.parse(await request.json());
    const generated = await structuredResponse({
      schema: pitchKitSchema,
      schemaName: "pitch_prep_pitch_kit",
      instructions: SYSTEM_ROLE,
      input: generationPrompt(input),
    });
    const data = pitchKitSchema.parse({
      ...generated,
      selectedConcept: input.selectedConcept,
      audience: input.audience,
      alternatives: input.analysis.alternatives,
      generatedAt: new Date().toISOString(),
      fallback: false,
    });
    return NextResponse.json({ data });
  } catch (error) {
    return apiError(error);
  }
}
