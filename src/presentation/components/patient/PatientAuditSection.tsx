import { History } from "lucide-react";
import { AuditItem, SectionHeading } from "./helpers";

interface PatientAuditSectionProps {
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  organization?: string;
}

export function PatientAuditSection({
  createdBy,
  createdAt,
  updatedAt,
  updatedBy,
  organization,
}: PatientAuditSectionProps) {
  return (
    <div className="space-y-3">
      <SectionHeading icon={<History className="h-4 w-4" />} title="Audit Information" />
      <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        {organization && <AuditItem label="Organization" value={organization} mono />}
        <AuditItem label="Created By" value={createdBy} mono />
        <AuditItem label="Created On" value={createdAt} />
        <AuditItem label="Last Updated" value={updatedAt} />
        <AuditItem label="Updated By" value={updatedBy} />
      </dl>
    </div>
  );
}
