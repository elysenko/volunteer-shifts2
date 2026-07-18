import { z } from 'zod';

/**
 * Partial map of setting key → new value. Only keys in the managed catalog are
 * persisted; blank values are ignored so a save never clears an existing secret.
 */
export const updateSettingsSchema = z.record(z.string());

export type UpdateSettingsDto = z.infer<typeof updateSettingsSchema>;
