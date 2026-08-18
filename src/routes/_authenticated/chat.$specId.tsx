import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState, useMemo } from "react";
import {
  ArrowLeft,
  Send,
  Loader2,
  Sparkles,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  MessageSquare,
  Bot,
  User,
  Hash,
  Info,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/_authenticated/chat/$specId")({
  head: () => ({
    meta: [
      { title: "AI Assistant — APIPilot AI" },
      { name: "description", content: "Chat with your API specification." },
    ],
  }),
  component: ChatPage,
});

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const SUGGESTED_QUESTIONS = [
  "How do I authenticate?",
  "Show all payment endpoints.",
  "Which endpoint uploads files?",
  "Generate a Python example.",
  "Which endpoints require authentication?",
];

async function fetchSpecContext(specId: string) {
  const [specRes, docRes, epRes, modelsRes] = await Promise.all([
    supabase.from("api_specs").select("*").eq("id", specId).single(),
    supabase.from("generated_docs").select("*").eq("spec_id", specId).maybeSingle(),
    supabase.from("api_endpoints").select("*").eq("spec_id", specId),
    supabase.from("api_models").select("*").eq("spec_id", specId),
  ]);

  if (specRes.error) throw specRes.error;

  return {
    spec: specRes.data,
    doc: docRes.data,
    endpoints: epRes.data || [],
    models: modelsRes.data || [],
  };
}

function ChatPage() {
  const { specId } = Route.useParams() as any;
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: context, isLoading: isContextLoading } = useQuery({
    queryKey: ["chat-context", specId],
    queryFn: () => fetchSpecContext(specId),
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async (content: string = input) => {
    if (!content.trim() || isLoading || !context) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: content.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await callChatAPI(content, messages, context);
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      toast.error(error.message || "Failed to get AI response");
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast.success("Neural link cleared");
  };

  if (isContextLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black font-mono">
        <div className="flex flex-col items-center gap-6">
          <div className="h-12 w-12 border-2 border-white/10 border-t-white animate-spin" />
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/40 animate-pulse">Initializing Neural Link</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-black text-white font-mono selection:bg-white/20">
      {/* Header */}
      <header className="flex h-20 shrink-0 items-center justify-between border-b border-white/10 bg-black/80 px-4 backdrop-blur-xl sm:px-8 z-40">
        <div className="flex items-center gap-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: `/docs/${specId}` })}
            className="h-11 w-11 rounded-none border border-white/10 hover:bg-white/5"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col gap-1">
            <h1 className="text-sm font-bold uppercase tracking-widest leading-none">
              {context?.spec?.name} <span className="text-white/40">Assistant</span>
            </h1>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/20">
                Neural Link Active
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            disabled={messages.length === 0}
            className="hidden gap-3 sm:flex rounded-none border border-white/10 h-11 px-6 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </Button>
          <Badge className="hidden rounded-none bg-white/5 text-white/40 border-white/10 text-[9px] uppercase tracking-widest font-bold h-11 px-4 sm:flex items-center">
            v{context?.spec?.api_version || "1.0"}
          </Badge>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 grid-bg opacity-5 pointer-events-none" />
        <ScrollArea className="h-full px-4 py-12 sm:px-8">
          <div className="mx-auto max-w-3xl space-y-16">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="mb-10 grid h-24 w-24 place-items-center bg-white text-black shadow-glow">
                  <Bot className="h-12 w-12" />
                </div>
                <h2 className="text-4xl font-light tracking-tighter mb-4">Reconstructing Intelligence</h2>
                <p className="text-white/40 text-sm max-w-md mx-auto leading-relaxed mb-16">
                  I have mapped the neural pathways of your repository. Ask me anything about endpoints, models, or implementation.
                </p>
                
                <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSend(q)}
                      className="flex items-center justify-between rounded-none border border-white/10 bg-white/[0.02] p-6 text-left text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-white/5 group"
                    >
                      <span>{q}</span>
                      <Zap className="h-3 w-3 text-white/20 group-hover:text-white transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-12 pb-24">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "flex gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500",
                      m.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div className={cn(
                      "flex h-10 w-10 shrink-0 select-none items-center justify-center border",
                      m.role === "assistant" 
                        ? "bg-white text-black border-white" 
                        : "bg-black border-white/10 text-white/40"
                    )}>
                      {m.role === "assistant" ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                    </div>
                    <div className={cn(
                      "flex max-w-[85%] flex-col gap-3",
                      m.role === "user" ? "items-end" : "items-start"
                    )}>
                      <div className={cn(
                        "p-6 text-sm leading-relaxed",
                        m.role === "assistant" 
                          ? "bg-white/[0.02] border border-white/10 text-white/80" 
                          : "bg-white text-black font-bold shadow-glow"
                      )}>
                        {m.role === "assistant" ? (
                          <div className="prose prose-sm prose-invert max-w-none prose-pre:bg-black prose-pre:border prose-pre:border-white/10 prose-pre:rounded-none prose-code:text-white prose-code:bg-white/10 prose-code:px-1 prose-code:rounded-none prose-code:before:content-none prose-code:after:content-none">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeHighlight]}
                              components={{
                                blockquote: ({ node, ...p }) => (
                                  <div className="my-6 border-l-2 border-white bg-white/5 p-6 italic text-white/60">
                                    {p.children}
                                  </div>
                                ),
                                pre: ({ node, ...p }) => (
                                  <div className="group relative my-8 overflow-hidden border border-white/10 bg-black">
                                    <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-2">
                                      <div className="flex gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
                                        <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
                                        <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
                                      </div>
                                      <button 
                                        onClick={() => {
                                          const code = (node?.children?.[0] as any)?.value || "";
                                          navigator.clipboard.writeText(code);
                                          toast.success("Code captured");
                                        }}
                                        className="text-[9px] font-bold uppercase tracking-widest text-white/20 hover:text-white transition-colors"
                                      >
                                        Copy
                                      </button>
                                    </div>
                                    <pre className="overflow-x-auto p-6 text-[12px] font-mono leading-relaxed" {...p} />
                                  </div>
                                ),
                                a: ({ node, ...p }) => <a className="text-white underline decoration-white/30 underline-offset-4 hover:decoration-white transition-colors" {...p} />,
                                h1: ({ node, ...p }) => <h1 className="text-xl font-bold uppercase tracking-widest mt-8 mb-4" {...p} />,
                                h2: ({ node, ...p }) => <h2 className="text-lg font-bold uppercase tracking-widest mt-6 mb-3" {...p} />,
                              }}
                            >
                              {m.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{m.content}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 px-1">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-white/20">
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {m.role === "assistant" && (
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(m.content);
                              toast.success("Intelligence captured");
                            }}
                            className="text-white/20 hover:text-white transition-colors"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-6 animate-in fade-in duration-300">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-white text-black">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="p-6 bg-white/[0.02] border border-white/10 flex items-center gap-4">
                        <div className="h-4 w-4 border-2 border-white/10 border-t-white animate-spin" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Reconstructing Signal...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            )}
          </div>
        </ScrollArea>
      </main>

      {/* Input Area */}
      <footer className="border-t border-white/10 bg-black/80 p-6 backdrop-blur-xl z-40">
        <div className="mx-auto max-w-3xl relative">
          <Input
            placeholder="Query repository intelligence..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={isLoading}
            className="h-16 pl-6 pr-24 bg-white/[0.02] border-white/10 rounded-none focus:border-white/30 text-sm placeholder:text-white/20 transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <Button
              size="icon"
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="h-12 w-12 bg-white text-black hover:bg-white/90 rounded-none shadow-glow transition-all"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        <p className="mt-4 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-white/10">
          Biological intelligence required for critical decisions.
        </p>
      </footer>
    </div>
  );
}

// Mocked API call - preservation of existing business logic
async function callChatAPI(content: string, history: Message[], context: any): Promise<string> {
  // In a real implementation, this would call the backend.
  // We're preserving the logic as instructed.
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const hasEndpoints = context.endpoints.length > 0;
  if (content.toLowerCase().includes("authenticate")) {
    return `Neural mapping indicates that authentication for **${context.spec.name}** is currently handled via \`${context.spec.auth_type || "No specific scheme detected"}\`. \n\n> [!IMPORTANT]\n> Ensure your headers are correctly configured before attempting requests to verified endpoints.`;
  }
  
  return `Signal received. Reconstructing intelligence for query: "${content}". \n\nBased on my mapping of the **${context.spec.framework || "repository"}** architecture, there are ${context.endpoints.length} active routes detected. You can explore these pathways in the Documentation sector or ask me for specific implementation examples.`;
}
