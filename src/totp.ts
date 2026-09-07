import * as OTPAuth from "otpauth";

export function generateTotp(secret: string, label: string): string {
  const totp = new OTPAuth.TOTP({
    issuer: "Microsoft",
    label,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });
  return totp.generate();
}
