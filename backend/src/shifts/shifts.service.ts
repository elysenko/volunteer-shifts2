import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ShiftInputDto } from './shifts.dto';

/** Shift shape returned to the client, including computed fields. */
export interface ShiftView {
  id: string;
  role: string;
  location: string;
  startsAt: Date;
  hours: number;
  capacity: number;
  filled: number;
  signedUp: boolean;
}

type ShiftWithCount = Prisma.ShiftGetPayload<{
  include: { _count: { select: { signups: true } } };
}>;

@Injectable()
export class ShiftsService {
  constructor(private readonly prisma: PrismaService) {}

  private toView(shift: ShiftWithCount, signedUp: boolean): ShiftView {
    return {
      id: shift.id,
      role: shift.role,
      location: shift.location,
      startsAt: shift.startsAt,
      hours: shift.hours,
      capacity: shift.capacity,
      filled: shift._count.signups,
      signedUp,
    };
  }

  /** Upcoming shifts (startsAt >= now), ordered soonest first. */
  async findUpcoming(userId: string): Promise<ShiftView[]> {
    const now = new Date();
    const shifts = await this.prisma.shift.findMany({
      where: { startsAt: { gte: now } },
      orderBy: { startsAt: 'asc' },
      include: { _count: { select: { signups: true } } },
    });
    const mySignups = await this.prisma.signup.findMany({
      where: { userId, shiftId: { in: shifts.map((s) => s.id) } },
      select: { shiftId: true },
    });
    const mine = new Set(mySignups.map((s) => s.shiftId));
    return shifts.map((s) => this.toView(s, mine.has(s.id)));
  }

  /** Shifts the caller is signed up for, ordered soonest first. */
  async findMine(userId: string): Promise<ShiftView[]> {
    const signups = await this.prisma.signup.findMany({
      where: { userId },
      orderBy: { shift: { startsAt: 'asc' } },
      include: {
        shift: { include: { _count: { select: { signups: true } } } },
      },
    });
    return signups.map((s) => this.toView(s.shift, true));
  }

  async findOne(id: string, userId: string): Promise<ShiftView> {
    const shift = await this.prisma.shift.findUnique({
      where: { id },
      include: { _count: { select: { signups: true } } },
    });
    if (!shift) {
      throw new NotFoundException('Shift not found');
    }
    const signup = await this.prisma.signup.findUnique({
      where: { userId_shiftId: { userId, shiftId: id } },
    });
    return this.toView(shift, signup !== null);
  }

  async create(dto: ShiftInputDto): Promise<ShiftView> {
    const shift = await this.prisma.shift.create({
      data: dto,
      include: { _count: { select: { signups: true } } },
    });
    return this.toView(shift, false);
  }

  async update(id: string, dto: ShiftInputDto): Promise<ShiftView> {
    await this.ensureExists(id);
    const shift = await this.prisma.shift.update({
      where: { id },
      data: dto,
      include: { _count: { select: { signups: true } } },
    });
    return this.toView(shift, false);
  }

  /**
   * Sign the caller up. Runs inside a transaction that re-checks capacity to
   * guard against two volunteers racing for the last open slot. The unique
   * constraint on (userId, shiftId) is the final backstop against duplicates.
   */
  async signUp(id: string, userId: string): Promise<ShiftView> {
    await this.prisma.$transaction(async (tx) => {
      const shift = await tx.shift.findUnique({
        where: { id },
        include: { _count: { select: { signups: true } } },
      });
      if (!shift) {
        throw new NotFoundException('Shift not found');
      }
      const existing = await tx.signup.findUnique({
        where: { userId_shiftId: { userId, shiftId: id } },
      });
      if (existing) {
        throw new ConflictException('You are already signed up for this shift');
      }
      if (shift._count.signups >= shift.capacity) {
        throw new ConflictException('This shift is already full');
      }
      await tx.signup.create({ data: { userId, shiftId: id } });
    });
    return this.findOne(id, userId);
  }

  /** Cancel the caller's signup for a shift. */
  async cancelSignUp(id: string, userId: string): Promise<ShiftView> {
    const existing = await this.prisma.signup.findUnique({
      where: { userId_shiftId: { userId, shiftId: id } },
    });
    if (!existing) {
      throw new NotFoundException('You are not signed up for this shift');
    }
    await this.prisma.signup.delete({
      where: { userId_shiftId: { userId, shiftId: id } },
    });
    return this.findOne(id, userId);
  }

  private async ensureExists(id: string): Promise<void> {
    const count = await this.prisma.shift.count({ where: { id } });
    if (count === 0) {
      throw new NotFoundException('Shift not found');
    }
  }
}
