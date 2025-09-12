import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, User, UserDocument } from './schemas/user.schema';
import { RegisterDto } from './dto/register-user.dto';
import { LoginDto } from './dto/login-user.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { MailService } from 'src/mail/mail.service';

interface OAuthUserPayload {
  provider: 'google' | 'github';
  providerId: string;
  email?: string;
  name?: string;
  avatar?: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  // Generate 6-digit OTP
  private generateOtp() {
    return crypto.randomInt(100000, 999999).toString();
  }

  // Mock email sender (replace with real nodemailer/sendgrid)
  private async sendOtpEmail(email: string, otp: string) {
    console.log(`Sending OTP ${otp} to ${email}`);
    return this.mailService.sendOtpEmail(email, otp);
  }

  async register(dto: RegisterDto) {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) throw new BadRequestException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 10);

    const otp = this.generateOtp();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    const user = new this.userModel({
      ...dto,
      password: hashed,
      otp,
      otpExpiry,
      lastOtpSent: new Date(),
    });

    await user.save();
    this.sendOtpEmail(user.email, otp);

    return { message: 'OTP sent to email. Please verify.' };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user) throw new BadRequestException('User not found');
    if (user.isVerified) return { message: 'Already verified' };

    if (!user.otp || !user.otpExpiry || user.otpExpiry < new Date()) {
      throw new BadRequestException('OTP expired');
    }

    if (user.otp !== dto.otp) {
      throw new BadRequestException('Invalid OTP');
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    return { message: 'Email verified successfully' };
  }

  async resendOtp(dto: ResendOtpDto) {
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user) throw new BadRequestException('User not found');
    if (user.isVerified) throw new BadRequestException('Already verified');

    const now = new Date();
    if (
      user.lastOtpSent &&
      now.getTime() - user.lastOtpSent.getTime() < 15 * 1000
    ) {
      throw new BadRequestException('Wait 15 seconds before requesting again');
    }

    const otp = this.generateOtp();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    user.lastOtpSent = now;

    await user.save();
    await this.sendOtpEmail(user.email, otp);

    return { message: 'New OTP sent' };
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    if (!user.password) {
      throw new UnauthorizedException(
        'This account was created with Google/GitHub login. Please use that method.',
      );
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    // Generate JWT token
    const token = this.generateToken(user);

    // Return both token and roles
    return {
      access_token: token.access_token,
      roles: user.roles || [],
    };
  }

  async findOrCreateOAuthUser(payload: OAuthUserPayload) {
    const { provider, providerId, email, name, avatar } = payload;

    if (!email) {
      throw new BadRequestException('OAuth provider did not return an email');
    }

    let user = await this.userModel.findOne({
      $or: [{ [`${provider}Id`]: providerId }, { email }],
    });

    if (user) {
      const providerField = provider === 'google' ? 'googleId' : 'githubId';
      if (!user[providerField]) {
        user[providerField] = providerId;
      }
      if (!user.avatar) user.avatar = avatar;
      if (!user.name) user.name = name || 'No Name';
      await user.save();
      return user;
    }

    const newUser = new this.userModel({
      name: name ?? 'No Name',
      email,
      password: null,
      roles: [Role.USER],
      avatar,
      [`${provider}Id`]: providerId,
      isVerified: true,
    });

    await newUser.save();
    return newUser;
  }

  generateToken(user: UserDocument) {
    const payload = { sub: user._id.toString(), roles: user.roles };
    return { access_token: this.jwtService.sign(payload) };
  }
}
