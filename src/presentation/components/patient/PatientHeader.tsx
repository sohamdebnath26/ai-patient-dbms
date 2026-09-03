import {
  Heart,
  AlertTriangle,
  Activity,
  Calendar,
  Clock,
  Pill,
  type ReactNode,
} from "lucide-react";
import { computeAge, initials, statusBadgeClass, formatDate } from "./utils";
import type { PatientStatus } from "@domain/patient";

export interface PatientHeaderData {
  id?: string;
  firstName: string;
  lastName: string;
  dob: string | null;
  gender: string | null;
  bloodGroup: string | null;
  mrn: string;
  status?: PatientStatus;
  primaryDiagnosis?: string | null;
  diseaseSeverity?: string | null;
  assignedDoctor?: string;
}

export interface PatientHeaderProps {
  patient: PatientHeaderData | null;
  showId?: boolean;
  heading?: string;
  subtitle?: string;
  children?: ReactNode;
  allergies?: string[];
  activeMedications?: string[];
  previousSkinCancer?: boolean;
  lastVisit?: string | null;
  nextFollowUp?: string | null;
}

export function PatientHeader({
  patient,
  showId = false,
  heading,
  subtitle,
  children,
  allergies = [],
  activeMedications = [],
  previousSkinCancer = false,
  lastVisit = null,
  nextFollowUp = null,
}: PatientHeaderProps) {
  const fullName = patient ? `${patient.firstName} ${patient.lastName}`.trim() : "";
  const displayName = fullName || heading || "New Patient";
  const age = patient?.dob ? computeAge(patient.dob) : null;
  const avatar = patient ? initials(patient.firstName, patient.lastName) : "NP";

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="bg-brand-50 ring-brand-100 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ring-2">
              <span className="text-brand-600 text-sm font-bold">{avatar}</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">
                  {patient ? `Dr. ${displayName}` : displayName}
                </h1>
                {patient?.status && (
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadgeClass(patient.status)}`}
                  >
                    {patient.status.replace("_", " ")}
                  </span>
                )}
                {subtitle && <span className="text-sm text-gray-500">· {subtitle}</span>}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                {patient?.mrn && <span className="font-mono text-xs">{patient.mrn}</span>}
                {age !== null && <span>{age} yrs</span>}
                {patient?.gender && <span className="capitalize">{patient.gender}</span>}
                {patient?.bloodGroup && <span>{patient.bloodGroup}</span>}
                {patient?.id && showId && (
                  <span className="font-mono text-[10px] text-gray-400">{patient.id}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">{children}</div>
        </div>

        {patient && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {patient.primaryDiagnosis && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                <Activity className="h-3 w-3" />
                {patient.primaryDiagnosis}
                {patient.diseaseSeverity && (
                  <span className="opacity-70">· {patient.diseaseSeverity}</span>
                )}
              </span>
            )}
            {allergies.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                <AlertTriangle className="h-3 w-3" />
                {allergies.length} {allergies.length === 1 ? "allergy" : "allergies"}
              </span>
            )}
            {activeMedications.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                <Pill className="h-3 w-3" />
                {activeMedications.length}{" "}
                {activeMedications.length === 1 ? "medication" : "medications"}
              </span>
            )}
            {previousSkinCancer && (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700">
                <AlertTriangle className="h-3 w-3" />
                Previous skin cancer
              </span>
            )}
            {lastVisit && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2.5 py-1 text-xs text-gray-600">
                <Calendar className="h-3 w-3" />
                Last: {formatDate(lastVisit)}
              </span>
            )}
            {nextFollowUp && (
              <span className="bg-brand-50 text-brand-700 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs">
                <Clock className="h-3 w-3" />
                Follow-up: {formatDate(nextFollowUp)}
              </span>
            )}
          </div>
        )}

        {patient?.assignedDoctor && (
          <div className="mt-2 text-xs text-gray-400">
            <Heart className="mr-1 inline h-3 w-3" />
            {patient.assignedDoctor}
          </div>
        )}
      </div>
    </div>
  );
}
