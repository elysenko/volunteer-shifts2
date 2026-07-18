import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { VolunteersService, VolunteerView } from './volunteers.service';

@ApiTags('volunteers')
@ApiBearerAuth()
@Controller('volunteers')
@UseGuards(JwtAuthGuard, AdminGuard)
export class VolunteersController {
  constructor(private readonly volunteersService: VolunteersService) {}

  @Get()
  findAll(): Promise<VolunteerView[]> {
    return this.volunteersService.findAll();
  }
}
