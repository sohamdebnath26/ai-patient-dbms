import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import type { DiagnosticReport } from "@domain/chat";

interface DiagnosticReportCardProps {
  report: DiagnosticReport;
}

export function DiagnosticReportCard({ report }: DiagnosticReportCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const visibleSections = expanded ? report.sections : report.sections.slice(0, 2);
  const hiddenCount = report.sections.length - visibleSections.length;

  async function handleCopy() {
    const text = [
      `# ${report.title}`,
      `Patient: ${report.patientName}`,
      `Generated: ${new Date(report.generatedAt).toLocaleString()}`,
      `Focus: ${report.focusPrompt}`,
      "",
      "## Summary",
      report.summary,
      "",
      ...report.sections.map((s) => `## ${s.heading}\n${s.body}`),
      "",
      report.disclaimer,
    ].join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      // clipboard may be unavailable in some browsers
    }
  }

  return (
    <div className="rounded-md border border-gray-200 bg-white">
      <div className="flex items-start justify-between gap-2 border-b border-gray-100 p-3">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold text-gray-900">{report.title}</h4>
          <p className="mt-0.5 text-[11px] text-gray-500">
            {new Date(report.generatedAt).toLocaleString()}
          </p>
        </div>
        <button
          onClick={() => {
            void handleCopy();
          }}
          className="hover:bg-surface-100 flex items-center gap-1 rounded-md p-1.5 text-gray-500"
          title="Copy report"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      <div className="space-y-3 p-3">
        <div>
          <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
            Summary
          </p>
          <p className="mt-1 text-xs leading-relaxed text-gray-700">{report.summary}</p>
        </div>

        {visibleSections.map((section, i) => (
          <div key={`${section.heading}-${i}`}>
            <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
              {section.heading}
            </p>
            <p className="mt-1 text-xs leading-relaxed whitespace-pre-line text-gray-700">
              {section.body}
            </p>
          </div>
        ))}

        {hiddenCount > 0 && (
          <button
            onClick={() => {
              setExpanded((v) => !v);
            }}
            className="text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 text-xs font-medium"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3 w-3" /> Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" /> Show {hiddenCount} more section
                {hiddenCount === 1 ? "" : "s"}
              </>
            )}
          </button>
        )}

        {report.citations.length > 0 && (
          <div className="border-t border-gray-100 pt-2">
            <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
              Sources
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {report.citations.map((c, i) => (
                <span
                  key={`${c.source}-${i}`}
                  className="bg-surface-100 rounded-full px-2 py-0.5 text-[10px] text-gray-600"
                >
                  {c.label}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="text-[10px] text-gray-400 italic">{report.disclaimer}</p>
      </div>
    </div>
  );
}
