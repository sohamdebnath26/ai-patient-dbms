import type { IAppointmentRepository } from "@application/ports/IAppointmentRepository";
import type {
  Appointment,
  CreateAppointmentInput,
  AppointmentSearchParams,
  AppointmentListPage,
} from "@domain/appointment";
import { APPOINTMENT_STATUS } from "@domain/appointment";
import type { AuthorizationContext } from "@domain/patient";

export class AppointmentService {
  constructor(private readonly repo: IAppointmentRepository) {}

  async list(
    params: AppointmentSearchParams,
    auth: AuthorizationContext,
  ): Promise<AppointmentListPage> {
    return this.repo.search(params, auth);
  }

  async getById(id: string, auth: AuthorizationContext): Promise<Appointment | null> {
    return this.repo.getById(id, auth);
  }

  async book(input: CreateAppointmentInput, auth: AuthorizationContext): Promise<Appointment> {
    return this.repo.create(input, auth);
  }

  async reschedule(
    id: string,
    date: string,
    time: string,
    auth: AuthorizationContext,
  ): Promise<Appointment> {
    return this.repo.update(id, { appointment_date: date, appointment_time: time }, auth);
  }

  async confirm(id: string, userId: string, auth: AuthorizationContext): Promise<Appointment> {
    return this.repo.updateStatus(id, APPOINTMENT_STATUS.confirmed, userId, auth);
  }

  async checkIn(id: string, userId: string, auth: AuthorizationContext): Promise<Appointment> {
    return this.repo.updateStatus(id, APPOINTMENT_STATUS.in_progress, userId, auth);
  }

  async cancel(id: string, userId: string, auth: AuthorizationContext): Promise<Appointment> {
    return this.repo.updateStatus(id, APPOINTMENT_STATUS.cancelled, userId, auth);
  }

  async markNoShow(id: string, userId: string, auth: AuthorizationContext): Promise<Appointment> {
    return this.repo.updateStatus(id, APPOINTMENT_STATUS.no_show, userId, auth);
  }

  async completeAppointment(
    id: string,
    userId: string,
    auth: AuthorizationContext,
  ): Promise<Appointment> {
    return this.repo.updateStatus(id, APPOINTMENT_STATUS.completed, userId, auth);
  }

  async delete(id: string, auth: AuthorizationContext): Promise<void> {
    return this.repo.delete(id, auth);
  }
}
