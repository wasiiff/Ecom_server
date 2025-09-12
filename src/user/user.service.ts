import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument, Role } from "../auth/schemas/user.schema";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findAll(): Promise<User[]> {
    return this.userModel.find().select("-password"); // hide password
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select("-password");
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(id, dto, { new: true });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async blockUser(id: string): Promise<User> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException("User not found");

    user.isBlocked = true;
    return user.save();
  }

  async unblockUser(id: string): Promise<User> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException("User not found");

    user.isBlocked = false;
    return user.save();
  }

  async updateRole(id: string, role: Role): Promise<User> {
    if (!Object.values(Role).includes(role)) {
      throw new BadRequestException("Invalid role");
    }
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException("User not found");

    user.roles = [role];
    return user.save();
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException("User not found");
  }
}
