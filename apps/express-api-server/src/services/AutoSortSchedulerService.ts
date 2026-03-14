import {db, eq, projects} from "@pluteojs/database";

import logger from "@loaders/logger";

import AutoSortEngineService from "./AutoSortEngineService";

const CHECK_INTERVAL_MS = 5 * 60_000; // Check every 5 minutes

export default class AutoSortSchedulerService {
	private engine: AutoSortEngineService;
	private intervalId: ReturnType<typeof setInterval> | null = null;

	constructor() {
		this.engine = new AutoSortEngineService();
	}

	public start(): void {
		logger.info(
			"AutoSortSchedulerService started - checking every 5 minutes"
		);

		// Run immediately on start
		this.runEvaluation();

		this.intervalId = setInterval(() => {
			this.runEvaluation();
		}, CHECK_INTERVAL_MS);
	}

	public stop(): void {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
			logger.info("AutoSortSchedulerService stopped");
		}
	}

	private async runEvaluation(): Promise<void> {
		try {
			const projectRecords = await db
				.select({id: projects.id})
				.from(projects)
				.where(eq(projects.isArchived, false));

			let totalActions = 0;
			for (const project of projectRecords) {
				const actions = await this.engine.evaluateAllTasksForProject(
					project.id
				);
				totalActions += actions;
			}

			if (totalActions > 0) {
				logger.info(
					`AutoSortScheduler: applied ${totalActions} auto-sort action(s)`
				);
			}
		} catch (error) {
			logger.error(
				"AutoSortSchedulerService: Error running evaluation",
				error as string
			);
		}
	}
}
