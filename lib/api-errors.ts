import { NextResponse } from "next/server";
import OpenAI from "openai";
import { ZodError } from "zod";
import { ConfigurationError, OutputValidationError, ProviderError, ResearchError } from "./openai-client";
import type { ErrorCode } from "./contracts";

export function apiError(error: unknown) {
  const requestId = crypto.randomUUID();
  let status = 502;
  let code: ErrorCode = "PROVIDER_ERROR";
  let message = "The AI provider could not complete this request. Please retry.";

  if (error instanceof ZodError || error instanceof SyntaxError) {
    status = 400; code = "VALIDATION_ERROR"; message = "The request did not match the expected format.";
  } else if (error instanceof ConfigurationError) {
    status = 500; code = "CONFIGURATION_ERROR"; message = error.message;
  } else if (error instanceof OutputValidationError) {
    code = "OUTPUT_VALIDATION_ERROR"; message = "The generated result did not pass validation. Please retry.";
  } else if (error instanceof ResearchError) {
    code = "RESEARCH_FAILED"; message = "Live research did not return trustworthy sources. Please retry.";
  } else if (error instanceof ProviderError) {
    code = "PROVIDER_ERROR"; message = error.message;
  } else if (error instanceof OpenAI.RateLimitError) {
    status = 429; code = "RATE_LIMITED"; message = "The service is busy. Please wait a moment and retry.";
  }

  console.error(JSON.stringify({ route: "api", requestId, status, code }));
  return NextResponse.json({ error: { code, message, requestId } }, { status });
}
