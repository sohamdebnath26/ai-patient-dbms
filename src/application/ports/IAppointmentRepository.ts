import type {
  Appointment,
  CreateAppointmentInput,
  AppointmentSearchParams,
  AppointmentListPage,
} from "@domain/appointment";
import type { AuthorizationContext } from "@domain/patient";

export interface IAppointmentRepository {
  search(params: AppointmentSearchParams, auth: AuthorizationContext): Promise<AppointmentListPage>;
  getById(id: string, auth: AuthorizationContext): Promise<Appointment | null>;
  create(input: CreateAppointmentInput, auth: AuthorizationContext): Promise<Appointment>;
  updateStatus(id: string, status: string, userId: string): Promise<Appointment>;
  update(
    id: string,
    input: Partial<{
      appointment_date: string;
      appointment_time: string;
      assigned_to: string;
      reason: string;
      notes: string;
    }>,
  ): Promise<Appointment>;
}
