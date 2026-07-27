import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Wrench } from "lucide-react";
import type { Tool } from "@/types/database";

export default async function ToolsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: tools } = await supabase
    .from("tools")
    .select("*")
    .order("category");

  const CONDITION_LABEL: Record<Tool["condition"], { label: string; cls: string }> = {
    excellent:     { label: "Excellent",     cls: "text-emerald-400 bg-emerald-400/10" },
    good:          { label: "Good",          cls: "text-chrome/50 bg-steel/40" },
    fair:          { label: "Fair",          cls: "text-amber-400 bg-amber-400/10" },
    needs_service: { label: "Needs Service", cls: "text-race-red bg-race-red/10" },
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <p className="font-label text-[10px] text-chrome/25 uppercase tracking-widest mb-1">
          Operations / Tool Inventory
        </p>
        <h1 className="font-display text-3xl text-chrome">Tool Inventory</h1>
        <p className="font-body text-sm text-chrome/40 mt-1">
          Available tools for your session — included in your tool kit add-on
        </p>
      </div>

      <div className="bg-carbon border border-steel rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-steel">
          <h2 className="font-display text-base text-chrome">
            {tools?.length ?? 0} Tools Available
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-steel">
                {["Tool", "Category", "Brand", "Condition", "Status"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-2.5 text-left font-label text-[10px] text-chrome/30 uppercase tracking-widest"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(tools ?? []).map((tool) => {
                const cond = CONDITION_LABEL[tool.condition as Tool["condition"]] ?? CONDITION_LABEL.good;
                return (
                  <tr
                    key={tool.id}
                    className="border-b border-steel/40 hover:bg-steel/20 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-steel/60 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Wrench className="w-3.5 h-3.5 text-chrome/40" />
                        </div>
                        <div>
                          <p className="font-body text-sm text-chrome">{tool.name}</p>
                          {tool.description && (
                            <p className="font-label text-[10px] text-chrome/30 truncate max-w-xs">
                              {tool.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-label text-xs text-chrome/40 uppercase tracking-wider">
                      {tool.category.replace("_", " ")}
                    </td>
                    <td className="px-5 py-3 font-body text-sm text-chrome/60">
                      {tool.brand ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-label text-[10px] uppercase tracking-wider ${cond.cls}`}
                      >
                        {cond.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-label text-[10px] uppercase tracking-wider ${
                          tool.is_available
                            ? "text-emerald-400 bg-emerald-400/10"
                            : "text-race-red bg-race-red/10"
                        }`}
                      >
                        {tool.is_available ? "Available" : "In Use"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
