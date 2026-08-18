import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Zap, Loader2, ChevronRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — APIPilot AI" },
      { name: "description", content: "Sign in or create an APIPilot AI account to manage your API specifications." },
      { property: "og:title", content: "Sign in to APIPilot AI" },
      { property: "og:description", content: "Access your APIPilot AI workspace." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && session) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [loading, session, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white font-mono relative overflow-hidden px-4">
      <div className="absolute inset-0 grid-bg opacity-5 pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 space-y-12">
        <Link to="/" className="flex flex-col items-center gap-6 group">
          <div className="h-16 w-16 border border-white/20 grid place-items-center group-hover:border-white transition-all duration-500">
            <SynapseXLogo className="h-8 w-8 text-white" />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-light tracking-tighter">APIPilot <span className="text-white/20 italic">Intelligence</span></h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20">Neural Interface v1.0</p>
          </div>
        </Link>

        <div className="border border-white/10 bg-black p-8 sm:p-12 space-y-8">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 rounded-none h-14 p-1 mb-10">
              <TabsTrigger value="signin" className="rounded-none text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-black transition-all">Connect</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-none text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-black transition-all">Initialize</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="mt-0">
              <SignInForm />
            </TabsContent>
            <TabsContent value="signup" className="mt-0">
              <SignUpForm />
            </TabsContent>
          </Tabs>
        </div>
        
        <p className="text-center text-[9px] font-bold uppercase tracking-[0.2em] text-white/10">
          Biological intelligence required for critical decisions.
        </p>
      </div>
    </div>
  );
}

function SignInForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <form onSubmit={submit} className="space-y-8">
      <div className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="signin-email" className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-1">Neural ID (Email)</Label>
          <Input 
            id="signin-email" 
            type="email" 
            autoComplete="email" 
            required 
            className="h-14 bg-white/5 border-white/10 rounded-none focus:border-white/30 text-sm transition-all placeholder:text-white/10"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </div>
        <div className="space-y-3">
          <Label htmlFor="signin-password" className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-1">Access Key (Password)</Label>
          <Input 
            id="signin-password" 
            type="password" 
            autoComplete="current-password" 
            required 
            className="h-14 bg-white/5 border-white/10 rounded-none focus:border-white/30 text-sm transition-all placeholder:text-white/10"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
        </div>
      </div>
      <Button type="submit" disabled={busy} className="w-full h-14 bg-white text-black hover:bg-white/90 rounded-none font-bold text-[10px] uppercase tracking-[0.2em] shadow-glow">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Establish Link"}
      </Button>
    </form>
  );
}

function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Intelligence unit initialized. Verify neural ID via email.");
  };

  return (
    <form onSubmit={submit} className="space-y-8">
      <div className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="signup-name" className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-1">Full Identity</Label>
          <Input 
            id="signup-name" 
            type="text" 
            autoComplete="name" 
            className="h-14 bg-white/5 border-white/10 rounded-none focus:border-white/30 text-sm transition-all placeholder:text-white/10"
            value={fullName} 
            onChange={(e) => setFullName(e.target.value)} 
          />
        </div>
        <div className="space-y-3">
          <Label htmlFor="signup-email" className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-1">Neural ID (Email)</Label>
          <Input 
            id="signup-email" 
            type="email" 
            autoComplete="email" 
            required 
            className="h-14 bg-white/5 border-white/10 rounded-none focus:border-white/30 text-sm transition-all placeholder:text-white/10"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </div>
        <div className="space-y-3">
          <Label htmlFor="signup-password" className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-1">Access Key (Password)</Label>
          <Input 
            id="signup-password" 
            type="password" 
            autoComplete="new-password" 
            required 
            minLength={6} 
            className="h-14 bg-white/5 border-white/10 rounded-none focus:border-white/30 text-sm transition-all placeholder:text-white/10"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
        </div>
      </div>
      <Button type="submit" disabled={busy} className="w-full h-14 bg-white text-black hover:bg-white/90 rounded-none font-bold text-[10px] uppercase tracking-[0.2em] shadow-glow">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Initialize Neural ID"}
      </Button>
    </form>
  );
}

function SynapseXLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="-50 -50 100 100" className={cn("fill-current", className)}>
      {[0, 90, 180, 270].map((rot) => (
        <path
          key={rot}
          d="M 1.5,23 L 1.5,33 C 1.5,38.5 6,43 11.5,43 L 16.5,43 C 22,43 26.5,38.5 26.5,33 Q 28,28 33,26.5 C 38.5,26.5 43,22 43,16.5 L 43,11.5 C 43,6 38.5,1.5 33,1.5 L 23,1.5 Q 12,12 1.5,23 Z"
          transform={`rotate(${rot})`}
        />
      ))}
    </svg>
  );
}
