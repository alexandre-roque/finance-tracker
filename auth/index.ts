import { DrizzleAdapter } from '@auth/drizzle-adapter';
import NextAuth, { User } from 'next-auth';
import { db } from '@/db';

import DiscordProvider from 'next-auth/providers/discord';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';

export const { handlers, signIn, signOut, auth } = NextAuth({
	adapter: DrizzleAdapter(db),
	providers: [
		GitHubProvider({
			clientId: process.env.AUTH_GITHUB_ID!,
			clientSecret: process.env.AUTH_GITHUB_SECRET!,
		}),
		DiscordProvider({
			clientId: process.env.DISCORD_CLIENT_ID!,
			clientSecret: process.env.DISCORD_CLIENT_SECRET!,
		}),
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
		}),
		CredentialsProvider({
			name: 'Credentials',
			credentials: {
				email: {
					label: 'Email',
					type: 'text',
					placeholder: 'Your email',
				},
				password: {
					label: 'Password',
					type: 'password',
					placeholder: 'Your password',
				},
			},
			async authorize(credentials): Promise<User | null> {
				const res = await fetch(`${process.env.NEXTAUTH_URL!}/api/login`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						email: credentials?.email,
						password: credentials?.password,
					}),
				});

				return await res.json();
			},
		}),
	],
	callbacks: {
		async session({ session, token }) {
			if (token.sub && session.user) {
				session.user.id = token.sub;
			}
			return session;
		},
		async jwt({ token, trigger, session }) {
			if (trigger === 'update') {
				if (session?.image) {
					token.picture = session.image;
				}
				if (session?.name) {
					token.name = session.name;
				}
			}

			return token;
		},
	},
	session: { strategy: 'jwt' },
	pages: {
		signIn: '/sign-in',
		signOut: '/sign-out',
		newUser: '/wizard',
	},
});
