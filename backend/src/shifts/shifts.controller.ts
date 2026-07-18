import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequestUser } from '../auth/jwt';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ShiftsService, ShiftView } from './shifts.service';
import { ShiftInputDto, shiftInputSchema } from './shifts.dto';

@ApiTags('shifts')
@ApiBearerAuth()
@Controller('shifts')
@UseGuards(JwtAuthGuard)
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Get()
  findAll(@CurrentUser() user: RequestUser): Promise<ShiftView[]> {
    return this.shiftsService.findUpcoming(user.userId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<ShiftView> {
    return this.shiftsService.findOne(id, user.userId);
  }

  @Post()
  @UseGuards(AdminGuard)
  create(
    @Body(new ZodValidationPipe(shiftInputSchema)) dto: ShiftInputDto,
  ): Promise<ShiftView> {
    return this.shiftsService.create(dto);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(shiftInputSchema)) dto: ShiftInputDto,
  ): Promise<ShiftView> {
    return this.shiftsService.update(id, dto);
  }

  @Post(':id/signup')
  signUp(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<ShiftView> {
    return this.shiftsService.signUp(id, user.userId);
  }

  @Delete(':id/signup')
  cancelSignUp(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<ShiftView> {
    return this.shiftsService.cancelSignUp(id, user.userId);
  }
}
