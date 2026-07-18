import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Volunteer } from './models';

/** Live REST client for the admin volunteer roster endpoint. */
@Injectable({ providedIn: 'root' })
export class VolunteersService {
  private readonly http = inject(HttpClient);

  /** Roster of USER-role volunteers with total hours and their shifts. */
  list(): Promise<Volunteer[]> {
    return firstValueFrom(this.http.get<Volunteer[]>('/api/volunteers'));
  }
}
