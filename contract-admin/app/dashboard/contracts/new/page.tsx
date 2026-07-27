"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CONTRACT_TYPES = [
  { value: "FIDIC_RED", label: "FIDIC Red Book (1999/2017)" },
  { value: "FIDIC_YELLOW", label: "FIDIC Yellow Book" },
  { value: "FIDIC_SILVER", label: "FIDIC Silver Book" },
  { value: "FIDIC_GREEN", label: "FIDIC Green Book" },
  { value: "NEC3", label: "NEC3" },
  { value: "NEC4", label: "NEC4" },
  { value: "BESPOKE", label: "Bespoke / Other" },
];

const PARSE_STEPS = [
  "Uploading PDF…",
  "Extracting text…",
  "Parsing parties and dates…",
  "Extracting clauses…",
  "Generating milestones…",
  "Complete ✓",
];

export default function NewContractPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [contractNumber, setContractNumber] = useState("");
  const [projectName, setProjectName] = useState("");
  const [contractType, setContractType] = useState("FIDIC_RED");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError(null);
    setStep(0);

    try {
      // Create contract record
      const createRes = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, contract_number: contractNumber, project_name: projectName, contract_type: contractType }),
      });
      if (!createRes.ok) throw new Error("Failed to create contract");
      const { contract } = await createRes.json();
      setStep(1);

      if (file) {
        setStep(2);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("contract_type", contractType);

        const uploadRes = await fetch(`/api/contracts/${contract.id}/upload`, {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) throw new Error("Failed to upload PDF");
        setStep(3);

        // Poll parse status
        let attempts = 0;
        while (attempts < 60) {
          await new Promise((r) => setTimeout(r, 3000));
          const statusRes = await fetch(`/api/contracts/${contract.id}`);
          const { contract: updated } = await statusRes.json();
          if (updated.parse_status === "completed") {
            setStep(5);
            break;
          } else if (updated.parse_status === "failed") {
            throw new Error(updated.parse_error ?? "Parsing failed");
          }
          setStep(3 + Math.min(attempts % 2, 1));
          attempts++;
        }
      }

      router.push(`/dashboard/contracts/${contract.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-bold text-[var(--color-foreground)] mb-6">Add New Contract</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
            Contract Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Main Works Contract — Tower B"
            required
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Contract Number</label>
            <input
              type="text"
              value={contractNumber}
              onChange={(e) => setContractNumber(e.target.value)}
              placeholder="e.g. DDC-2024-001"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Al Maryah Residences"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Contract Type</label>
          <select
            value={contractType}
            onChange={(e) => setContractType(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            {CONTRACT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
            Contract PDF (optional — required for AI analysis)
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-[var(--color-foreground)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary)] file:text-white hover:file:opacity-90"
          />
          <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
            The AI will extract all parties, clauses, milestones, and notice periods automatically.
          </p>
        </div>

        {loading && (
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <div className="space-y-2">
              {PARSE_STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <span className={`text-sm ${i < step ? "text-green-600" : i === step ? "text-[var(--color-primary)] font-medium" : "text-[var(--color-muted)]"}`}>
                    {i < step ? "✓" : i === step ? "⟳" : "○"} {s}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="rounded-lg bg-[var(--color-primary)] px-6 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Processing…" : "Create Contract"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-[var(--color-border)] px-6 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-card)]"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
