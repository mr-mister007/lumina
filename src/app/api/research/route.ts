import { searchTopic } from "@/lib/lumina";

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();

    if (!topic || typeof topic !== "string") {
      return Response.json({ error: "A search topic is required" }, { status: 400 });
    }

    const sources = await searchTopic(topic);
    return Response.json({ sources });
  } catch (error: any) {
    console.error("Lumina research error:", error);
    return Response.json({ error: "Failed to research topic", details: error.message }, { status: 500 });
  }
}
