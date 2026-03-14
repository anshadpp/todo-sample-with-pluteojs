import {db, eq, and, labels, taskLabels} from "@pluteojs/database";

import logger from "@loaders/logger";

import {httpStatusCodes} from "@customTypes/networkTypes";
import type {
	iLabel,
	iCreateLabelDTO,
	iUpdateLabelDTO,
} from "@customTypes/appDataTypes/taskTypes";

import {ServiceError} from "@errors/ServiceError";
import {taskServiceError} from "@constants/errors/taskServiceErrors";

export default class LabelsService {
	private toDTO(record: typeof labels.$inferSelect): iLabel {
		return {
			id: record.id,
			projectId: record.projectId,
			name: record.name,
			color: record.color,
			createdAt: record.createdAt.toISOString(),
		};
	}

	public async getLabels(projectId: string): Promise<iLabel[]> {
		logger.silly("Retrieving labels for project");

		const records = await db
			.select()
			.from(labels)
			.where(eq(labels.projectId, projectId))
			.orderBy(labels.name);

		return records.map((r) => {
			return this.toDTO(r);
		});
	}

	public async createLabel(
		projectId: string,
		input: iCreateLabelDTO
	): Promise<iLabel> {
		logger.silly("Creating a new label");

		const result = await db
			.insert(labels)
			.values({
				projectId,
				name: input.name,
				color: input.color,
			})
			.returning();

		const label = result[0]!;
		logger.silly("Label created successfully");
		return this.toDTO(label);
	}

	public async updateLabel(
		labelId: string,
		input: iUpdateLabelDTO
	): Promise<iLabel> {
		logger.silly("Updating label");

		const updateValues: Record<string, unknown> = {};
		if (input.name !== undefined) {
			updateValues.name = input.name;
		}
		if (input.color !== undefined) {
			updateValues.color = input.color;
		}

		const result = await db
			.update(labels)
			.set(updateValues)
			.where(eq(labels.id, labelId))
			.returning();

		const record = result[0];
		if (!record) {
			throw new ServiceError(
				httpStatusCodes.CLIENT_ERROR_NOT_FOUND,
				taskServiceError.getLabel.LabelNotFound
			);
		}

		logger.silly("Label updated successfully");
		return this.toDTO(record);
	}

	public async deleteLabel(labelId: string): Promise<void> {
		logger.silly("Deleting label");

		const result = await db
			.delete(labels)
			.where(eq(labels.id, labelId))
			.returning({id: labels.id});

		if (result.length === 0) {
			throw new ServiceError(
				httpStatusCodes.CLIENT_ERROR_NOT_FOUND,
				taskServiceError.getLabel.LabelNotFound
			);
		}

		logger.silly("Label deleted successfully");
	}

	public async addLabelToTask(taskId: string, labelId: string): Promise<void> {
		logger.silly("Adding label to task");

		await db.insert(taskLabels).values({taskId, labelId}).onConflictDoNothing();

		logger.silly("Label added to task successfully");
	}

	public async removeLabelFromTask(
		taskId: string,
		labelId: string
	): Promise<void> {
		logger.silly("Removing label from task");

		await db
			.delete(taskLabels)
			.where(
				and(eq(taskLabels.taskId, taskId), eq(taskLabels.labelId, labelId))
			);

		logger.silly("Label removed from task successfully");
	}
}
