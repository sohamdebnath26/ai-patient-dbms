import { CollapsibleSection } from "../CollapsibleSection";
import { History } from "lucide-react";
import { AuditItem } from "./helpers";

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
    <CollapsibleSection title="Audit Information" icon={<History className="h-4 w-4" />}>
      <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        {organization && <AuditItem label="Organization" value={organization} mono />}
        <AuditItem label="Created By" value={createdBy} mono />
        <AuditItem label="Created On" value={createdAt} />
        <AuditItem label="Last Updated" value={updatedAt} />
        <AuditItem label="Updated By" value={updatedBy} />
      </dl>
    </CollapsibleSection>
  );
}
