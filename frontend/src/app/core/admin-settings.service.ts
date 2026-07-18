import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ServiceSetting } from './models';

/** Live REST client for the admin managed-credentials endpoint. */
@Injectable({ providedIn: 'root' })
export class AdminSettingsService {
  private readonly http = inject(HttpClient);

  /** Current managed settings with masked values. */
  list(): Promise<ServiceSetting[]> {
    return firstValueFrom(
      this.http.get<ServiceSetting[]>('/api/admin/settings'),
    );
  }

  /** Persist non-blank overrides; returns the refreshed, masked settings. */
  update(updates: Record<string, string>): Promise<ServiceSetting[]> {
    return firstValueFrom(
      this.http.patch<ServiceSetting[]>('/api/admin/settings', updates),
    );
  }
}
