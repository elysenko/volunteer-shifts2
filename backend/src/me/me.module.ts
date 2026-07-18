import { Module } from '@nestjs/common';
import { ShiftsModule } from '../shifts/shifts.module';
import { MeController } from './me.controller';

@Module({
  imports: [ShiftsModule],
  controllers: [MeController],
})
export class MeModule {}
