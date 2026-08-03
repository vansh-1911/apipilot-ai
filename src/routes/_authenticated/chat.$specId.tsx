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
    toast.success("Conversation cleared");
  };

  if (isContextLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading API context...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl sm:px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: `/docs/${specId}` })}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold leading-none sm:text-base">
              {context?.spec?.name} Assistant
            </h1>
            <p className="text-[10px] text-muted-foreground sm:text-xs">
              Powered by API Intelligence
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            disabled={messages.length === 0}
            className="hidden gap-2 sm:flex"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Clear</span>
          </Button>
          <Separator orientation="vertical" className="mx-2 hidden h-6 sm:block" />
          <Badge variant="outline" className="hidden border-primary/20 bg-primary/5 text-primary sm:flex">
            v{context?.spec?.api_version || "1.0"}
          </Badge>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-hidden relative">
        <ScrollArea className="h-full px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-3xl space-y-8">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-brand shadow-glow">
                  <Bot className="h-10 w-10 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">How can I help with your API?</h2>
                <p className="mt-2 text-muted-foreground max-w-md">
                  I'm your API Intelligence Assistant. I have full context of your specification, 
                  endpoints, and documentation.
                </p>
                
                <div className="mt-10 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSend(q)}
                      className="flex items-start rounded-xl border border-border/60 bg-card/40 p-4 text-left text-sm transition-all hover:border-primary/30 hover:bg-primary/5 group"
                    >
                      <MessageSquare className="mr-3 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                      <span>{q}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-8 pb-12">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
                      m.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg border",
                      m.role === "assistant" 
                        ? "bg-primary/10 border-primary/20 text-primary" 
                        : "bg-muted border-border/60 text-muted-foreground"
                    )}>
                      {m.role === "assistant" ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                    </div>
                    <div className={cn(
                      "flex max-w-[85%] flex-col gap-2",
                      m.role === "user" ? "items-end" : "items-start"
                    )}>
                      <div className={cn(
                        "rounded-2xl px-4 py-3 text-sm shadow-sm",
                        m.role === "assistant" 
                          ? "bg-card border border-border/40 text-foreground" 
                          : "bg-primary text-primary-foreground shadow-glow-sm"
                      )}>
                        {m.role === "assistant" ? (
                          <div className="prose prose-sm prose-invert max-w-none">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeHighlight]}
                              components={{
                                blockquote: ({ node, ...p }) => (
                                  <div className="my-5 rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-sm animate-in zoom-in-95 duration-300">
                                    <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary">
                                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                        <Sparkles className="h-3 w-3" />
                                      </div>
                                      AI Insight
                                    </div>
                                    <div className="text-sm italic leading-relaxed text-foreground/90 prose-p:m-0">
                                      {p.children}
                                    </div>
                                  </div>
                                ),
                                pre: ({ node, ...p }) => (
                                  <div className="group relative my-5 overflow-hidden rounded-xl border border-border/60 bg-[#0d1117] shadow-md transition-all hover:border-border">
                                    <div className="flex items-center justify-between border-b border-border/40 bg-muted/20 px-4 py-2">
                                      <div className="flex gap-1.5">
                                        <div className="h-2 w-2 rounded-full bg-red-500/50" />
                                        <div className="h-2 w-2 rounded-full bg-yellow-500/50" />
                                        <div className="h-2 w-2 rounded-full bg-green-500/50" />
                                      </div>
                                      <button 
                                        onClick={() => {
                                          const code = (node?.children?.[0] as any)?.value || "";
                                          navigator.clipboard.writeText(code);
                                          toast.success("Code copied");
                                        }}
                                        className="text-muted-foreground/50 hover:text-foreground transition-colors"
                                      >
                                        <Copy className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                    <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed scrollbar-thin scrollbar-thumb-border" {...p} />
                                  </div>
                                ),
                                code: ({ node, className, children, ...p }: any) => {
                                  const match = /language-(\w+)/.exec(className || "");
                                  return !p.inline ? (
                                    <code className={className} {...p}>
                                      {children}
                                    </code>
                                  ) : (
                                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-primary" {...p}>
                                      {children}
                                    </code>
                                  );
                                },
                                h1: ({ node, ...p }) => <h1 className="mt-6 mb-4 text-xl font-bold tracking-tight text-foreground" {...p} />,
                                h2: ({ node, ...p }) => <h2 className="mt-5 mb-3 text-lg font-bold tracking-tight text-foreground" {...p} />,
                                h3: ({ node, ...p }) => <h3 className="mt-4 mb-2 text-base font-bold text-foreground" {...p} />,
                                p: ({ node, ...p }) => <p className="mb-4 leading-7 text-foreground/90 last:mb-0" {...p} />,
                                ul: ({ node, ...p }) => <ul className="mb-4 ml-6 list-disc space-y-2 text-foreground/90" {...p} />,
                                ol: ({ node, ...p }) => <ol className="mb-4 ml-6 list-decimal space-y-2 text-foreground/90" {...p} />,
                                li: ({ node, ...p }) => <li className="pl-1" {...p} />,
                                a: ({ node, ...p }) => <a className="font-medium text-primary underline underline-offset-4 hover:text-primary/80" {...p} />,
                              }}
                            >
                              {m.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{m.content}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 px-1">
                        <span className="text-[10px] text-muted-foreground/50">
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {m.role === "assistant" && (
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(m.content);
                              toast.success("Copied to clipboard");
                            }}
                            className="text-muted-foreground/40 hover:text-primary transition-colors"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-4 animate-in fade-in duration-300">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-primary/10 border-primary/20 text-primary">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="rounded-2xl bg-card border border-border/40 px-4 py-3 shadow-sm">
                        <div className="flex gap-1.5 py-1">
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/40 [animation-delay:-0.3s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/40 [animation-delay:-0.15s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/40" />
                        </div>
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
      <footer className="shrink-0 border-t border-border/60 bg-background/80 p-4 backdrop-blur-xl sm:p-6">
        <div className="mx-auto max-w-3xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="relative flex items-center gap-2"
          >
            <Input
              placeholder="Ask anything about this API..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="h-12 rounded-xl border-border/60 bg-muted/30 pr-12 focus:bg-background transition-all"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="absolute right-1.5 h-9 w-9 rounded-lg bg-gradient-brand shadow-glow transition-all hover:opacity-90 disabled:opacity-50"
            >
              <Send className="h-4 w-4 text-primary-foreground" />
            </Button>
          </form>
          <p className="mt-3 text-center text-[10px] text-muted-foreground/50">
            Assistant can make mistakes. Please verify with the documentation.
          </p>
        </div>
      </footer>
    </div>
  );
}

async function callChatAPI(userMessage: string, history: Message[], context: any): Promise<string> {
  const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
  const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

  if (!context || !context.spec) {
    throw new Error("API context not available. Please refresh the page.");
  }

  const endpointList = (context.endpoints || [])
    .map((e: any) => `- ${e.method || "GET"} ${e.path}: ${e.summary || "No summary"}. Tags: ${e.tags?.join(", ") || "None"}.`)
    .join("\n") || "No endpoints available.";

  const systemPrompt = `
You are the API Intelligence Assistant for "${context.spec.name}".
Your primary source of truth is the Unified API Model, which includes code-extracted data and AI-inferred insights.

API CONTEXT:
- Title: ${context.spec.name}
- Language: ${context.spec.language || "Unknown"}
- Framework: ${context.spec.framework || "Unknown"}
- Auth Strategy: ${context.spec.auth_type || "None"}
- Source: ${context.spec.source_type || "openapi"}
- Health Score: ${(context.spec.health_report as any)?.overallScore || "N/A"}

ENDPOINTS AVAILABLE:
${endpointList}

MODELS DETECTED:
${(context.models || []).map((m: any) => `- ${m.name}: ${(m.fields || []).map((f: any) => `${f.name} (${f.type})`).join(", ")}`).join("\n") || "No models detected."}

CORE INSTRUCTIONS:
1. SOURCE OF TRUTH: Always prioritize verified data. Never invent endpoints, authentication methods, or request bodies.
2. AI INSIGHTS: When providing interpretations or recommendations, wrap them in a blockquote (>) and include a confidence indicator:
   - [AI Inferred]: For reasonably inferred details.
   - [AI Recommendation]: For best-practice advice.
3. CODE EXAMPLES: Provide production-ready examples using the detected framework (${context.spec.framework || "the relevant framework"}).
4. HEALTH CONTEXT: Use the Health Report to suggest improvements if the user asks about API quality or best practices.

Example Response Style:
The **POST /users** endpoint is verified from the source code.

> [AI Recommendation]: Consider adding rate limiting to this endpoint to prevent abuse, as it handles user registration.
`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage }
  ];

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages,
      temperature: 0.5,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "AI request failed");
  }

  return data.choices[0].message.content;
}
