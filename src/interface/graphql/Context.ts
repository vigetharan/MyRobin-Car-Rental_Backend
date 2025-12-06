import { AuthenticatedUser } from '../../domain/user/User';

export interface Context {
  user: AuthenticatedUser | null;
}
