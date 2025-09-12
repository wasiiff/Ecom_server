import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { AuthService } from './auth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: Function) {
    try {
      const githubId = profile.id;
      // Github sometimes returns email in emails array
      const email = profile.emails?.[0]?.value ?? profile._json?.email;
      const name = profile.displayName || profile.username;
      const avatar = profile.photos?.[0]?.value;

      const user = await this.authService.findOrCreateOAuthUser({
        provider: 'github',
        providerId: githubId,
        email,
        name,
        avatar,
      });

      done(null, user);
    } catch (err) {
      done(err, false);
    }
  }
}
