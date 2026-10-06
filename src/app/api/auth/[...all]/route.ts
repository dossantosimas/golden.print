import { getAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The admin plugin is used privately by server services. Its generic HTTP routes
// must never bypass membership, audit or the last active administrator guard.
const publicRoutes = new Map([
  ["/sign-in/email", "POST"], ["/sign-out", "POST"], ["/get-session", "GET"],
  ["/change-password", "POST"], ["/list-sessions", "GET"],
  ["/revoke-session", "POST"], ["/revoke-other-sessions", "POST"],
]);

async function handle(request: Request): Promise<Response> {
  const path = new URL(request.url).pathname.slice("/api/auth".length);
  if (publicRoutes.get(path) !== request.method) {
    return Response.json({ error: { code: "FORBIDDEN", message: "Operación de acceso no disponible." } },
      { status: 403, headers: { "Cache-Control": "private, no-store" } });
  }
  try {
    const response = await getAuth().handler(request);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    const cause = error && typeof error === "object" && "cause" in error ? error.cause : undefined;
    const candidateCode = error && typeof error === "object" && "code" in error ? error.code
      : cause && typeof cause === "object" && "code" in cause ? cause.code : undefined;
    console.error("Auth handler failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      code: typeof candidateCode === "string" && /^[A-Z0-9_]{1,80}$/.test(candidateCode) ? candidateCode : undefined,
    });
    return Response.json({ error: { code: "SERVICE_UNAVAILABLE", message: "El servicio de acceso no está disponible." } },
      { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}

export const GET = handle;
export const POST = handle;
