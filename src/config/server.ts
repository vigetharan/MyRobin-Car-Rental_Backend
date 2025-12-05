import { ApolloServer } from '@apollo/server';
import { Context } from '../types/context';

export class ServerConfig {
  public static createApolloServer(typeDefs: any, resolvers: any): ApolloServer<Context> {
    return new ApolloServer<Context>({
      typeDefs,
      resolvers,
      csrfPrevention: true, // ✅ Security: Enabled CSRF protection
    });
  }
}