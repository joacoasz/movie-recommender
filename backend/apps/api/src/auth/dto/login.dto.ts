import { IsString } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'El usuario debe ser texto' })
  username!: string;

  @IsString({ message: 'La contraseña debe ser texto' })
  password!: string;
}
