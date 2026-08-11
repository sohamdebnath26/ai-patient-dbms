import type { Role } from "@domain/profile";
import { ROLE_LABELS } from "@domain/profile";
import { Shield, Stethoscope, Headphones, User, Pill } from "lucide-react";

const roleIcons: Record<Role, React.ReactNode> = {
  admin: <Shield className="h-3.5 w-3.5" />,
  doctor: <Stethoscope className="h-3.5 w-3.5" />,
  receptionist: <Headphones className="h-3.5 w-3.5" />,
  patient: <User className="h-3.5 w-3.5" />,
  pharmacist: <Pill className="h-3.5 w-3.5" />,
};

const roleColors: Record<Role, string> = {
  admin: "bg-purple-50 text-purple-700 border-purple-200",
  doctor: "bg-blue-50 text-blue-700 border-blue-200",
  receptionist: "bg-green-50 text-green-700 border-green-200",
  patient: "bg-gray-50 text-gray-700 border-gray-200",
  pharmacist: "bg-orange-50 text-orange-700 border-orange-200",
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${roleColors[role]}`}
    >
      {roleIcons[role]}
      {ROLE_LABELS[role]}
    </span>
  );
}
