import {db, eq, and, boards, categories} from "@pluteojs/database";

import logger from "@loaders/logger";

import {httpStatusCodes} from "@customTypes/networkTypes";
import type {
	iBoard,
	iCreateBoardDTO,
	iUpdateBoardDTO,
	iCategory,
	iCreateCategoryDTO,
	iUpdateCategoryDTO,
} from "@customTypes/appDataTypes/projectTypes";

import {ServiceError} from "@errors/ServiceError";
import {projectServiceError} from "@constants/errors/projectServiceErrors";

export default class BoardsService {
	private toBoardDTO(record: typeof boards.$inferSelect): iBoard {
		return {
			id: record.id,
			projectId: record.projectId,
			name: record.name,
			description: record.description,
			type: record.type as "status" | "category",
			isDefault: record.isDefault,
			sortOrder: record.sortOrder,
			createdAt: record.createdAt.toISOString(),
			updatedAt: record.updatedAt.toISOString(),
		};
	}

	private toCategoryDTO(record: typeof categories.$inferSelect): iCategory {
		return {
			id: record.id,
			boardId: record.boardId,
			name: record.name,
			color: record.color,
			statusValue: record.statusValue,
			sortOrder: record.sortOrder,
			wipLimit: record.wipLimit,
			createdAt: record.createdAt.toISOString(),
			updatedAt: record.updatedAt.toISOString(),
		};
	}

	public async getBoards(projectId: string): Promise<iBoard[]> {
		logger.silly("Retrieving boards for project");

		const records = await db
			.select()
			.from(boards)
			.where(eq(boards.projectId, projectId))
			.orderBy(boards.sortOrder);

		return records.map((r) => {
			return this.toBoardDTO(r);
		});
	}

	public async createBoard(
		projectId: string,
		input: iCreateBoardDTO
	): Promise<iBoard> {
		logger.silly("Creating a new board");

		const boardType = input.type ?? "status";

		const result = await db
			.insert(boards)
			.values({
				projectId,
				name: input.name,
				description: input.description ?? null,
				type: boardType,
			})
			.returning();

		const board = result[0]!;

		// Auto-create default status categories for status boards
		if (boardType === "status") {
			const defaultStatusCategories = [
				{name: "Todo", color: "#6B7280", statusValue: "todo", sortOrder: 0},
				{name: "In Progress", color: "#3B82F6", statusValue: "in_progress", sortOrder: 1000},
				{name: "Done", color: "#10B981", statusValue: "done", sortOrder: 2000},
				{name: "Closed", color: "#EF4444", statusValue: "closed", sortOrder: 3000},
			];

			for (const cat of defaultStatusCategories) {
				await db.insert(categories).values({
					boardId: board.id,
					name: cat.name,
					color: cat.color,
					statusValue: cat.statusValue,
					sortOrder: cat.sortOrder,
				});
			}
		}

		logger.silly("Board created successfully");
		return this.toBoardDTO(board);
	}

	public async getBoard(boardId: string): Promise<iBoard> {
		const records = await db
			.select()
			.from(boards)
			.where(eq(boards.id, boardId))
			.limit(1);

		const record = records[0];
		if (!record) {
			throw new ServiceError(
				httpStatusCodes.CLIENT_ERROR_NOT_FOUND,
				projectServiceError.getBoard.BoardNotFound
			);
		}

		return this.toBoardDTO(record);
	}

	public async updateBoard(
		boardId: string,
		input: iUpdateBoardDTO
	): Promise<iBoard> {
		logger.silly("Updating board");

		const updateValues: Record<string, unknown> = {};
		if (input.name !== undefined) {
			updateValues.name = input.name;
		}
		if (input.description !== undefined) {
			updateValues.description = input.description;
		}

		const result = await db
			.update(boards)
			.set(updateValues)
			.where(eq(boards.id, boardId))
			.returning();

		const record = result[0];
		if (!record) {
			throw new ServiceError(
				httpStatusCodes.CLIENT_ERROR_NOT_FOUND,
				projectServiceError.updateBoard.BoardNotFound
			);
		}

		logger.silly("Board updated successfully");
		return this.toBoardDTO(record);
	}

	public async deleteBoard(boardId: string): Promise<void> {
		logger.silly("Deleting board");

		const result = await db
			.delete(boards)
			.where(eq(boards.id, boardId))
			.returning({id: boards.id});

		if (result.length === 0) {
			throw new ServiceError(
				httpStatusCodes.CLIENT_ERROR_NOT_FOUND,
				projectServiceError.deleteBoard.BoardNotFound
			);
		}

		logger.silly("Board deleted successfully");
	}

	// Category methods
	public async getCategories(boardId: string): Promise<iCategory[]> {
		logger.silly("Retrieving categories for board");

		const records = await db
			.select()
			.from(categories)
			.where(eq(categories.boardId, boardId))
			.orderBy(categories.sortOrder);

		return records.map((r) => {
			return this.toCategoryDTO(r);
		});
	}

	public async createCategory(
		boardId: string,
		input: iCreateCategoryDTO
	): Promise<iCategory> {
		logger.silly("Creating a new category");

		// Get max sort order for the board
		const existing = await db
			.select()
			.from(categories)
			.where(eq(categories.boardId, boardId))
			.orderBy(categories.sortOrder);

		const maxOrder =
			existing.length > 0 ? existing[existing.length - 1]!.sortOrder : -1000;

		const result = await db
			.insert(categories)
			.values({
				boardId,
				name: input.name,
				color: input.color ?? null,
				statusValue: input.statusValue ?? null,
				sortOrder: maxOrder + 1000,
				wipLimit: input.wipLimit ?? null,
			})
			.returning();

		const category = result[0]!;
		logger.silly("Category created successfully");
		return this.toCategoryDTO(category);
	}

	public async updateCategory(
		categoryId: string,
		input: iUpdateCategoryDTO
	): Promise<iCategory> {
		logger.silly("Updating category");

		const updateValues: Record<string, unknown> = {};
		if (input.name !== undefined) {
			updateValues.name = input.name;
		}
		if (input.color !== undefined) {
			updateValues.color = input.color;
		}
		if (input.statusValue !== undefined) {
			updateValues.statusValue = input.statusValue;
		}
		if (input.sortOrder !== undefined) {
			updateValues.sortOrder = input.sortOrder;
		}
		if (input.wipLimit !== undefined) {
			updateValues.wipLimit = input.wipLimit;
		}

		const result = await db
			.update(categories)
			.set(updateValues)
			.where(eq(categories.id, categoryId))
			.returning();

		const record = result[0];
		if (!record) {
			throw new ServiceError(
				httpStatusCodes.CLIENT_ERROR_NOT_FOUND,
				projectServiceError.updateCategory.CategoryNotFound
			);
		}

		logger.silly("Category updated successfully");
		return this.toCategoryDTO(record);
	}

	public async deleteCategory(categoryId: string): Promise<void> {
		logger.silly("Deleting category");

		const result = await db
			.delete(categories)
			.where(eq(categories.id, categoryId))
			.returning({id: categories.id});

		if (result.length === 0) {
			throw new ServiceError(
				httpStatusCodes.CLIENT_ERROR_NOT_FOUND,
				projectServiceError.deleteCategory.CategoryNotFound
			);
		}

		logger.silly("Category deleted successfully");
	}

	public async reorderCategories(
		boardId: string,
		items: {id: string; sortOrder: number}[]
	): Promise<iCategory[]> {
		logger.silly("Reordering categories");

		for (const item of items) {
			await db
				.update(categories)
				.set({sortOrder: item.sortOrder})
				.where(
					and(eq(categories.id, item.id), eq(categories.boardId, boardId))
				);
		}

		return this.getCategories(boardId);
	}
}
