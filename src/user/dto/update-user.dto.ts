import { IsArray, IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { Role } from '../../auth/schemas/user.schema';

export class UpdateUserDto {
  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true })
  roles?: Role[];

  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;
}
