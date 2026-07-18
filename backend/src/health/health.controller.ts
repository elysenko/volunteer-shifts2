import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

interface HealthStatus {
  status: 'ok';
}

interface DeepHealthStatus {
  status: 'ok' | 'error';
  db: 'up' | 'down';
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** Liveness — process is up and serving. */
  @Get()
  check(): HealthStatus {
    return { status: 'ok' };
  }

  /** Readiness — also verifies the database is reachable. */
  @Get('deep')
  async deep(): Promise<DeepHealthStatus> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', db: 'up' };
    } catch {
      throw new ServiceUnavailableException({ status: 'error', db: 'down' });
    }
  }
}
