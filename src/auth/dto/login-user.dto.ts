import { IsEmail, IsOptional } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsOptional()
  password: string;
}
