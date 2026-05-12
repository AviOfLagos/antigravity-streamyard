import Link from "next/link";
import { ArrowLeft, Zap } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col items-center justify-center px-6 text-center">
      <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
        <Zap size={24} />
      </div>
      <h1 className="font-black tracking-tight text-white leading-none mb-4" style={{ fontSize: "clamp(64px, 10vw, 120px)" }}>
        404
      </h1>
      <h2 className="text-2xl font-bold mb-4">Page not found</h2>
      <p className="text-neutral-400 max-w-md mx-auto mb-10 leading-relaxed">
        The page you&apos;re looking for doesn&apos;t exist or has been moved. 
        Don&apos;t worry, your stream is still live somewhere.
      </p>
      
      <Link 
        href="/" 
        className="inline-flex items-center gap-2 bg-white text-neutral-950 font-bold px-8 py-4 rounded-full text-sm hover:bg-indigo-100 transition-all hover:scale-105"
      >
        <ArrowLeft size={16} /> Return Home
      </Link>
    </div>
  );
}
