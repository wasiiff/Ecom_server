import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { MailModule } from 'src/mail/mail.module';
import { GoogleStrategy } from './google.strategy';
import { GithubStrategy } from './github.strategy';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'supersecretkey',
      signOptions: { expiresIn: '1d' },
    }),
    MailModule,
  ],
  providers: [AuthService, JwtStrategy, GoogleStrategy, GithubStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
