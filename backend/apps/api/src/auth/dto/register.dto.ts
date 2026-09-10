import { IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString({ message: 'El usuario debe ser texto' })
  @MinLength(3, { message: 'El usuario debe tener al menos 3 caracteres' })
  username!: string;

  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password!: string;
}
