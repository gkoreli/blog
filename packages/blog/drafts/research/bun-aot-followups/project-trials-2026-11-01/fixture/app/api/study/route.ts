export const dynamic = "force-dynamic";
export function GET() {
  return Response.json({ framework: "Next.js", result: 42 }, { headers: { "Cache-Control": "no-store" } });
}
