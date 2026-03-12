export interface iProject {
	id: string;
	name: string;
	description: string | null;
	slug: string;
	organizationId: string | null;
	createdById: string;
	color: string | null;
	icon: string | null;
	isArchived: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface iCreateProjectDTO {
	name: string;
	description?: string;
	color?: string;
	icon?: string;
}

export interface iUpdateProjectDTO {
	name?: string;
	description?: string | null;
	color?: string | null;
	icon?: string | null;
	isArchived?: boolean;
}

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

export interface iCategory {
	id: string;
	boardId: string;
	name: string;
	color: string | null;
	statusValue: string | null;
	sortOrder: number;
	wipLimit: number | null;
	createdAt: string;
	updatedAt: string;
}

export interface iCreateCategoryDTO {
	name: string;
	color?: string;
	statusValue?: string;
	wipLimit?: number;
}

export interface iUpdateCategoryDTO {
	name?: string;
	color?: string | null;
	statusValue?: string | null;
	sortOrder?: number;
	wipLimit?: number | null;
}
