import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
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

  // profile contains user info returned by Google
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    try {
      const email = profile.emails?.[0]?.value;
      const googleId = profile.id;
      const name = profile.displayName;
      const avatar = profile.photos?.[0]?.value;

      // find or create user in DB
      const user = await this.authService.findOrCreateOAuthUser({
        provider: 'google',
        providerId: googleId,
        email,
        name,
        avatar,
      });

      // return user (Passport will attach to request)
      done(null, user);
    } catch (err) {
      done(err, false);
    }
  }
}
