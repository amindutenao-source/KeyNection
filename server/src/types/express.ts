import type { User } from './index';
import type 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    user?: Omit<User, 'password'>;
  }
}
