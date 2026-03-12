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
