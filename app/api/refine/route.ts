import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-errors";
import { SYSTEM_ROLE, refinementPrompt } from "@/lib/prompts";
import { structuredResponse } from "@/lib/openai-client";
import { refinementSchema, refineRequestSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const input = refineRequestSchema.parse(await request.json());
    const data = await structuredResponse({
      schema: refinementSchema,
      schemaName: "pitch_prep_refinement",
      instructions: SYSTEM_ROLE,
      input: refinementPrompt(input),
    });
    return NextResponse.json({ data });
  } catch (error) {
    return apiError(error);
  }
}
