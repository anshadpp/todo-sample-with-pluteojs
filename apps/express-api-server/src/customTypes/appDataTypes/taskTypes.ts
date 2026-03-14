export interface iTask {
	id: string;
	projectId: string;
	categoryId: string | null;
	createdById: string;
	assigneeId: string | null;
	title: string;
	description: string | null;
	priority: string;
	status: string;
	sortOrder: number;
	dueAt: string | null;
	startAt: string | null;
	estimatedMinutes: number | null;
	effortLevel: string | null;
	coverImage: string | null;
	isArchived: boolean;
	completedAt: string | null;
	createdAt: string;
	updatedAt: string;
	labels?: iLabel[];
	assignee?: {id: string; name: string; image: string | null} | null;
	createdByUser?: {id: string; name: string; image: string | null};
}

export interface iCreateTaskDTO {
	title: string;
	description?: string;
	categoryId?: string;
	assigneeId?: string;
	priority?: string;
	status?: string;
	dueAt?: string;
	startAt?: string;
	estimatedMinutes?: number;
	effortLevel?: string;
	sortOrder?: number;
}

export interface iUpdateTaskDTO {
	title?: string;
	description?: string | null;
	categoryId?: string | null;
	assigneeId?: string | null;
	priority?: string;
	status?: string;
	dueAt?: string | null;
	startAt?: string | null;
	estimatedMinutes?: number | null;
	effortLevel?: string | null;
	coverImage?: string | null;
	isArchived?: boolean;
	sortOrder?: number;
}

export interface iMoveTaskDTO {
	categoryId: string;
	sortOrder: number;
}

export interface iLabel {
	id: string;
	projectId: string;
	name: string;
	color: string;
	createdAt: string;
}

export interface iCreateLabelDTO {
	name: string;
	color: string;
}

export interface iUpdateLabelDTO {
	name?: string;
	color?: string;
}

export interface iComment {
	id: string;
	taskId: string;
	userId: string;
	content: string;
	parentId: string | null;
	isEdited: boolean;
	createdAt: string;
	updatedAt: string;
	user?: {id: string; name: string; image: string | null};
}

export interface iCreateCommentDTO {
	content: string;
	parentId?: string;
}

export interface iUpdateCommentDTO {
	content: string;
}

export interface iActivity {
	id: string;
	taskId: string;
	userId: string;
	action: string;
	field: string | null;
	oldValue: string | null;
	newValue: string | null;
	metadata: string | null;
	createdAt: string;
	user?: {id: string; name: string; image: string | null};
}

export interface iAttachment {
	id: string;
	taskId: string;
	uploadedById: string;
	fileName: string;
	fileUrl: string;
	fileSize: number;
	mimeType: string;
	createdAt: string;
}

export interface iTaskDependency {
	id: string;
	dependentTaskId: string;
	dependsOnTaskId: string;
	dependencyType: string;
	createdAt: string;
	dependsOnTask?: {
		id: string;
		title: string;
		status: string;
		categoryId: string | null;
	};
	dependentTask?: {
		id: string;
		title: string;
		status: string;
		categoryId: string | null;
	};
}

export interface iAutoSortRule {
	id: string;
	projectId: string;
	name: string;
	description: string | null;
	conditionField: string;
	conditionOperator: string;
	conditionValue: string | null;
	actionType: string;
	actionValue: string;
	isEnabled: boolean;
	sortOrder: number;
	stopOnMatch: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface iCreateAutoSortRuleDTO {
	name: string;
	description?: string;
	conditionField: string;
	conditionOperator: string;
	conditionValue?: string;
	actionType: string;
	actionValue: string;
	isEnabled?: boolean;
	sortOrder?: number;
	stopOnMatch?: boolean;
}

export interface iUpdateAutoSortRuleDTO {
	name?: string;
	description?: string | null;
	conditionField?: string;
	conditionOperator?: string;
	conditionValue?: string | null;
	actionType?: string;
	actionValue?: string;
	isEnabled?: boolean;
	sortOrder?: number;
	stopOnMatch?: boolean;
}

export interface iTaskContent {
	id: string;
	taskId: string;
	createdById: string;
	type: string;
	title: string | null;
	content: string;
	language: string | null;
	url: string | null;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
	user?: {id: string; name: string; image: string | null};
}

export interface iCreateTaskContentDTO {
	type: string;
	title?: string;
	content: string;
	language?: string;
	url?: string;
	sortOrder?: number;
}

export interface iUpdateTaskContentDTO {
	title?: string | null;
	content?: string;
	language?: string | null;
	url?: string | null;
	sortOrder?: number;
}

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
