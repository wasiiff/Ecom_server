import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { AuthService } from './auth.service';

// If your TS config doesn't include DOM lib, let TS know `fetch` exists.
// On Node 18+ fetch is global. If you're on Node < 18 install node-fetch instead.
declare const fetch: any;

interface GithubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility?: string | null;
}

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

  async validate(accessToken: string, refreshToken: string, profile: any) {
    try {
      let email = profile.emails?.[0]?.value ?? profile._json?.email ?? null;

      // If email missing, fetch from GitHub /user/emails
      if (!email) {
        const response = await fetch('https://api.github.com/user/emails', {
          headers: { Authorization: `token ${accessToken}`, Accept: 'application/vnd.github.v3+json' },
        });

        if (!response.ok) {
          throw new BadRequestException('Could not fetch GitHub emails');
        }

        const emails = (await response.json()) as GithubEmail[];

        if (!Array.isArray(emails) || emails.length === 0) {
          throw new BadRequestException('No emails returned from GitHub');
        }

        const primary = emails.find((e) => e.primary && e.verified);
        email = primary?.email ?? emails[0]?.email ?? null;
      }

      if (!email) {
        throw new BadRequestException('No email found from GitHub account');
      }

      const githubId = profile.id;
      const name = profile.displayName || profile.username || 'No Name';
      const avatar = profile.photos?.[0]?.value ?? null;

      return this.authService.findOrCreateOAuthUser({
        provider: 'github',
        providerId: githubId,
        email,
        name,
        avatar,
      });
    } catch (err) {
      // Re-throw Nest-friendly errors or wrap unknown errors
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException('GitHub OAuth failed');
    }
  }
}
