import { z } from 'zod';

export const shiftInputSchema = z.object({
  role: z.string().trim().min(1, 'Role is required').max(120),
  location: z.string().trim().min(1, 'Location is required').max(200),
  startsAt: z.coerce.date({
    errorMap: () => ({ message: 'A valid start date/time is required' }),
  }),
  hours: z.coerce.number().positive('Hours must be greater than zero').max(24),
  capacity: z.coerce
    .number()
    .int('Capacity must be a whole number')
    .positive('Capacity must be at least 1'),
});

export type ShiftInputDto = z.infer<typeof shiftInputSchema>;
