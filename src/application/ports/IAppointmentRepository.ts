import type {
  Appointment,
  CreateAppointmentInput,
  AppointmentSearchParams,
  AppointmentListPage,
} from "@domain/appointment";

export interface IAppointmentRepository {
  search(params: AppointmentSearchParams): Promise<AppointmentListPage>;
  getById(id: string): Promise<Appointment | null>;
  create(input: CreateAppointmentInput, userId: string): Promise<Appointment>;
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
