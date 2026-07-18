import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavBarComponent } from '../../components/nav-bar/nav-bar.component';
import { ServiceSetting } from '../../core/models';
import { AdminSettingsService } from '../../core/admin-settings.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [FormsModule, NavBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.css',
})
export class AdminSettingsComponent implements OnInit {
  private readonly api = inject(AdminSettingsService);

  loading = signal(false);
  error = signal<string | null>(null);
  saved = signal(false);

  // Managed service credentials, loaded live from the backend.
  settings = signal<ServiceSetting[]>([]);

  drafts: Record<string, string> = {};

  readonly services = computed(() => {
    const groups = new Map<string, ServiceSetting[]>();
    for (const s of this.settings()) {
      const list = groups.get(s.service) ?? [];
      list.push(s);
      groups.set(s.service, list);
    }
    return Array.from(groups, ([name, keys]) => ({
      name,
      keys,
      configured: keys.every((k) => k.configured),
    }));
  });

  readonly hasUnconfigured = computed(() =>
    this.settings().some((s) => !s.configured),
  );

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.settings.set(await this.api.list());
    } catch {
      this.error.set('Failed to load settings.');
    } finally {
      this.loading.set(false);
    }
  }

  draftValue(key: string): string {
    return this.drafts[key] ?? '';
  }

  setDraft(key: string, value: string): void {
    this.drafts = { ...this.drafts, [key]: value };
  }

  async saveService(name: string): Promise<void> {
    const updates: Record<string, string> = {};
    for (const s of this.settings()) {
      if (s.service !== name) continue;
      const draft = this.drafts[s.key];
      if (draft && draft.trim()) {
        updates[s.key] = draft.trim();
      }
    }
    if (Object.keys(updates).length === 0) {
      return;
    }
    this.error.set(null);
    try {
      this.settings.set(await this.api.update(updates));
      this.drafts = {};
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 2500);
    } catch {
      this.error.set('Failed to save credentials.');
    }
  }
}
