"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LuTrash2 } from "react-icons/lu";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { deleteExamAction } from "@/app/actions/exam";

/**
 * Two-step delete: the first click swaps the button for a confirm row, so a
 * destructive action is never one stray tap away. Deleting an exam takes its
 * halls, candidates and plans with it, hence the explicit warning.
 */
export function DeleteExamButton({ examId, examTitle }: { examId: string; examTitle: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    setError(null);

    startTransition(async () => {
      const result = await deleteExamAction(examId);

      if (!result.ok) {
        setError(result.message ?? "Could not delete the exam.");
        return;
      }

      router.push("/exams");
      router.refresh();
    });
  }

  if (!confirming) {
    return (
      <div className="flex flex-col gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirming(true)}
          icon={<LuTrash2 />}
          className="text-ink-3 hover:text-danger"
        >
          Delete exam
        </Button>
        {error ? <Alert tone="danger">{error}</Alert> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Alert tone="danger" title={`Delete "${examTitle}"?`}>
        This removes its halls, candidates and seat plans. It cannot be undone.
      </Alert>
      <div className="flex gap-2">
        <Button variant="danger" size="sm" onClick={remove} loading={pending} icon={<LuTrash2 />}>
          Yes, delete
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={pending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
