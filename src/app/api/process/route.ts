import { processResearch, Source } from '@/lib/lumina';

export async function POST(req: Request) {
  try {
    const { sources } = await req.json();

    if (!sources || !Array.isArray(sources) || sources.length === 0) {
      return Response.json({ error: "At least one source is required" }, { status: 400 });
    }

    const result = await processResearch(sources);
    return Response.json(result);
  } catch (error: any) {
    console.error("Lumina processing error:", error);
    return Response.json({ error: "Failed to process research", details: error.message }, { status: 500 });
  }
}