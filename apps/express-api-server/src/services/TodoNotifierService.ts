import logger from "@loaders/logger";

import TodosService from "./TodosService";

const CHECK_INTERVAL_MS = 60_000; // Check every minute

export default class TodoNotifierService {
	private todosService: TodosService;
	private intervalId: ReturnType<typeof setInterval> | null = null;

	constructor() {
		this.todosService = new TodosService();
	}

	public start(): void {
		logger.info("TodoNotifierService started - checking every 60 seconds");

		// Run immediately on start
		this.checkAndNotify();

		this.intervalId = setInterval(() => {
			this.checkAndNotify();
		}, CHECK_INTERVAL_MS);
	}

	public stop(): void {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
			logger.info("TodoNotifierService stopped");
		}
	}

	private async checkAndNotify(): Promise<void> {
		try {
			const dueTodos = await this.todosService.getDueTodos();

			if (dueTodos.length === 0) {
				return;
			}

			logger.info(`Found ${dueTodos.length} todo(s) due for notification`);

			for (const todo of dueTodos) {
				logger.info(
					`[TODO REMINDER] "${todo.title}" - Due: ${todo.dueAt ?? "no due date"} | User: ${todo.userId}`
				);
			}

			await this.todosService.markAsNotified(
				dueTodos.map((t) => {
					return t.id;
				})
			);
		} catch (error) {
			logger.error(
				"TodoNotifierService: Error checking notifications",
				error as string
			);
		}
	}
}
