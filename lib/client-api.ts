type Envelope<T> = { data: T };

export class ClientApiError extends Error {
  constructor(public code: string, message: string) { super(message); }
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json() as Envelope<T> | { error?: { code?: string; message?: string } };
  if (!response.ok || !("data" in payload)) {
    const error = "error" in payload ? payload.error : undefined;
    throw new ClientApiError(error?.code || "UNKNOWN_ERROR", error?.message || "Something went wrong.");
  }
  return payload.data;
}
