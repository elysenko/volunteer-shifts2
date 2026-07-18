export type Role = 'ADMIN' | 'USER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface Shift {
  id: string;
  role: string;
  location: string;
  startsAt: string; // ISO datetime
  hours: number;
  capacity: number;
  filled: number; // number of signups
  signedUp: boolean; // caller flag
}

export interface VolunteerShiftRef {
  id: string;
  role: string;
  location: string;
  startsAt: string;
  hours: number;
}

export interface Volunteer {
  id: string;
  name: string;
  email: string;
  totalHours: number;
  shifts: VolunteerShiftRef[];
}

export interface ServiceSetting {
  key: string;
  service: string;
  label: string;
  configured: boolean;
  maskedValue: string;
  placeholder: string;
}
