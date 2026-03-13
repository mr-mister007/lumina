import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_NAME = 'gemini-2.5-flash'; // Switching to stable 1.5 flash to avoid 2.5 quota issues

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
};

export async function processResearch(sources: Source[]): Promise<LuminaResult> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  const sourcesText = sources.map(s => `SOURCE [${s.id}]: ${s.content}`).join('\n\n');

  const prompt = `You are Lumina, a Cognitive Load Balancer. Analyze the following information snippets from multiple sources.

### INSTRUCTIONS:
1. **Extract Key Claims:** Break down the information into atomic, factual claims. 
2. **De-duplicate:** If multiple sources make the same claim, merge them into a single "Master Claim."
3. **Detect Tension Points:** Specifically identify where sources CONTRADICT each other (e.g., conflicting dates, differing numbers, opposing conclusions).
4. **Build a Knowledge Graph:** Identify how claims connect (e.g., "Fact A is a cause of Fact B").

### INPUT SOURCES:
${sourcesText}

### RESPONSE FORMAT:
Respond ONLY with a JSON object:
{
  "masterClaims": ["string (a clean, synthesized list of unique facts)"],
  "tensionPoints": [
    {
      "sourceAId": "string (matching Source ID)",
      "claimA": "string (the exact wording from source A)",
      "sourceBId": "string (matching Source ID)",
      "claimB": "string (the conflicting wording from source B)",
      "explanation": "string (why they conflict)"
    }
  ],
  "graph": {
    "nodes": [{"id": "string", "label": "string", "type": "claim|source"}],
    "edges": [{"source": "string", "target": "string", "label": "string"}]
  }
}`;

  const res = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' }
  });

  const responseText = res.response.text();
  const rawData = JSON.parse(responseText || "{}");

  // Format TensionPoints correctly with the original Claim objects (simulated from text)
  const tensionPoints: TensionPoint[] = (rawData.tensionPoints || []).map((tp: any) => ({
    claimA: { id: `a-${Math.random()}`, sourceId: tp.sourceAId, text: tp.claimA, category: 'fact', confidence: 1 },
    claimB: { id: `b-${Math.random()}`, sourceId: tp.sourceBId, text: tp.claimB, category: 'fact', confidence: 1 },
    explanation: tp.explanation
  }));

  return {
    masterClaims: rawData.masterClaims || [],
    tensionPoints: tensionPoints,
    graphNodes: rawData.graph?.nodes || [],
    graphEdges: rawData.graph?.edges || []
  };
}