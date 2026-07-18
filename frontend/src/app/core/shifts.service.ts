import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Shift } from './models';

/** Payload for creating or editing a shift (admin only). */
export interface ShiftInput {
  role: string;
  location: string;
  startsAt: string;
  hours: number;
  capacity: number;
}

/**
 * Live REST client for the NestJS shift + signup endpoints under `/api`.
 * The auth interceptor attaches the Bearer token, so calls here stay lean.
 */
@Injectable({ providedIn: 'root' })
export class ShiftsService {
  private readonly http = inject(HttpClient);

  /** Upcoming shifts with computed openSlots/signedUp for the caller. */
  list(): Promise<Shift[]> {
    return firstValueFrom(this.http.get<Shift[]>('/api/shifts'));
  }

  /** Single shift detail. */
  get(id: string): Promise<Shift> {
    return firstValueFrom(this.http.get<Shift>(`/api/shifts/${id}`));
  }

  /** Shifts the signed-in volunteer has joined. */
  mine(): Promise<Shift[]> {
    return firstValueFrom(this.http.get<Shift[]>('/api/me/shifts'));
  }

  /** Create a shift (admin). */
  create(input: ShiftInput): Promise<Shift> {
    return firstValueFrom(this.http.post<Shift>('/api/shifts', input));
  }

  /** Edit a shift (admin). */
  update(id: string, input: ShiftInput): Promise<Shift> {
    return firstValueFrom(this.http.put<Shift>(`/api/shifts/${id}`, input));
  }

  /** Sign the caller up for a shift. */
  signUp(id: string): Promise<Shift> {
    return firstValueFrom(
      this.http.post<Shift>(`/api/shifts/${id}/signup`, {}),
    );
  }

  /** Cancel the caller's signup for a shift. */
  cancelSignUp(id: string): Promise<Shift> {
    return firstValueFrom(this.http.delete<Shift>(`/api/shifts/${id}/signup`));
  }
}
