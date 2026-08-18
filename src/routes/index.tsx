import { useEffect, useState, useRef, useMemo } from "react";
import { 
  ArrowRight, 
  Sparkles, 
  Zap, 
  Bot, 
  Code2, 
  Search, 
  Boxes,
  Github,
  FileJson,
  Upload,
  MessageSquare,
  TrendingUp,
  ShieldCheck,
  Menu,
  X,
  ChevronRight,
  Monitor
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform, useSpring, useMotionTemplate, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const [entranceComplete, setEntranceComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setEntranceComplete(true), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20 font-mono overflow-x-hidden">
      <Navbar entranceComplete={entranceComplete} />
      <main>
        <Hero entranceComplete={entranceComplete} />
        <CinematicText />
        <MetricsSection />
        <TechnologySection />
        <ArchitectureSection />
      </main>
      <Footer />
    </div>
  );
}

// --- Components ---

function ScrambleIn({ text, delay = 0, triggered }: { text: string; delay?: number; triggered: boolean }) {
  const [display, setDisplay] = useState("");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~|}{[]:;?><";
  
  useEffect(() => {
    if (!triggered) return;
    
    let frame = 0;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        frame += 0.5;
        const currentText = text.split("").map((char, i) => {
          if (char === " ") return " ";
          if (i < frame) return char;
          if (i < frame + 3) return chars[Math.floor(Math.random() * chars.length)];
          return "";
        }).join("");
        
        setDisplay(currentText);
        if (frame >= text.length) clearInterval(interval);
      }, 25);
      return () => clearInterval(interval);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [triggered, text, delay]);

  return <span>{display || "\u00A0"}</span>;
}

function ScrambleText({ text, isHovered, className }: { text: string; isHovered: boolean; className?: string }) {
  const [display, setDisplay] = useState(text);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~|}{[]:;?><";
  
  useEffect(() => {
    if (!isHovered) {
      setDisplay(text);
      return;
    }
    
    let frame = 0;
    const interval = setInterval(() => {
      frame += 0.25;
      const currentText = text.split("").map((char, i) => {
        if (char === " ") return " ";
        if (i < frame) return char;
        return chars[Math.floor(Math.random() * chars.length)];
      }).join("");
      
      setDisplay(currentText);
      if (frame >= text.length) clearInterval(interval);
    }, 25);
    
    return () => clearInterval(interval);
  }, [isHovered, text]);

  return <span className={className}>{display}</span>;
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

function Navbar({ entranceComplete }: { entranceComplete: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [isDownloadHovered, setIsDownloadHovered] = useState(false);

  return (
    <motion.nav 
      initial={{ opacity: 0 }}
      animate={{ opacity: entranceComplete ? 1 : 0 }}
      transition={{ duration: 0.8 }}
      className="fixed top-0 left-0 right-0 h-20 z-50 flex items-center px-4 sm:px-8 pointer-events-none"
    >
      <div className="flex-1 flex items-center gap-2 pointer-events-auto">
        <motion.div 
          className="h-12 px-5 bg-white/10 backdrop-blur-md rounded-[14px] flex items-center gap-2 border border-white/10 overflow-hidden"
          onHoverStart={() => setIsLogoHovered(true)}
          onHoverEnd={() => setIsLogoHovered(false)}
          whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.15)" }}
          whileTap={{ scale: 0.98 }}
        >
          <SynapseXLogo className="h-4.5 w-4.5 text-white" />
          <span className="font-bold tracking-tight text-base">APIPilot</span>
        </motion.div>

        <motion.div 
          animate={{ width: isOpen ? 290 : 48 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="h-12 bg-white/10 backdrop-blur-md rounded-[14px] border border-white/10 flex items-center overflow-hidden"
        >
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "flex items-center justify-center transition-all",
              isOpen ? "h-9 w-9 rounded-[11px] bg-white/10 ml-1.5" : "h-12 w-12 rounded-[14px]"
            )}
          >
            {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <AnimatePresence>
            {isOpen && (
              <motion.div 
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                className="flex items-center gap-6 px-4"
              >
                <a href="#about" className="text-sm font-medium text-white/80 hover:text-white">About</a>
                <a href="#metrics" className="text-sm font-medium text-white/80 hover:text-white">Metrics</a>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="pointer-events-auto">
        <motion.button 
          className="h-12 px-6 bg-white rounded-full text-black flex items-center gap-2 font-bold"
          onHoverStart={() => setIsDownloadHovered(true)}
          onHoverEnd={() => setIsDownloadHovered(false)}
          whileHover={{ scale: 1.03, backgroundColor: "#e2e2e6" }}
          whileTap={{ scale: 0.97 }}
        >
          <Link to="/auth" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <ScrambleText text="Get Started" isHovered={isDownloadHovered} />
          </Link>
        </motion.button>
      </div>
    </motion.nav>
  );
}

function Hero({ entranceComplete }: { entranceComplete: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mouseX, setMouseX] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!videoRef.current) return;
      const x = e.clientX / window.innerWidth;
      setMouseX(x);
      videoRef.current.currentTime = x * videoRef.current.duration * 0.8;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section className="relative h-screen w-full flex flex-col overflow-hidden bg-black">
      <video 
        ref={videoRef}
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_083515_290e5a10-0b95-41af-a5e2-32b6389baa4d.mp4"
        className="absolute inset-0 w-full h-full object-cover opacity-60"
        muted
        playsInline
      />
      <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none" />
      
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <h2 className="watermark-text text-[clamp(120px,30vw,521px)] tracking-[-0.04em] uppercase select-none">
          INTELLIGENCE
        </h2>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: entranceComplete ? 1 : 0 }}
        transition={{ duration: 1 }}
        className="relative flex-1 flex flex-col justify-end p-8 sm:p-12 md:p-16"
      >
        <div className="flex flex-col md:flex-row items-end justify-between gap-12">
          <div className="space-y-8 max-w-2xl">
            <h1 className="text-white font-light leading-[0.95] tracking-[-0.03em] text-[clamp(40px,10vw,100px)]">
              <ScrambleIn text="Codebase" delay={200} triggered={entranceComplete} /><br />
              <ScrambleIn text="Intelligence" delay={500} triggered={entranceComplete} />
            </h1>
            <motion.p 
              initial={{ y: 25, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.9, ease: [0.215, 0.610, 0.355, 1.0] }}
              className="text-white/60 text-sm sm:text-base leading-relaxed max-w-md"
            >
              Built at the intersection of static analysis and neural AI. APIPilot continuously maps your repository architecture, endpoints, and health into a single adaptive intelligence layer.
            </motion.p>
          </div>
          
          <div className="text-right">
            <h1 className="text-white font-light leading-[0.95] tracking-[-0.03em] text-[clamp(40px,10vw,100px)]">
              <ScrambleIn text="One" delay={700} triggered={entranceComplete} /><br />
              <ScrambleIn text="Source" delay={1000} triggered={entranceComplete} />
            </h1>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function CinematicText() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const springScroll = useSpring(scrollYProgress, { stiffness: 15, damping: 32, mass: 1.8 });
  const yTranslate = useTransform(springScroll, [0, 1], [60, -120]);
  const opacity = useTransform(scrollYProgress, [0.3, 0.5], [0, 1]);
  const rotateX = useTransform(scrollYProgress, [0, 1], [24, 0]);

  return (
    <section ref={containerRef} className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-black">
      <video 
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_092455_089c54f8-3b03-4966-9df1-e9746063d0ef.mp4"
        className="absolute inset-0 w-full h-full object-cover opacity-40"
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-black to-transparent z-10" />
      
      <motion.div 
        style={{ opacity, rotateX, translateY: yTranslate, perspective: 400 }}
        className="relative z-20 max-w-5xl px-8 text-center"
      >
        <p className="font-sans font-normal text-[22px] sm:text-[30px] md:text-[36px] lg:text-[42px] text-white leading-[1.35] tracking-[-0.02em] select-none">
          A repository intelligence engine built on the architecture of modern engineering. APIPilot translates source code into computational documentation. Every route becomes measurable, structured, and visible. It continuously reconstructs your API as a dynamic neural map.
        </p>
      </motion.div>
    </section>
  );
}

function MetricsSection() {
  const metrics = [
    { value: "2.4ms", label: "Discovery Latency" },
    { value: "99.7%", label: "Scan Accuracy" },
    { value: "140B", label: "Context Window" }
  ];

  return (
    <section id="metrics" className="relative min-h-screen w-full bg-black flex flex-col items-center justify-center py-32 px-8">
      <video 
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_095810_ecea3dd2-fc5e-4e41-8696-4219290b6589.mp4"
        className="absolute inset-0 w-full h-full object-cover opacity-30"
        autoPlay
        muted
        loop
        playsInline
      />
      
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="relative z-10 w-full max-w-6xl"
      >
        <p className="text-white/40 text-sm tracking-[0.2em] uppercase mb-24 text-center">Performance Metrics</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-24 md:gap-12">
          {metrics.map((m, i) => (
            <motion.div 
              key={i}
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.15, duration: 0.8 }}
              className="flex flex-col items-center text-center"
            >
              <span className="text-white text-[clamp(48px,10vw,96px)] font-light tracking-[-0.04em] leading-none">
                {m.value}
              </span>
              <span className="text-white/40 text-sm mt-6 tracking-wide uppercase">{m.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function TechnologySection() {
  const features = [
    { title: "Static Extraction", desc: "Real-time reconstruction of repository routes and models." },
    { title: "Source Isolation", desc: "Separates business logic from boilerplate noise." },
    { title: "Health Scoring", desc: "Anticipates production risks before they occur." },
    { title: "AI Sync", desc: "Closed-loop context delivery to your LLM assistant." }
  ];

  return (
    <section className="relative h-screen w-full bg-black flex flex-col overflow-hidden">
      <video 
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_095750_32a52ce0-2005-45c9-9093-41f03fde9530.mp4"
        className="absolute inset-0 w-full h-full object-cover opacity-40"
        autoPlay
        muted
        loop
        playsInline
      />
      
      <div className="relative flex-1 flex flex-col p-8 sm:p-12 md:p-16">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-8">
          <motion.h2 
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 1 }}
            className="text-white font-light text-[clamp(36px,8vw,72px)] leading-[0.95] tracking-[-0.03em]"
          >
            Adaptive<br />Intelligence
          </motion.h2>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 1 }}
            className="text-white/50 text-sm leading-relaxed max-w-xs md:text-right"
          >
            The engine learns your codebase baseline within seconds. From there, every endpoint is mapped, verified, and optimized in real time.
          </motion.p>
        </div>
        
        <div className="flex-1" />
        
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6"
        >
          {features.map((f, i) => (
            <motion.div 
              key={i}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1, duration: 0.7 }}
            >
              <h4 className="text-white text-sm font-bold mb-2 uppercase tracking-tighter">{f.title}</h4>
              <p className="text-white/40 text-xs leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function ArchitectureSection() {
  const layers = [
    { id: "01", title: "Capture", label: "Sensor Layer" },
    { id: "02", title: "Process", label: "Analysis Layer" },
    { id: "03", title: "Interface", label: "Delivery Layer" }
  ];

  return (
    <section className="relative min-h-screen w-full bg-black flex flex-col items-center justify-center py-32 px-8">
      <div className="max-w-3xl w-full text-center">
        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 1 }}
          className="space-y-8"
        >
          <p className="text-white/40 text-sm tracking-[0.2em] uppercase">Architecture</p>
          <h2 className="text-white font-light text-[clamp(28px,6vw,56px)] leading-[1.15] tracking-[-0.02em]">
            Three layers.<br />Zero friction.
          </h2>
          <p className="text-white/45 text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
            Ingestion layer captures raw repository signals. Analysis layer isolates framework intent. Documentation layer delivers structured output to your team.
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 1.2 }}
          className="mt-20 flex flex-col items-center gap-4"
        >
          {layers.map((l, i) => (
            <div key={i} className="w-full max-w-md h-[72px] border border-white/10 rounded-none flex items-center justify-between px-8 hover:bg-white/5 transition-colors group">
              <span className="text-white/30 text-[10px] tracking-[0.15em] uppercase font-bold">{l.label} {l.id}</span>
              <span className="text-white text-lg font-light tracking-widest uppercase">{l.title}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 overflow-hidden">
      <div className="flex flex-col md:flex-row min-h-[400px]">
        <div className="flex-1 h-[300px] md:h-auto relative">
          <video 
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_080203_fd7f4f85-3a86-4837-8192-85e7bfe68e75.mp4"
            className="absolute inset-0 w-full h-full object-cover opacity-50"
            autoPlay
            muted
            loop
            playsInline
          />
        </div>
        
        <div className="flex-1 flex flex-col justify-between p-12 sm:p-16">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <SynapseXLogo className="h-6 w-6 text-white/70" />
              <span className="font-bold tracking-tight text-xl text-white/70">APIPilot</span>
            </div>
            <p className="text-white/40 text-sm sm:text-base leading-relaxed max-w-sm">
              The next evolution of human-machine documentation. Built for engineering teams who refuse to be limited by manual maintenance.
            </p>
          </div>
          
          <div className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-white/25 text-xs">© 2026 APIPilot Labs. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="text-white/25 hover:text-white transition-colors text-xs">Twitter</a>
              <a href="#" className="text-white/25 hover:text-white transition-colors text-xs">GitHub</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
