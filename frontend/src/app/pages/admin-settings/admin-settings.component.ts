import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavBarComponent } from '../../components/nav-bar/nav-bar.component';
import { ServiceSetting } from '../../core/models';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [FormsModule, NavBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.css',
})
export class AdminSettingsComponent {
  loading = signal(false);
  error = signal<string | null>(null);
  saved = signal(false);

  // Managed service credentials — signal per the data contract.
  settings = signal<ServiceSetting[]>([
    {
      key: 'DATABASE_URL',
      service: 'PostgreSQL',
      label: 'Connection string',
      configured: true,
      maskedValue: 'postgres://····@db.internal:5432/shifthands',
      placeholder: 'postgres://user:password@host:5432/dbname',
    },
    {
      key: 'MINIO_ENDPOINT',
      service: 'MinIO',
      label: 'Endpoint URL',
      configured: false,
      maskedValue: '',
      placeholder: 'https://minio.internal:9000',
    },
    {
      key: 'MINIO_ACCESS_KEY',
      service: 'MinIO',
      label: 'Access key',
      configured: false,
      maskedValue: '',
      placeholder: 'AKIA…',
    },
    {
      key: 'MINIO_SECRET_KEY',
      service: 'MinIO',
      label: 'Secret key',
      configured: false,
      maskedValue: '',
      placeholder: '••••••••',
    },
  ]);

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

  draftValue(key: string): string {
    return this.drafts[key] ?? '';
  }

  setDraft(key: string, value: string): void {
    this.drafts = { ...this.drafts, [key]: value };
  }

  saveService(name: string): void {
    this.settings.update((list) =>
      list.map((s) => {
        if (s.service !== name) {
          return s;
        }
        const draft = this.drafts[s.key];
        if (draft && draft.trim()) {
          return {
            ...s,
            configured: true,
            maskedValue: this.mask(draft.trim()),
          };
        }
        return s;
      }),
    );
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 2500);
  }

  private mask(value: string): string {
    if (value.length <= 4) {
      return '••••';
    }
    return `${value.slice(0, 4)}${'·'.repeat(6)}${value.slice(-2)}`;
  }
}
