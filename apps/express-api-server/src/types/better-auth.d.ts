/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Module declaration for @pluteojs/better-auth.
 * Overrides the package's .d.ts to avoid cascading type errors
 * from better-auth's broken Zod v4 type re-exports.
 */
declare module "@pluteojs/better-auth" {
	export const auth: {
		handler: (request: Request) => Promise<Response>;
		api: Record<string, any>;
		options: Record<string, any>;
	};
	export type Auth = typeof auth;

	export const config: any;
	export function isEndpointAllowed(
		path: string,
		method: string,
		customAllowlist?: Record<string, string[]>
	): boolean;
	export const defaultAllowedEndpoints: Record<string, string[]>;
	export type EnvConfig = any;

	export const accessControl: any;
	export const roles: any;

	export function configureEmailHandlers(handlerConfig: {
		sender: (options: iEmailSendOptions) => Promise<void>;
		logger?: any;
		fromAddress: string;
		appName?: string;
	}): void;

	export interface iEmailSendOptions {
		from: string;
		to: string;
		subject: string;
		html: string;
		text?: string;
		metadata?: Record<string, unknown>;
	}
	export type EmailSenderFn = (options: iEmailSendOptions) => Promise<void>;
	export type iEmailLogger = any;

	export interface ExtendedUser {
		id: string;
		email: string;
		emailVerified: boolean;
		name: string;
		createdAt: Date;
		updatedAt: Date;
		image?: string | null;
	}

	export interface ExtendedSession {
		id: string;
		userId: string;
		expiresAt: Date;
		token: string;
		createdAt: Date;
		updatedAt: Date;
		ipAddress?: string | null;
		userAgent?: string | null;
		activeOrganizationId?: string | null;
		activeTeamId?: string | null;
	}

	export interface AuthSession {
		user: ExtendedUser;
		session: ExtendedSession;
	}

	export interface OrganizationInviteEmailData {
		id: string;
		email: string;
		organization: {
			id: string;
			name: string;
			slug: string;
			logo?: string | null;
		};
		inviter: {
			userId: string;
			user: {name: string; email: string};
		};
		role: string;
		invitation: {expiresAt: Date};
	}

	export interface EmailVerificationData {
		user: {id: string; email: string; name: string};
		url: string;
		token: string;
	}

	export interface PasswordResetEmailData {
		user: {id: string; email: string; name: string};
		url: string;
		token: string;
	}

	export type Session = any;
	export type User = any;
}

/**
 * Module declaration for better-auth/node.
 * Prevents cascading type errors from the better-auth npm package.
 */
declare module "better-auth/node" {
	export function toNodeHandler(auth: any): any;
	export function fromNodeHeaders(headers: any): Headers;
}
