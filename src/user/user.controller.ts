import {
  Controller,
  Get,
  Param,
  Delete,
  Patch,
  Body,
  Req,
  UseGuards,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { Role } from "../auth/schemas/user.schema";
import { AuthGuard } from "@nestjs/passport";

@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll() {
    return this.userService.findAll();
  }

  // ✅ New dedicated route for current user
  @UseGuards(AuthGuard("jwt"))
  @Get("me")
  async getMe(@Req() req) {
    return this.userService.findById(req.user._id);
  }

  @UseGuards(AuthGuard("jwt"))
  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.userService.findById(id);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Patch(":id/block")
  async block(@Param("id") id: string) {
    return this.userService.blockUser(id);
  }

  @Patch(":id/unblock")
  async unblock(@Param("id") id: string) {
    return this.userService.unblockUser(id);
  }

  @Patch(":id/role")
  async updateRole(@Param("id") id: string, @Body("role") role: Role) {
    return this.userService.updateRole(id, role);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.userService.remove(id);
  }
}
