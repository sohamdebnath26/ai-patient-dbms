import type { IAppointmentRepository } from "@application/ports/IAppointmentRepository";
import type {
  Appointment,
  CreateAppointmentInput,
  AppointmentSearchParams,
  AppointmentListPage,
} from "@domain/appointment";
import type { AuthorizationContext } from "@domain/patient";
import { MissingOrganizationError } from "@domain/patient";

export class AppointmentService {
  constructor(private readonly repo: IAppointmentRepository) {}

  async list(
    params: AppointmentSearchParams,
    auth: AuthorizationContext,
  ): Promise<AppointmentListPage> {
    if (!auth.selectedOrganizationId) {
      throw new MissingOrganizationError();
    }
    return this.repo.search(params, auth);
  }

  async getById(id: string, auth: AuthorizationContext): Promise<Appointment | null> {
    if (!auth.selectedOrganizationId) {
      throw new MissingOrganizationError();
    }
    return this.repo.getById(id, auth);
  }

  async book(input: CreateAppointmentInput, auth: AuthorizationContext): Promise<Appointment> {
    if (!auth.selectedOrganizationId) {
      throw new MissingOrganizationError();
    }
    return this.repo.create(input, auth);
  }

  async reschedule(id: string, date: string, time: string): Promise<Appointment> {
    return this.repo.update(id, { appointment_date: date, appointment_time: time });
  }

  async confirm(id: string, userId: string): Promise<Appointment> {
    return this.repo.updateStatus(id, "confirmed", userId);
  }

  async checkIn(id: string, userId: string): Promise<Appointment> {
    return this.repo.updateStatus(id, "in_progress", userId);
  }

  async cancel(id: string, userId: string): Promise<Appointment> {
    return this.repo.updateStatus(id, "cancelled", userId);
  }

  async markNoShow(id: string, userId: string): Promise<Appointment> {
    return this.repo.updateStatus(id, "no_show", userId);
  }
}
