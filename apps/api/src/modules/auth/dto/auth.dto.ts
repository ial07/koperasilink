import { IsString, IsPhoneNumber, Length, IsOptional, IsEmail, IsEnum } from "class-validator";

export class RegisterDto {
  @IsString()
  @Length(2, 100)
  name: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @Length(6, 100)
  password: string;

  @IsOptional()
  @IsString()
  villageId?: string;
}

export class LoginDto {
  @IsString()
  phone: string;

  @IsString()
  password: string;
}


