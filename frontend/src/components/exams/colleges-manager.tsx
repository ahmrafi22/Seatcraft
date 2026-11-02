"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LuCheck, LuPencil, LuPlus, LuTrash2, LuX } from "react-icons/lu";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Dialog } from "@/components/ui/dialog";
import {
  createInstitutionAction,
  deleteInstitutionAction,
  updateInstitutionAction
} from "@/app/actions/exam";
import type { ActionResult } from "@/app/actions/auth";
import type { Institution } from "@/lib/api/types";

/**
 * One table for every college on the tenant: add inline, edit in place, delete
 * with a confirm. Colleges are shared across exams, which is why this is its own
 * page rather than a pane on /exams.
 */
export function CollegesManager({ institutions }: { institutions: Institution[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Institution | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [state, formAction, creating] = useActionState<ActionResult | null, FormData>(createInstitutionAction, null);

  function remove(institution: Institution) {
    setError(null);

    startTransition(async () => {
      const result = await deleteInstitutionAction(institution.id);

      if (!result.ok) {
        setError(result.message ?? "Could not delete the college.");
        setDeleting(null);
        return;
      }

      setDeleting(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        action={formAction}
        className="rounded-[var(--radius-ctl)] bg-white/[0.04] p-4 shadow-[inset_0_1px_0_oklch(100%_0_0/.08),0_0_0_1px_var(--edge)]"
      >
        <div className="label-mono mb-2.5">Add a college</div>
        <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_140px_auto] sm:items-end">
          <Field label="Name" htmlFor="new-name">
            <Input id="new-name" name="name" placeholder="Ideal College, Dhaka" required maxLength={160} />
          </Field>
          <Field label="Code" htmlFor="new-code">
            <Input id="new-code" name="code" placeholder="IC01" required maxLength={20} className="font-mono uppercase" />
          </Field>
          <Button type="submit" variant="primary" loading={creating} icon={<LuPlus />}>
            Add
          </Button>
        </div>
        <p className="mt-2 text-[11.5px] text-ink-3">
          The code is what CSV imports match on, e.g. <span className="font-mono">IC01</span>.
        </p>

        {state && !state.ok ? <div className="mt-2.5"><Alert tone="danger">{state.message}</Alert></div> : null}
        {state?.ok ? <div className="mt-2.5"><Alert tone="success">{state.message}</Alert></div> : null}
      </form>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      <div className="glass-pane overflow-hidden rounded-[var(--radius-pane)]">
        {institutions.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-ink-3">
            No colleges yet. Add one above, then import candidates with its code.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-white/[0.07] bg-white/[0.035]">
                  {["Name", "Code", "Candidates", ""].map((head) => (
                    <th
                      key={head}
                      className="px-4 py-2.5 text-left font-mono text-[10px] font-medium tracking-[0.12em] text-ink-3 uppercase whitespace-nowrap"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {institutions.map((institution) =>
                  editing === institution.id ? (
                    <EditRow
                      key={institution.id}
                      institution={institution}
                      onDone={() => {
                        setEditing(null);
                        router.refresh();
                      }}
                      onCancel={() => setEditing(null)}
                    />
                  ) : (
                    <tr
                      key={institution.id}
                      className="border-b border-white/[0.055] transition-colors last:border-0 hover:bg-white/[0.045]"
                    >
                      <td className="px-4 py-3 font-medium">{institution.name}</td>
                      <td className="px-4 py-3 font-mono text-ink-2">{institution.code}</td>
                      <td className="px-4 py-3 font-mono text-ink-2 tabular-nums">{institution.candidateCount}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setEditing(institution.id)}
                            aria-label={`Edit ${institution.name}`}
                            className="grid size-7 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-white/[0.08] hover:text-ink"
                          >
                            <LuPencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleting(institution)}
                            aria-label={`Delete ${institution.name}`}
                            className="grid size-7 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-white/[0.08] hover:text-danger"
                          >
                            <LuTrash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete college"
        description={deleting ? `Remove ${deleting.name}?` : undefined}
      >
        {deleting && deleting.candidateCount > 0 ? (
          <Alert tone="warning" title="This college still has candidates">
            {deleting.candidateCount} candidate{deleting.candidateCount === 1 ? "" : "s"} belong to it. Delete them
            first, or the server will refuse.
          </Alert>
        ) : (
          <p className="text-[13px] text-ink-2">
            This only removes the college. It cannot be undone.
          </p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleting(null)} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => deleting && remove(deleting)}
            loading={pending}
            disabled={Boolean(deleting && deleting.candidateCount > 0)}
            icon={<LuTrash2 />}
          >
            Delete
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function EditRow({
  institution,
  onDone,
  onCancel
}: {
  institution: Institution;
  onDone: () => void;
  onCancel: () => void;
}) {
  const action = updateInstitutionAction.bind(null, institution.id);
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(action, null);

  // Close the row once the save lands, so the table shows the new values.
  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <tr className="border-b border-white/[0.055] bg-white/[0.045] last:border-0">
      <td colSpan={4} className="px-4 py-3">
        <form action={formAction} className="flex flex-col gap-2.5">
          <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_140px_auto] sm:items-end">
            <Field label="Name" htmlFor={`edit-name-${institution.id}`}>
              <Input id={`edit-name-${institution.id}`} name="name" defaultValue={institution.name} required maxLength={160} />
            </Field>
            <Field label="Code" htmlFor={`edit-code-${institution.id}`}>
              <Input
                id={`edit-code-${institution.id}`}
                name="code"
                defaultValue={institution.code}
                required
                maxLength={20}
                className="font-mono uppercase"
              />
            </Field>
            <div className="flex gap-2">
              <Button type="submit" variant="primary" loading={pending} icon={<LuCheck />}>
                Save
              </Button>
              <Button type="button" variant="ghost" onClick={onCancel} disabled={pending} icon={<LuX />}>
                Cancel
              </Button>
            </div>
          </div>

          {state && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}
        </form>
      </td>
    </tr>
  );
}
