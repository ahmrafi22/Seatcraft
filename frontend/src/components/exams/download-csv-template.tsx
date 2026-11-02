"use client";

import { LuDownload } from "react-icons/lu";

import { Button } from "@/components/ui/button";
import type { Institution } from "@/lib/api/types";

/**
 * Generates a filled-in template in the browser, using the tenant's real college
 * codes so the file imports without edits. No round trip and nothing to store.
 */
export function DownloadCsvTemplate({ institutions }: { institutions: Institution[] }) {
  function download() {
    const codes = institutions.map((institution) => institution.code);

    const rows = [
      "roll,name,institutionCode,subjectGroup,dateOfBirth",
      ...Array.from({ length: 5 }, (_, index) => {
        const roll = `R${String(index + 1).padStart(5, "0")}`;
        const code = codes[index % Math.max(1, codes.length)] ?? "C01";
        const group = ["Science", "Commerce", "Arts"][index % 3];
        const dob = `2000-${String((index % 12) + 1).padStart(2, "0")}-${String((index % 28) + 1).padStart(2, "0")}`;

        return `${roll},Candidate ${String(index + 1).padStart(4, "0")},${code},${group},${dob}`;
      })
    ];

    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "seatcraft-candidates-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={download} icon={<LuDownload />} className="w-full">
      Download CSV template
    </Button>
  );
}
