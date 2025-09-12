import * as crypto from 'crypto';

export function generateOTP(length = 6): string {
  return crypto.randomInt(100000, 999999).toString().slice(0, length);
}
