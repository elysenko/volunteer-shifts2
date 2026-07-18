import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequestUser } from '../auth/jwt';
import { ShiftsService, ShiftView } from '../shifts/shifts.service';

@ApiTags('me')
@ApiBearerAuth()
@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Get('shifts')
  myShifts(@CurrentUser() user: RequestUser): Promise<ShiftView[]> {
    return this.shiftsService.findMine(user.userId);
  }
}
