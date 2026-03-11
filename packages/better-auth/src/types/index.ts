/**
 * Base user type matching better-auth's User interface.
 * Inlined to avoid cascading type errors from better-auth's Zod re-exports.
 */
interface BaseUser {
	id: string;
	email: string;
	emailVerified: boolean;
	name: string;
	createdAt: Date;
	updatedAt: Date;
	image?: string | null;
}

/**
 * Base session type matching better-auth's Session interface.
 * Inlined to avoid cascading type errors from better-auth's Zod re-exports.
 */
interface BaseSession {
	id: string;
	userId: string;
	expiresAt: Date;
	token: string;
	createdAt: Date;
	updatedAt: Date;
	ipAddress?: string | null;
	userAgent?: string | null;
}

/**
 * Extended user type with additional fields.
 *
 * When you add custom user fields (e.g., phoneNumber, avatarUrl, preferences):
 * add your custom properties to this interface.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ExtendedUser extends BaseUser {
	// Add custom user fields here
}

/**
 * Extended session type with organization context.
 */
export interface ExtendedSession extends BaseSession {
	activeOrganizationId?: string | null;
	activeTeamId?: string | null;
}

/**
 * Auth session response from better-auth.
 */
export interface AuthSession {
	user: ExtendedUser;
	session: ExtendedSession;
}

/**
 * Organization invitation email data.
 */
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
		user: {
			name: string;
			email: string;
		};
	};
	role: string;
	invitation: {
		expiresAt: Date;
	};
}

/**
 * Email verification data.
 */
export interface EmailVerificationData {
	user: {
		id: string;
		email: string;
		name: string;
	};
	url: string;
	token: string;
}

/**
 * Password reset email data.
 */
export interface PasswordResetEmailData {
	user: {
		id: string;
		email: string;
		name: string;
	};
	url: string;
	token: string;
}
