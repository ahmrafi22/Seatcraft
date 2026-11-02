"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LuCheck, LuTriangleAlert } from "react-icons/lu";

import { Switch } from "@/components/ui/switch";
import { setExamConstraintAction, type ExamConstraintsInput } from "@/app/actions/auth";

const RULES: { key: keyof ExamConstraintsInput; title: string; desc: string }[] = [
  {
    key: "preventSameInstitutionAdjacent",
    title: "No same institution adjacent",
    desc: "Two candidates from one college may never sit side by side. The solver guarantees this."
  },
  {
    key: "keepSubjectGroupContiguous",
    title: "Keep subject groups contiguous",
    desc: "Candidates sitting the same paper stay in one block."
  },
  {
    key: "maintainRollOrder",
    title: "Maintain roll order",
    desc: "Seats roughly follow roll order so attendance is quick. Advisory, never blocking."
  },
  {
    key: "allowHallSkipping",
    title: "Allow hall skipping",
    desc: "The solver may leave a hall partly empty to satisfy a rule."
  }
];

export function ConstraintEditor({ examId, constraints }: { examId: string; constraints: ExamConstraintsInput }) {
  const router = useRouter();
  const [values, setValues] = useState(constraints);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(key: keyof ExamConstraintsInput, next: boolean) {
    const previous = values;
    setValues({ ...values, [key]: next });
    setError(null);

    startTransition(async () => {
      const result = await setExamConstraintAction(examId, key, next);

      if (!result.ok) {
        setValues(previous);
        setError(result.message ?? "Could not save the rule.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <div>
      {RULES.map(({ key, title, desc }) => (
        <div key={key} className="flex items-start gap-3 border-b border-white/[0.06] py-3.5 last:border-0">
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-medium">{title}</div>
            <div className="mt-0.5 text-[12.5px] text-ink-3">{desc}</div>
          </div>
          <Switch checked={values[key]} onChange={(next) => toggle(key, next)} label={title} disabled={pending} />
        </div>
      ))}

      {error ? (
        <div className="reveal mt-3 flex items-center gap-2 text-[12.5px] text-danger">
          <LuTriangleAlert className="size-3.5" />
          {error}
        </div>
      ) : null}

      {pending ? (
        <div className="mt-3 flex items-center gap-2 text-[12px] text-ink-3">
          <LuCheck className="size-3.5" />
          saving…
        </div>
      ) : null}
    </div>
  );
}
