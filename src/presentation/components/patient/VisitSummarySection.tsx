import { CalendarDays } from "lucide-react";
import { AppointmentStat, SectionHeading } from "./helpers";
import { formatDate } from "./utils";

interface VisitSummarySectionProps {
  lastVisitDate: string | null;
  nextFollowUpDate: string | null;
  totalVisits: number;
  assignedDoctor: string;
}

export function VisitSummarySection({
  lastVisitDate,
  nextFollowUpDate,
  totalVisits,
  assignedDoctor,
}: VisitSummarySectionProps) {
  return (
    <div className="space-y-3">
      <SectionHeading icon={<CalendarDays className="h-4 w-4" />} title="Visit Summary" />
      <div className="grid gap-4 sm:grid-cols-4">
        <AppointmentStat
          label="Last Visit Date"
          value={lastVisitDate ? formatDate(lastVisitDate) : "—"}
        />
        <AppointmentStat
          label="Next Follow-up Date"
          value={nextFollowUpDate ? formatDate(nextFollowUpDate) : "—"}
        />
        <AppointmentStat label="Total Visits" value={String(totalVisits)} />
        <AppointmentStat label="Assigned Doctor" value={assignedDoctor} />
      </div>
    </div>
  );
}
