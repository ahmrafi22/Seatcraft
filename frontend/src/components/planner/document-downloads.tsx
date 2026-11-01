"use client";

import { useState } from "react";
import { LuDownload, LuFileText } from "react-icons/lu";

import { Button } from "@/components/ui/button";
import { downloadDocumentAction } from "@/app/actions/exam";

type Kind = "admit-cards" | "attendance-sheets";

const LABELS: Record<Kind, { label: string; hint: string }> = {
  "admit-cards": { label: "Admit cards", hint: "One PDF per candidate, zipped" },
  "attendance-sheets": { label: "Attendance", hint: "One sheet per hall, zipped" }
};

export function DocumentDownloads({
  examId,
  planId,
  published
}: {
  examId: string;
  planId: string;
  published: boolean;
}) {
  const [busy, setBusy] = useState<Kind | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function download(kind: Kind) {
    setBusy(kind);
    setError(null);

    const result = await downloadDocumentAction(examId, planId, kind);

    if (!result.ok || !result.url) {
      setBusy(null);
      setError(result.message ?? "Could not build the documents.");
      return;
    }

    // The API streams the zip itself, so the browser downloads straight from it.
    window.location.assign(result.url);
    setBusy(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {(Object.keys(LABELS) as Kind[]).map((kind) => (
          <Button
            key={kind}
            variant={kind === "admit-cards" ? "default" : "ghost"}
            size="sm"
            className="flex-1"
            disabled={!published}
            loading={busy === kind}
            onClick={() => download(kind)}
            icon={kind === "admit-cards" ? <LuDownload /> : <LuFileText />}
          >
            {LABELS[kind].label}
          </Button>
        ))}
      </div>

      <p className="text-[11px] leading-relaxed text-ink-3">
        {error ?? (published ? LABELS["admit-cards"].hint : "Publish the plan to unlock documents.")}
      </p>
    </div>
  );
}
