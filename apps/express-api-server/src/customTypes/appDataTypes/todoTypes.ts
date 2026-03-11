export interface iTodo {
	id: string;
	userId: string;
	title: string;
	description: string | null;
	completed: boolean;
	dueAt: string | null;
	notifyAt: string | null;
	notified: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface iCreateTodoDTO {
	title: string;
	description?: string;
	dueAt?: string;
	notifyAt?: string;
}

export interface iUpdateTodoDTO {
	title?: string;
	description?: string | null;
	completed?: boolean;
	dueAt?: string | null;
	notifyAt?: string | null;
}
