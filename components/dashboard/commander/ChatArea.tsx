"use client";

import { useState, useRef, useEffect } from "react";
import type { AgentMessage } from "@/types/agents";

const AGENT_COLORS: Record<string, string> = {
  commander: "#F59E0B",
  ops: "#E8330A",
  marketing: "#A855F7",
  crm: "#3B82F6",
};

function MessageBubble({ msg }: { msg: AgentMessage }) {
  const isUser = msg.role === "user";

  // Simple markdown-like rendering
  const renderContent = (text: string) => {
    // Try to extract message from JSON
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.message) text = parsed.message;
      }
    } catch {}

    return text
      .split("\n")
      .map((line, i) => {
        // Bold: **text**
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <span key={i}>
            {parts.map((part, j) =>
              part.startsWith("**") && part.endsWith("**") ? (
                <strong key={j} className="text-chrome font-semibold">
                  {part.slice(2, -2)}
                </strong>
              ) : (
                <span key={j}>{part}</span>
              )
            )}
            {i < text.split("\n").length - 1 && <br />}
          </span>
        );
      });
  };

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{
          backgroundColor: isUser
            ? "#17171D"
            : AGENT_COLORS[msg.agent ?? "commander"] + "22",
          border: `1px solid ${isUser ? "#17171D" : AGENT_COLORS[msg.agent ?? "commander"] + "44"}`,
        }}
      >
        <span className="text-xs">
          {isUser ? "I" : msg.agent?.[0]?.toUpperCase() ?? "C"}
        </span>
      </div>

      <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        {/* Agent label */}
        {!isUser && msg.agent && (
          <span
            className="font-label text-[10px] uppercase tracking-wider mb-1"
            style={{ color: AGENT_COLORS[msg.agent] }}
          >
            {msg.agent}
          </span>
        )}

        <div
          className={`rounded-2xl px-4 py-3 text-sm font-body leading-relaxed ${
            isUser
              ? "bg-steel text-chrome rounded-tr-sm"
              : "bg-carbon border border-steel text-chrome/80 rounded-tl-sm"
          }`}
        >
          {msg.content ? (
            renderContent(msg.content)
          ) : (
            <span className="inline-flex gap-1">
              <span className="w-1.5 h-1.5 bg-chrome/30 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-chrome/30 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-chrome/30 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
          )}
        </div>

        <span className="font-label text-[9px] text-chrome/20 mt-1">
          {new Date(msg.timestamp).toLocaleTimeString("en-AE", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Dubai",
          })}
        </span>
      </div>
    </div>
  );
}

const QUICK_PROMPTS = [
  "What should I prioritize right now?",
  "Draft an Instagram post for launch",
  "What's the status of our launch checklist?",
  "Help me write a WhatsApp blast for pre-launch",
];

interface Props {
  messages: AgentMessage[];
  onSend: (input: string) => void;
  isStreaming: boolean;
}

export default function ChatArea({ messages, onSend, isStreaming }: Props) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    setInput("");
    onSend(trimmed);
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div className="px-6 pb-3 flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => onSend(prompt)}
              className="font-label text-xs text-chrome/40 hover:text-chrome border border-steel hover:border-chrome/30 px-3 py-1.5 rounded-full transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex-shrink-0 border-t border-steel p-4 flex items-end gap-3"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Message Commander... (Enter to send, Shift+Enter for newline)"
          rows={2}
          className="flex-1 bg-steel rounded-xl px-4 py-3 text-chrome font-body text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ember placeholder:text-chrome/20"
          disabled={isStreaming}
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="bg-ember hover:bg-race-red text-white font-label text-xs uppercase tracking-widest px-5 py-3 rounded-xl transition-colors disabled:opacity-30 flex-shrink-0"
        >
          {isStreaming ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}
