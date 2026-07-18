import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    // Connect eagerly so the first request is fast, but never let a transient
    // database outage crash bootstrap — otherwise `app.listen()` never runs and
    // the DB-independent `/health` liveness probe becomes unreachable too.
    // Prisma reconnects lazily on the next query once the DB is back.
    try {
      await this.$connect();
    } catch (error) {
      this.logger.warn(
        `Initial database connection failed; continuing so liveness stays up. ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
