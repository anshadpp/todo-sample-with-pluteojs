export interface iBoard {
	id: string;
	projectId: string;
	name: string;
	description: string | null;
	type: "status" | "category";
	isDefault: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface iCreateBoardDTO {
	name: string;
	description?: string;
	type?: "status" | "category";
}

export interface iUpdateBoardDTO {
	name?: string;
	description?: string | null;
}
