import * as argon2 from 'argon2';

export async function hashPassword(password: string): Promise<string> {
  try {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 5,
      parallelism: 1,
    });
  } catch {
    throw new Error('Error while hashing password');
  }
}

export async function verifyHash(password: string, hashedPassword: string): Promise<boolean> {
  try {
    return await argon2.verify(hashedPassword, password);
  } catch {
    throw new Error('Error while verifying password');
  }
}
