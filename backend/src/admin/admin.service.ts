import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './admin.dto';

/** Shape consumed by the frontend admin-settings page. */
export interface ServiceSettingView {
  key: string;
  service: string;
  label: string;
  configured: boolean;
  maskedValue: string;
  placeholder: string;
}

interface SettingDef {
  key: string;
  service: string;
  label: string;
  placeholder: string;
  /** Environment variable that provides the value when nothing is stored. */
  envFallback?: string;
}

/**
 * Managed backing-service credentials. Values injected via the single-namespace
 * `infra-secrets` env are shown as configured; overrides are persisted in the
 * `SystemSetting` table. Never echo raw secrets back to the client — mask them.
 */
const CATALOG: SettingDef[] = [
  {
    key: 'DATABASE_URL',
    service: 'PostgreSQL',
    label: 'Connection string',
    placeholder: 'postgres://user:password@host:5432/dbname',
    envFallback: 'DATABASE_URL',
  },
  {
    key: 'MINIO_ENDPOINT',
    service: 'MinIO',
    label: 'Endpoint URL',
    placeholder: 'https://minio.internal:9000',
    envFallback: 'MINIO_ENDPOINT',
  },
  {
    key: 'MINIO_ACCESS_KEY',
    service: 'MinIO',
    label: 'Access key',
    placeholder: 'AKIA…',
    envFallback: 'MINIO_ACCESS_KEY',
  },
  {
    key: 'MINIO_SECRET_KEY',
    service: 'MinIO',
    label: 'Secret key',
    placeholder: '••••••••',
    envFallback: 'MINIO_SECRET_KEY',
  },
];

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /** Current managed settings with masked values (never the raw secret). */
  async getSettings(): Promise<ServiceSettingView[]> {
    const stored = await this.loadStored();
    return CATALOG.map((def) => this.toView(def, stored.get(def.key)));
  }

  /** Persist non-blank overrides for known keys, then return the fresh view. */
  async updateSettings(
    updates: UpdateSettingsDto,
  ): Promise<ServiceSettingView[]> {
    const allowed = new Set(CATALOG.map((d) => d.key));
    for (const [key, rawValue] of Object.entries(updates)) {
      if (!allowed.has(key)) continue;
      const value = (rawValue ?? '').trim();
      if (!value) continue;
      await this.prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }
    return this.getSettings();
  }

  private async loadStored(): Promise<Map<string, string>> {
    const rows = await this.prisma.systemSetting.findMany();
    return new Map(rows.map((r) => [r.key, r.value]));
  }

  private toView(def: SettingDef, storedValue?: string): ServiceSettingView {
    const raw =
      storedValue ?? (def.envFallback ? process.env[def.envFallback] : undefined);
    const value = (raw ?? '').trim();
    const configured = value.length > 0;
    return {
      key: def.key,
      service: def.service,
      label: def.label,
      placeholder: def.placeholder,
      configured,
      maskedValue: configured ? this.mask(value) : '',
    };
  }

  private mask(value: string): string {
    if (value.length <= 4) return '••••';
    return `${value.slice(0, 4)}${'·'.repeat(6)}${value.slice(-2)}`;
  }
}
