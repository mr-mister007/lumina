"use client";

import { useState } from "react";
import { 
  Sparkles, 
  AlertCircle, 
  Plus, 
  Minus, 
  Send, 
  Loader2, 
  Layers, 
  Brain,
  Search,
  BookOpen,
  GitBranch
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  Node, 
  Edge,
  MarkerType
} from "reactflow";
import "reactflow/dist/style.css";

type SourceInput = {
  id: string;
  name: string;
  content: string;
};

export default function Lumina() {
  const [sources, setSources] = useState<SourceInput[]>([
    { id: "1", name: "Source 1", content: "" },
    { id: "2", name: "Source 2", content: "" }
  ]);
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const addSource = () => {
    setSources([...sources, { id: `${sources.length + 1}`, name: `Source ${sources.length + 1}`, content: "" }]);
  };

  const removeSource = (id: string) => {
    if (sources.length <= 1) return;
    setSources(sources.filter(s => s.id !== id));
  };

  const updateSourceContent = (id: string, content: string) => {
    setSources(sources.map(s => s.id === id ? { ...s, content } : s));
  };

  const updateSourceName = (id: string, name: string) => {
    setSources(sources.map(s => s.id === id ? { ...s, name } : s));
  };

  const researchTopic = async () => {
    if (!topic.trim()) {
      setError("Please enter a research topic.");
      return;
    }

    setIsResearching(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setSources(data.sources);
    } catch (err: any) {
      setError(err.message || "An error occurred during research.");
    } finally {
      setIsResearching(false);
    }
  };

  const analyze = async () => {
    if (sources.some(s => !s.content.trim())) {
      setError("Please fill in all source content.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sources }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      // Convert result to ReactFlow format with a more structured and spaced-out layout
      const sourceNodes = data.graphNodes.filter((n: any) => n.type === 'source');
      const claimNodes = data.graphNodes.filter((n: any) => n.type === 'claim');

      const nodes: Node[] = [
        ...sourceNodes.map((n: any, idx: number) => ({
          id: n.id,
          type: 'input',
          data: { label: n.label },
          position: { 
            x: 0, 
            y: idx * 250 
          },
          className: 'bg-amber-500/10 border-2 border-amber-500/50 text-amber-500 font-bold p-6 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.2)] w-40 h-40 flex items-center justify-center text-center',
        })),
        ...claimNodes.map((n: any, idx: number) => ({
          id: n.id,
          type: 'default',
          data: { label: n.label },
          position: { 
            x: 600 + (idx % 2 === 0 ? 0 : 300), 
            y: idx * 150 
          },
          className: 'bg-emerald-500/5 border border-emerald-500/30 text-emerald-100 p-6 rounded-3xl border text-sm w-72 text-center shadow-xl backdrop-blur-md hover:border-emerald-500/60 transition-colors',
        }))
      ];

      const edges: Edge[] = data.graphEdges.map((e: any) => ({
        id: `${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        label: e.label,
        animated: true,
        type: 'smoothstep',
        labelStyle: { fill: '#9ca3af', fontSize: 11, fontWeight: 600 },
        labelBgPadding: [6, 4],
        labelBgBorderRadius: 8,
        labelBgStyle: { fill: '#111827', fillOpacity: 0.9 },
        style: { stroke: '#10b981', strokeWidth: 2, opacity: 0.6 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
      }));

      setResult({ ...data, nodes, edges });
    } catch (err: any) {
      setError(err.message || "An error occurred during analysis.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-neutral-100 font-sans selection:bg-emerald-500/30">
      <nav className="border-b border-neutral-900 bg-[#0a0a0b]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-400" />
            <span className="text-xl font-bold tracking-tight text-neutral-100">Lumina</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium uppercase tracking-widest text-neutral-500">
            <span>The Cognitive Load Balancer</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 pt-12">
        <header className="mb-12 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-transparent">
            Distill Complexity into Clarity
          </h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            Lumina merges multiple information sources, flags contradictions, and builds a unified knowledge graph.
          </p>
        </header>

        {!result && (
          <div className="max-w-3xl mx-auto mb-16">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative flex items-center bg-neutral-900/90 border border-neutral-800 p-2 rounded-full backdrop-blur-xl">
                <Search className="w-6 h-6 text-neutral-500 ml-4" />
                <input 
                  type="text" 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && researchTopic()}
                  placeholder="Enter a topic to research autonomously (e.g., 'Impact of AI on creative writing')..."
                  className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-neutral-100 placeholder:text-neutral-600 font-medium"
                />
                <button
                  onClick={researchTopic}
                  disabled={isResearching}
                  className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold px-8 py-3 rounded-full transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isResearching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Researching...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Explore</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <p className="text-center text-neutral-500 text-xs mt-4 uppercase tracking-widest font-semibold">
              OR MANUALLY ADD SOURCES BELOW
            </p>
          </div>
        )}

        {!result ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            <AnimatePresence>
              {sources.map((source, index) => (
                <motion.div
                  key={source.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-neutral-900/40 border border-neutral-800 p-4 rounded-3xl group transition-all hover:border-emerald-500/30"
                >
                  <div className="flex items-center justify-between mb-3 px-2">
                    <input 
                      type="text" 
                      value={source.name}
                      onChange={(e) => updateSourceName(source.id, e.target.value)}
                      className="bg-transparent font-medium text-emerald-400 outline-none w-full"
                    />
                    {sources.length > 1 && (
                      <button 
                        onClick={() => removeSource(source.id)}
                        className="text-neutral-500 hover:text-red-400 p-1 rounded-full hover:bg-red-400/10 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <textarea
                    value={source.content}
                    onChange={(e) => updateSourceContent(source.id, e.target.value)}
                    placeholder="Paste your research snippet here..."
                    className="w-full h-48 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-neutral-600"
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            
            <button
              onClick={addSource}
              className="h-full min-h-[150px] border-2 border-dashed border-neutral-800 rounded-3xl flex flex-col items-center justify-center gap-3 text-neutral-500 hover:border-emerald-500/50 hover:text-emerald-400 transition-all group"
            >
              <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Add Source</span>
            </button>

            <div className="md:col-span-2 lg:col-span-3 flex flex-col items-center gap-4 mt-8">
              {error && (
                <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-2 rounded-full text-sm border border-red-400/20">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              <button
                onClick={analyze}
                disabled={loading}
                className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold px-12 py-4 rounded-full shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)] transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {loading ? "Processing Information..." : "Synthesize Knowledge"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-12 pb-24">
            {/* Comparison Analysis Section */}
            {result.comparison && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-neutral-900/40 border border-emerald-500/30 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 text-emerald-500/10">
                  <GitBranch className="w-32 h-32" />
                </div>
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-emerald-400">
                  <Brain className="w-6 h-6" />
                  Comparison Analysis
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                  <div className="lg:col-span-2 space-y-6">
                    <p className="text-lg text-neutral-200 leading-relaxed font-medium">
                      {result.comparison.summary}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {result.comparison.betterFor.map((item: any, i: number) => (
                        <div key={i} className="p-5 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 hover:border-emerald-500/30 transition-colors">
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500 block mb-2">{item.scenario}</span>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-bold text-white bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/20">
                              🏆 {item.winner}
                            </span>
                          </div>
                          <p className="text-sm text-neutral-400 leading-relaxed">{item.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-neutral-950/80 border border-neutral-800 p-8 rounded-[2rem] flex flex-col justify-center shadow-inner relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-[2rem] blur opacity-0 group-hover:opacity-100 transition duration-1000"></div>
                    <div className="relative">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 block mb-3">Lumina Verdict</span>
                      <p className="text-base text-neutral-100 font-semibold leading-relaxed">
                        {result.comparison.verdict}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Unified Truth Section */}
              <section className="bg-neutral-900/40 border border-neutral-800 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 text-neutral-800">
                  <BookOpen className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-emerald-400">
                  <Sparkles className="w-6 h-6" />
                  Synthesized Truth
                </h3>
                <ul className="space-y-4">
                  {result.masterClaims.map((claim: string, i: number) => (
                    <motion.li 
                      key={i} 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-4 p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/50 text-neutral-200"
                    >
                      <span className="text-emerald-500 font-mono text-sm pt-1">{i+1}.</span>
                      <p className="leading-relaxed">{claim}</p>
                    </motion.li>
                  ))}
                </ul>
              </section>

              {/* Tension Points Section */}
              <section className="bg-neutral-900/40 border border-neutral-800 rounded-[2.5rem] p-8 shadow-2xl">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-amber-500">
                  <AlertCircle className="w-6 h-6" />
                  Tension Points
                </h3>
                {result.tensionPoints.length > 0 ? (
                  <div className="space-y-6">
                    {result.tensionPoints.map((tp: any, i: number) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/20 space-y-4"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 block">Source {tp.claimA.sourceId}</span>
                            <p className="text-xs text-neutral-300 italic">"{tp.claimA.text}"</p>
                          </div>
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 block text-right">Source {tp.claimB.sourceId}</span>
                            <p className="text-xs text-neutral-300 italic text-right">"{tp.claimB.text}"</p>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-amber-500/10">
                          <p className="text-sm text-amber-200/80 font-medium">{tp.explanation}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-neutral-500">
                    <p>No contradictions detected across sources.</p>
                  </div>
                )}
              </section>
            </div>

            {/* Knowledge Graph Section */}
            <section className="bg-neutral-900/40 border border-neutral-800 rounded-[2.5rem] h-[750px] shadow-2xl overflow-hidden relative group">
              <div className="absolute top-6 left-8 z-10">
                <h3 className="text-2xl font-bold flex items-center gap-3 text-emerald-400">
                  <GitBranch className="w-6 h-6" />
                  Knowledge Graph
                </h3>
                <p className="text-xs text-neutral-500 mt-1">Left: Sources | Right: Synthesized Claims</p>
              </div>
              <ReactFlow
                nodes={result.nodes}
                edges={result.edges}
                fitView
                className="bg-transparent"
                onInit={(instance) => setTimeout(() => instance.fitView(), 100)}
              >
                <Background color="#1f2937" gap={24} size={1} />
                <Controls className="bg-neutral-800 border-none rounded-lg overflow-hidden shadow-lg" />
              </ReactFlow>
            </section>

            <div className="flex justify-center">
              <button 
                onClick={() => setResult(null)}
                className="text-neutral-500 hover:text-white transition-colors flex items-center gap-2 bg-neutral-900/40 px-6 py-2 rounded-full border border-neutral-800"
              >
                <Minus className="w-4 h-4" /> Reset Research Workspace
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}