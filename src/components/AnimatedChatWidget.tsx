"use client";

import { useEffect, useRef, useState } from "react";
import { User, Zap } from "lucide-react";

type Message = {
  id: number;
  type: "user" | "ai" | "system";
  author: string;
  text: string;
};

const ALL_MESSAGES: Message[] = [
  { id: 1, type: "user", author: "GamerXYZ", text: "this stream is fire 🔥" },
  { id: 2, type: "user", author: "SarahL", text: "did u just beat that boss??" },
  { id: 3, type: "ai", author: "Avi (AI Co-Host)", text: "@SarahL Yes! Finally beat him after 3 hours of trying 😅" },
  { id: 4, type: "system", author: "System", text: "Mikey just subscribed!" },
  { id: 5, type: "ai", author: "Avi (AI Co-Host)", text: "Thanks for the sub Mikey! Welcome to the squad 🙌" },
  { id: 6, type: "user", author: "NinjaFan", text: "what build are you running right now?" },
  { id: 7, type: "ai", author: "Avi (AI Co-Host)", text: "@NinjaFan Currently running a high-crit stealth build! Type !build for the full specs." },
];

export function AnimatedChatWidget() {
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visibleMessages]);

  useEffect(() => {
    let index = 0;
    let resetTimer: ReturnType<typeof setTimeout> | null = null;
    const interval = setInterval(() => {
      const next = ALL_MESSAGES[index];
      if (next) {
        setVisibleMessages((prev) => [...prev, next]);
        index++;
      } else if (!resetTimer) {
        resetTimer = setTimeout(() => {
          setVisibleMessages([]);
          index = 0;
          resetTimer = null;
        }, 5000);
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      if (resetTimer) clearTimeout(resetTimer);
    };
  }, []);

  return (
    <div className="w-full max-w-md mx-auto h-[460px] bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-2xl relative">
      <div className="shrink-0 bg-[#111] border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
          <span className="text-xs font-bold text-white uppercase tracking-wider truncate">Live Chat</span>
        </div>
        <span className="text-xs text-neutral-500 font-mono shrink-0">1.2k watching</span>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="p-4 flex flex-col gap-3">
          {visibleMessages.filter(Boolean).map((msg) => (
            <div
              key={msg.id}
              className={`text-sm animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                msg.type === "system" ? "text-center text-indigo-400 font-medium my-1" : "flex items-start gap-2 min-w-0"
              }`}
            >
              {msg.type !== "system" && (
                <div className={`mt-0.5 shrink-0 w-6 h-6 rounded-md flex items-center justify-center ${msg.type === "ai" ? "bg-indigo-500/20 text-indigo-400" : "bg-white/5 text-neutral-400"}`}>
                  {msg.type === "ai" ? <Zap size={12} /> : <User size={12} />}
                </div>
              )}

              {msg.type !== "system" ? (
                <div className="min-w-0 flex-1 break-words">
                  <span className={`font-bold mr-2 ${msg.type === "ai" ? "text-indigo-400" : "text-neutral-300"}`}>
                    {msg.author}
                    {msg.type === "ai" && <span className="ml-1.5 text-[9px] uppercase tracking-widest bg-indigo-500/20 px-1 py-0.5 rounded text-indigo-300 border border-indigo-500/20">BOT</span>}
                  </span>
                  <span className={msg.type === "ai" ? "text-white" : "text-neutral-400"}>{msg.text}</span>
                </div>
              ) : (
                <span className="w-full bg-indigo-500/10 py-1 rounded border border-indigo-500/20 block text-xs break-words">{msg.text}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Input placeholder */}
      <div className="shrink-0 p-3 border-t border-white/5 bg-[#111]">
        <div className="bg-white/5 border border-white/5 rounded-full px-4 py-2 text-xs text-neutral-600">
          Say something...
        </div>
      </div>
    </div>
  );
}
