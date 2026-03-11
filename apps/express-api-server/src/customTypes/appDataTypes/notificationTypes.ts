export interface iNotification {
	id: string;
	userId: string;
	type: string;
	title: string;
	body: string | null;
	resourceType: string | null;
	resourceId: string | null;
	isRead: boolean;
	readAt: string | null;
	createdAt: string;
}
