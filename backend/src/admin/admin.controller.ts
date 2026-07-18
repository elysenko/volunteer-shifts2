import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AdminService, ServiceSettingView } from './admin.service';
import { UpdateSettingsDto, updateSettingsSchema } from './admin.dto';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin/settings')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  getSettings(): Promise<ServiceSettingView[]> {
    return this.adminService.getSettings();
  }

  @Patch()
  updateSettings(
    @Body(new ZodValidationPipe(updateSettingsSchema))
    body: UpdateSettingsDto,
  ): Promise<ServiceSettingView[]> {
    return this.adminService.updateSettings(body);
  }
}
