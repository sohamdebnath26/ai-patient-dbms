import { useState } from "react";
import type { LabReport, LabReportInput } from "@domain/patient";
import { FlaskConical, Plus, Trash2 } from "lucide-react";
import { SectionHeading } from "./helpers";
import { inputClass, labelClass, formatDate } from "./utils";

interface LabReportsSectionProps {
  reports: LabReport[];
  onAdd?: (input: LabReportInput) => void;
  onRemove?: (id: string) => void;
}

export function LabReportsSection({ reports, onAdd, onRemove }: LabReportsSectionProps) {
  const [name, setName] = useState("");

  function handleAdd() {
    if (!name.trim() || !onAdd) return;
    onAdd({ test_name: name.trim() });
    setName("");
  }

  return (
    <div className="space-y-3">
      <SectionHeading
        icon={<FlaskConical className="h-4 w-4" />}
        title="Laboratory Reports"
        badge={
          reports.length > 0 ? (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {reports.length}
            </span>
          ) : undefined
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
              <th className="px-2 py-2 font-medium">Report Name</th>
              <th className="px-2 py-2 font-medium">Date</th>
              <th className="px-2 py-2 font-medium">Status</th>
              <th className="px-2 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reports.map((report) => (
              <tr key={report.id}>
                <td className="px-2 py-2 font-medium text-gray-900">{report.test_name}</td>
                <td className="px-2 py-2 text-gray-600">{formatDate(report.report_date)}</td>
                <td className="px-2 py-2">
                  <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 capitalize">
                    {report.status}
                  </span>
                </td>
                <td className="px-2 py-2 text-right">
                  {onRemove ? (
                    <button
                      type="button"
                      onClick={() => {
                        onRemove(report.id);
                      }}
                      className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      View
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td colSpan={4} className="px-2 py-4 text-center text-gray-400">
                  No laboratory reports.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {onAdd && (
        <div className="mt-4 flex items-end gap-2">
          <div className="min-w-[200px] flex-1">
            <label className={labelClass}>Report Name</label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
              placeholder="e.g. Skin Biopsy, CBC"
              className={inputClass}
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!name.trim()}
            className="bg-brand-600 hover:bg-brand-700 inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add Report
          </button>
        </div>
      )}
    </div>
  );
}
