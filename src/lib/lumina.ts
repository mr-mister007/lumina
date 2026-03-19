import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_NAME = "gemini-2.5-flash";

export type Source = {
  id: string;
  name: string;
  content: string;
};

export type Claim = {
  id: string;
  sourceId: string;
  text: string;
  category: string;
  confidence: number;
};

export type TensionPoint = {
  claimA: Claim;
  claimB: Claim;
  explanation: string;
};

export type LuminaResult = {
  masterClaims: string[];
  tensionPoints: TensionPoint[];
  graphNodes: any[];
  graphEdges: any[];
  comparison?: {
    summary: string;
    betterFor: { scenario: string; winner: string; reason: string }[];
    verdict: string;
  };
};

export async function searchTopic(topic: string, maxIterations = 2): Promise<Source[]> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    tools: [{ googleSearch: {} } as any],
  });

  const chat = model.startChat();
  let allSources: Source[] = [];
  
  for (let i = 0; i < maxIterations; i++) {
    const prompt = `
      Research the topic: "${topic}". (Iteration ${i + 1} of ${maxIterations})
      Identify distinct perspectives or sub-topics that haven't been fully covered yet.
      Use Google Search to gather detailed information.
      
      Format the output as JSON ONLY (no markdown blocks):
      {
        "sources": [
          { "name": "Source Name/Perspective", "content": "Detailed content..." }
        ],
        "needsMoreResearch": boolean (true if you feel there are major blind spots remaining)
      }
    `;

    const res = await chat.sendMessage(prompt);
    const text = res.response.text().replace(/```json|```/g, "").trim();
    
    try {
      const data = JSON.parse(text);
      const newSources = (data.sources || []).map((s: any, idx: number) => ({
        id: `search-${i}-${idx}`,
        name: s.name,
        content: s.content
      }));
      
      allSources = [...allSources, ...newSources];
      
      if (!data.needsMoreResearch) {
        break; // Agent decided it has enough info!
      }
    } catch (e) {
      console.error("JSON parse error in agent loop:", e);
      break;
    }
  }

  return allSources;
}

export async function processResearch(sources: Source[], onProgress?: (chunk: string) => void): Promise<LuminaResult> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  const sourcesText = sources.map(s => `SOURCE [${s.id}]: ${s.content}`).join("\n\n");

  const prompt = `You are Lumina, a Cognitive Load Balancer. Analyze the following information snippets from multiple sources.

### INSTRUCTIONS:
1. **Extract Key Claims:** Break down the information into atomic, factual claims. 
2. **De-duplicate:** If multiple sources make the same claim, merge them into a single "Master Claim."
3. **Detect Tension Points:** Specifically identify where sources CONTRADICT each other.
4. **Build a Knowledge Graph:** Identify how claims connect.
5. **Comparison Analysis (IF APPLICABLE):** If comparing things, provide a structured comparison.

### INPUT SOURCES:
${sourcesText}

### RESPONSE FORMAT:
Respond ONLY with a valid JSON object:
{
  "masterClaims": ["string"],
  "tensionPoints": [
    {
      "sourceAId": "string",
      "claimA": "string",
      "sourceBId": "string",
      "claimB": "string",
      "explanation": "string"
    }
  ],
  "graph": {
    "nodes": [{"id": "string", "label": "string", "type": "claim|source"}],
    "edges": [{"source": "string", "target": "string", "label": "string"}]
  },
  "comparison": {
    "summary": "string",
    "betterFor": [
      { "scenario": "string", "winner": "string", "reason": "string" }
    ],
    "verdict": "string"
  }
}`;

  // We use standard generation since the frontend doesn't have a streaming JSON parser yet,
  // but we can stream the raw chunks back if onProgress is provided.
  const res = await model.generateContentStream({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' }
  });

  let fullText = "";
  for await (const chunk of res.stream) {
    const chunkText = chunk.text();
    fullText += chunkText;
    if (onProgress) onProgress(chunkText);
  }

  const rawData = JSON.parse(fullText.replace(/```json|```/g, "").trim() || "{}");

  const tensionPoints: TensionPoint[] = (rawData.tensionPoints || []).map((tp: any) => ({
    claimA: { id: `a-${Math.random()}`, sourceId: tp.sourceAId, text: tp.claimA, category: 'fact', confidence: 1 },
    claimB: { id: `b-${Math.random()}`, sourceId: tp.sourceBId, text: tp.claimB, category: 'fact', confidence: 1 },
    explanation: tp.explanation
  }));

  return {
    masterClaims: rawData.masterClaims || [],
    tensionPoints: tensionPoints,
    graphNodes: rawData.graph?.nodes || [],
    graphEdges: rawData.graph?.edges || [],
    comparison: rawData.comparison && rawData.comparison.summary ? {
      summary: rawData.comparison.summary,
      betterFor: Array.isArray(rawData.comparison.betterFor) ? rawData.comparison.betterFor : [],
      verdict: rawData.comparison.verdict || "Analysis complete."
    } : undefined
  };
}