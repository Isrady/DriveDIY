"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import AgentSidebar from "./AgentSidebar";
import ChatArea from "./ChatArea";
import PermissionsPanel from "./PermissionsPanel";
import LaunchChecklist from "./LaunchChecklist";
import RecommendationsFeed from "./RecommendationsFeed";
import type { AgentMessage, AgentStatus, Permission, LaunchChecklistItem, Recommendation } from "@/types/agents";
import type { AgentLog } from "@/types/database";

const INITIAL_AGENTS: AgentStatus[] = [
  { name: "commander", label: "COMMANDER", color: "#F59E0B", status: "standby" },
  { name: "ops", label: "OPS AGENT", color: "#E8330A", status: "standby" },
  { name: "marketing", label: "MARKETING", color: "#A855F7", status: "standby" },
  { name: "crm", label: "CRM AGENT", color: "#3B82F6", status: "standby" },
  { name: "dev", label: "DEV AGENT", color: "#22C55E", status: "standby" },
];

interface Props {
  user: { id: string; email: string; role?: string; full_name?: string | null };
  initialPermissions: Permission[];
  initialChecklist: LaunchChecklistItem[];
  initialRecommendations: Recommendation[];
  recentLogs: AgentLog[];
}

export default function CommanderLayout({
  user,
  initialPermissions,
  initialChecklist,
  initialRecommendations,
  recentLogs,
}: Props) {
  const [messages, setMessages] = useState<AgentMessage[]>([
    {
      role: "assistant",
      content:
        `Commander online. DriveDIY status: **pre-launch**. I'm tracking ${initialChecklist.filter((i) => !i.is_completed).length} open items on the launch checklist and have ${initialRecommendations.length} recommendations ready.\n\nWhat do you need, Ismail?`,
      agent: "commander",
      timestamp: new Date(),
    },
  ]);
  const [permissions, setPermissions] = useState<Permission[]>(initialPermissions);
  const [checklist, setChecklist] = useState<LaunchChecklistItem[]>(initialChecklist);
  const [recommendations, setRecommendations] = useState<Recommendation[]>(initialRecommendations);
  const [agents, setAgents] = useState<AgentStatus[]>(INITIAL_AGENTS);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [rightPanel, setRightPanel] = useState<"permissions" | "checklist" | "recommendations">(
    "permissions"
  );

  const supabase = createClient();
  const streamRef = useRef<AbortController | null>(null);

  // Realtime subscriptions
  useEffect(() => {
    const permChannel = supabase
      .channel("permissions-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pending_permissions" },
        (payload) => {
          setPermissions((prev) => [payload.new as Permission, ...prev]);
        }
      )
      .subscribe();

    const recsChannel = supabase
      .channel("recommendations-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "recommendations" },
        (payload) => {
          setRecommendations((prev) => [payload.new as Recommendation, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(permChannel);
      supabase.removeChannel(recsChannel);
    };
  }, [supabase]);

  const setAgentStatus = useCallback(
    (name: string, status: AgentStatus["status"]) => {
      setAgents((prev) =>
        prev.map((a) => (a.name === name ? { ...a, status } : a))
      );
    },
    []
  );

  async function sendMessage(input: string) {
    if (isStreaming) return;

    const userMessage: AgentMessage = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    const assistantMessage: AgentMessage = {
      role: "assistant",
      content: "",
      agent: "commander",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsStreaming(true);
    setAgentStatus("commander", "processing");

    // Build messages for API
    const apiMessages = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const controller = new AbortController();
      streamRef.current = controller;

      const response = await fetch("/api/commander", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          sessionId,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error("Stream failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.chunk) {
              fullContent += parsed.chunk;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: fullContent,
                };
                return updated;
              });
            }
          } catch {}
        }
      }

      // Try to extract message from JSON response
      try {
        const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.message) {
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: parsed.message,
              };
              return updated;
            });
          }
        }
      } catch {}
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: "⚠️ Commander encountered an error. Check your API key and try again.",
          };
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
      setAgentStatus("commander", "standby");
      streamRef.current = null;
    }
  }

  async function resolvePermission(id: string, status: "approved" | "denied") {
    const res = await fetch(`/api/permissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setPermissions((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status } : p))
      );
    }
  }

  async function toggleChecklistItem(id: string, currentState: boolean) {
    const supabase2 = createClient();
    const { data } = await supabase2
      .from("launch_checklist")
      .update({
        is_completed: !currentState,
        completed_at: !currentState ? new Date().toISOString() : null,
        completed_by: user.id,
      })
      .eq("id", id)
      .select()
      .single();
    if (data) {
      setChecklist((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...data } : item))
      );
    }
  }

  async function dismissRecommendation(id: string) {
    const supabase2 = createClient();
    await supabase2
      .from("recommendations")
      .update({ is_dismissed: true, dismissed_at: new Date().toISOString() })
      .eq("id", id);
    setRecommendations((prev) => prev.filter((r) => r.id !== id));
  }

  const completedChecklist = checklist.filter((i) => i.is_completed).length;
  const pendingPermissions = permissions.filter((p) => p.status === "pending");

  return (
    <div className="flex h-screen bg-midnight text-chrome overflow-hidden">
      {/* Left sidebar */}
      <AgentSidebar agents={agents} recentLogs={recentLogs} />

      {/* Main chat area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex-shrink-0 h-14 border-b border-steel flex items-center justify-between px-6 bg-midnight">
          <div className="flex items-center gap-3">
            <span className="font-display text-xl text-chrome">COMMANDER</span>
            <span className="font-label text-xs text-chrome/30 uppercase tracking-widest">
              / DriveDIY Control Center
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/dashboard/app"
              className="font-label text-xs text-chrome/30 hover:text-chrome uppercase tracking-widest transition-colors"
            >
              ← App
            </a>
          </div>
        </div>

        <ChatArea
          messages={messages}
          onSend={sendMessage}
          isStreaming={isStreaming}
        />
      </main>

      {/* Right panel */}
      <aside className="w-80 flex-shrink-0 flex flex-col border-l border-steel bg-carbon overflow-hidden">
        {/* Panel tabs */}
        <div className="flex border-b border-steel flex-shrink-0">
          {[
            {
              id: "permissions" as const,
              label: "Approvals",
              count: pendingPermissions.length,
            },
            {
              id: "checklist" as const,
              label: "Launch",
              count: checklist.length - completedChecklist,
            },
            {
              id: "recommendations" as const,
              label: "Intel",
              count: recommendations.length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRightPanel(tab.id)}
              className={`flex-1 py-3 font-label text-xs uppercase tracking-wider transition-colors relative ${
                rightPanel === tab.id
                  ? "text-ember border-b-2 border-ember"
                  : "text-chrome/30 hover:text-chrome/60"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1 bg-ember text-white text-[10px] rounded-full w-4 h-4 inline-flex items-center justify-center">
                  {tab.count > 9 ? "9+" : tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-y-auto">
          {rightPanel === "permissions" && (
            <PermissionsPanel
              permissions={pendingPermissions}
              onResolve={resolvePermission}
            />
          )}
          {rightPanel === "checklist" && (
            <LaunchChecklist
              items={checklist}
              onToggle={toggleChecklistItem}
              completed={completedChecklist}
            />
          )}
          {rightPanel === "recommendations" && (
            <RecommendationsFeed
              recommendations={recommendations}
              onDismiss={dismissRecommendation}
            />
          )}
        </div>
      </aside>
    </div>
  );
}
