export interface iBoard {
	id: string;
	projectId: string;
	name: string;
	description: string | null;
	isDefault: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface iCreateBoardDTO {
	name: string;
	description?: string;
}

export interface iUpdateBoardDTO {
	name?: string;
	description?: string | null;
}
