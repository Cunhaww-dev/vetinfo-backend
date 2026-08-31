import { compare, hash } from 'bcryptjs';
import type { HashProvider } from '../domain/hash-provider.ts';

const SALT_ROUNDS = 10;

export class BcryptHashProvider implements HashProvider {
  async hash(plain: string): Promise<string> {
    return hash(plain, SALT_ROUNDS);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return compare(plain, hashed);
  }
}
