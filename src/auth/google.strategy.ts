import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    try {
      const email = profile.emails?.[0]?.value ?? null;
      if (!email) {
        throw new BadRequestException('No email returned from Google');
      }

      const googleId = profile.id;
      const name = profile.displayName ?? profile.name?.givenName ?? 'No Name';
      const avatar = profile.photos?.[0]?.value ?? null;

      return this.authService.findOrCreateOAuthUser({
        provider: 'google',
        providerId: googleId,
        email,
        name,
        avatar,
      });
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException('Google OAuth failed');
    }
  }
}
