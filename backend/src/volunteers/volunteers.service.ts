import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface VolunteerShiftRef {
  id: string;
  role: string;
  location: string;
  startsAt: Date;
  hours: number;
}

export interface VolunteerView {
  id: string;
  name: string;
  email: string;
  totalHours: number;
  shifts: VolunteerShiftRef[];
}

@Injectable()
export class VolunteersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Roster of volunteers (USER role) with total signed-up hours. */
  async findAll(): Promise<VolunteerView[]> {
    const users = await this.prisma.user.findMany({
      where: { role: Role.USER },
      orderBy: { name: 'asc' },
      include: {
        signups: {
          orderBy: { shift: { startsAt: 'asc' } },
          include: { shift: true },
        },
      },
    });

    return users.map((user) => {
      const shifts: VolunteerShiftRef[] = user.signups.map((s) => ({
        id: s.shift.id,
        role: s.shift.role,
        location: s.shift.location,
        startsAt: s.shift.startsAt,
        hours: s.shift.hours,
      }));
      const totalHours = shifts.reduce((sum, s) => sum + s.hours, 0);
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        totalHours,
        shifts,
      };
    });
  }
}
