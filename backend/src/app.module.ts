import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ShiftsModule } from './shifts/shifts.module';
import { MeModule } from './me/me.module';
import { VolunteersModule } from './volunteers/volunteers.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ShiftsModule,
    MeModule,
    VolunteersModule,
    HealthModule,
  ],
})
export class AppModule {}
