import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/auth/schemas/user.schema';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('read') read?: string,
  ) {
    return this.notificationsService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      read: typeof read === 'string' ? read === 'true' : undefined,
    });
  }

  @Get('unread-count')
  unreadCount() {
    return this.notificationsService.unreadCount();
  }

  @Patch('mark-all-read')
  markAllRead() {
    return this.notificationsService.markAllRead();
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string) {
    return this.notificationsService.markRead(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.notificationsService.delete(id);
  }
}