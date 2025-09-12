import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  password: string;
}
