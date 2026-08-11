import type { IAppointmentRepository } from "@application/ports/IAppointmentRepository";
import type {
  Appointment,
  CreateAppointmentInput,
  AppointmentSearchParams,
  AppointmentListPage,
} from "@domain/appointment";

export class AppointmentService {
  constructor(private readonly repo: IAppointmentRepository) {}

  async list(params: AppointmentSearchParams): Promise<AppointmentListPage> {
    return this.repo.search(params);
  }

  async getById(id: string): Promise<Appointment | null> {
    return this.repo.getById(id);
  }

  async book(input: CreateAppointmentInput, userId: string): Promise<Appointment> {
    return this.repo.create(input, userId);
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
