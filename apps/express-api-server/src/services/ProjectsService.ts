import {
	db,
	eq,
	and,
	or,
	isNull,
	projects,
	boards,
	categories,
	members,
} from "@pluteojs/database";

import logger from "@loaders/logger";

import {httpStatusCodes} from "@customTypes/networkTypes";
import type {
	iProject,
	iCreateProjectDTO,
	iUpdateProjectDTO,
} from "@customTypes/appDataTypes/projectTypes";

import {ServiceError} from "@errors/ServiceError";
import {projectServiceError} from "@constants/errors/projectServiceErrors";

export default class ProjectsService {
	private toDTO(record: typeof projects.$inferSelect): iProject {
		return {
			id: record.id,
			name: record.name,
			description: record.description,
			slug: record.slug,
			organizationId: record.organizationId,
			createdById: record.createdById,
			color: record.color,
			icon: record.icon,
			isArchived: record.isArchived,
			createdAt: record.createdAt.toISOString(),
			updatedAt: record.updatedAt.toISOString(),
		};
	}

	private slugify(name: string): string {
		return name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "")
			.substring(0, 50);
	}

	public async createProject(
		userId: string,
		organizationId: string | null,
		input: iCreateProjectDTO
	): Promise<iProject> {
		logger.silly("Creating a new project");

		const slug = this.slugify(input.name) + "-" + Date.now().toString(36);

		const result = await db
			.insert(projects)
			.values({
				name: input.name,
				description: input.description ?? null,
				slug,
				organizationId: organizationId ?? null,
				createdById: userId,
				color: input.color ?? null,
				icon: input.icon ?? null,
			})
			.returning();

		const project = result[0]!;

		// Create a default status board with default status categories
		const boardResult = await db
			.insert(boards)
			.values({
				projectId: project.id,
				name: "Board",
				type: "status",
				isDefault: true,
				sortOrder: 0,
			})
			.returning();

		const board = boardResult[0]!;

		const defaultCategories = [
			{name: "Todo", color: "#6B7280", statusValue: "todo", sortOrder: 0},
			{name: "In Progress", color: "#3B82F6", statusValue: "in_progress", sortOrder: 1000},
			{name: "Done", color: "#10B981", statusValue: "done", sortOrder: 2000},
			{name: "Closed", color: "#EF4444", statusValue: "closed", sortOrder: 3000},
		];

		for (const cat of defaultCategories) {
			await db.insert(categories).values({
				boardId: board.id,
				name: cat.name,
				color: cat.color,
				statusValue: cat.statusValue,
				sortOrder: cat.sortOrder,
			});
		}

		logger.silly(
			"Project created successfully with default board and categories"
		);
		return this.toDTO(project);
	}

	/**
	 * Get projects. If organizationId is provided, return org projects.
	 * Otherwise, return personal projects (where organizationId is null and createdById = userId).
	 */
	public async getProjects(
		userId: string,
		organizationId: string | null
	): Promise<iProject[]> {
		logger.silly("Retrieving projects");

		let condition;
		if (organizationId) {
			// Org projects: projects belonging to this org
			condition = and(
				eq(projects.organizationId, organizationId),
				eq(projects.isArchived, false)
			);
		} else {
			// Personal projects: created by this user, no org
			condition = and(
				eq(projects.createdById, userId),
				isNull(projects.organizationId),
				eq(projects.isArchived, false)
			);
		}

		const records = await db
			.select()
			.from(projects)
			.where(condition)
			.orderBy(projects.createdAt);

		return records.map((r) => {
			return this.toDTO(r);
		});
	}

	public async getProject(
		projectId: string,
		userId: string
	): Promise<iProject> {
		logger.silly("Retrieving project by id");

		// User can access project if they created it or are a member of its org
		const records = await db
			.select()
			.from(projects)
			.where(eq(projects.id, projectId))
			.limit(1);

		const record = records[0];
		if (!record) {
			throw new ServiceError(
				httpStatusCodes.CLIENT_ERROR_NOT_FOUND,
				projectServiceError.getProject.ProjectNotFound
			);
		}

		// Check access: either personal project by this user, or org member
		if (record.organizationId) {
			const isMember = await this.verifyMembership(
				userId,
				record.organizationId
			);
			if (!isMember && record.createdById !== userId) {
				throw new ServiceError(
					httpStatusCodes.CLIENT_ERROR_NOT_FOUND,
					projectServiceError.getProject.ProjectNotFound
				);
			}
		} else if (record.createdById !== userId) {
			throw new ServiceError(
				httpStatusCodes.CLIENT_ERROR_NOT_FOUND,
				projectServiceError.getProject.ProjectNotFound
			);
		}

		return this.toDTO(record);
	}

	public async updateProject(
		projectId: string,
		userId: string,
		input: iUpdateProjectDTO
	): Promise<iProject> {
		logger.silly("Updating project");

		// Verify access first
		await this.getProject(projectId, userId);

		const updateValues: Record<string, unknown> = {};
		if (input.name !== undefined) {
			updateValues.name = input.name;
		}
		if (input.description !== undefined) {
			updateValues.description = input.description;
		}
		if (input.color !== undefined) {
			updateValues.color = input.color;
		}
		if (input.icon !== undefined) {
			updateValues.icon = input.icon;
		}
		if (input.isArchived !== undefined) {
			updateValues.isArchived = input.isArchived;
		}

		const result = await db
			.update(projects)
			.set(updateValues)
			.where(eq(projects.id, projectId))
			.returning();

		const record = result[0];
		if (!record) {
			throw new ServiceError(
				httpStatusCodes.CLIENT_ERROR_NOT_FOUND,
				projectServiceError.updateProject.ProjectNotFound
			);
		}

		logger.silly("Project updated successfully");
		return this.toDTO(record);
	}

	public async deleteProject(projectId: string, userId: string): Promise<void> {
		logger.silly("Deleting project");

		// Verify access first
		await this.getProject(projectId, userId);

		const result = await db
			.delete(projects)
			.where(eq(projects.id, projectId))
			.returning({id: projects.id});

		if (result.length === 0) {
			throw new ServiceError(
				httpStatusCodes.CLIENT_ERROR_NOT_FOUND,
				projectServiceError.deleteProject.ProjectNotFound
			);
		}

		logger.silly("Project deleted successfully");
	}

	public async verifyMembership(
		userId: string,
		organizationId: string
	): Promise<boolean> {
		const result = await db
			.select()
			.from(members)
			.where(
				and(
					eq(members.userId, userId),
					eq(members.organizationId, organizationId)
				)
			)
			.limit(1);

		return result.length > 0;
	}
}
