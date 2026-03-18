import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_NAME = 'gemini-2.5-flash'; // Using 2.5 flash as requested

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

export async function searchTopic(topic: string): Promise<Source[]> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  const model = genAI.getGenerativeModel({ 
    model: MODEL_NAME,
    tools: [
      {
        googleSearch: {},
      } as any,
    ],
  });

  const isComparison = / vs | versus | compare | comparison | better than /i.test(topic);

  let prompt = `Research the topic: "${topic}". 
  Identify 3-5 distinct perspectives or sub-topics and provide a detailed summary for each.
  Each source should be comprehensive enough for further analysis.
  
  Format the output as JSON:
  {
    "sources": [
      { "name": "Source Name/Perspective", "content": "Detailed content..." }
    ]
  }`;

  if (isComparison) {
    prompt = `Perform a detailed comparison for: "${topic}".
    Research both entities/topics thoroughly.
    Identify:
    1. Key differences and similarities.
    2. Pros and cons of each.
    3. Use cases where one is better than the other.
    4. Expert opinions or community consensus.
    
    Provide 4-5 distinct perspectives (e.g., "Performance Comparison", "Ease of Use", "Ecosystem & Support", "Cost/Efficiency").
    
    Format the output as JSON:
    {
      "sources": [
        { "name": "Comparison Aspect", "content": "Detailed comparative analysis..." }
      ]
    }`;
  }

  const res = await model.generateContent(prompt);
  const responseText = res.response.text();
  
  // Clean up JSON if it contains markdown markers
  const jsonStr = responseText.replace(/```json|```/g, "").trim();
  const data = JSON.parse(jsonStr || "{\"sources\": []}");
  
  return (data.sources || []).map((s: any, idx: number) => ({
    id: `search-${idx}`,
    name: s.name,
    content: s.content
  }));
}

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
5. **Comparison Analysis (IF APPLICABLE):** If the sources are comparing two or more things, provide a structured comparison summary.

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
  },
  "comparison": {
    "summary": "string (overall comparison summary)",
    "betterFor": [
      { "scenario": "string (e.g. For beginners)", "winner": "string (name of the winner)", "reason": "string" }
    ],
    "verdict": "string (final recommendation/conclusion)"
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
    graphEdges: rawData.graph?.edges || [],
    comparison: rawData.comparison && rawData.comparison.summary ? {
      summary: rawData.comparison.summary,
      betterFor: Array.isArray(rawData.comparison.betterFor) ? rawData.comparison.betterFor : [],
      verdict: rawData.comparison.verdict || "Analysis complete."
    } : undefined
  };
}