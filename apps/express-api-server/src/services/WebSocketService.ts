import {Server as SocketIOServer} from "socket.io";
import type {Server as HttpServer} from "http";

import logger from "@loaders/logger";

class WebSocketService {
	private static instance: WebSocketService;
	private io: SocketIOServer | null = null;

	private constructor() {}

	public static getInstance(): WebSocketService {
		if (!WebSocketService.instance) {
			WebSocketService.instance = new WebSocketService();
		}
		return WebSocketService.instance;
	}

	public initialize(httpServer: HttpServer): void {
		this.io = new SocketIOServer(httpServer, {
			cors: {
				origin: process.env.CORS_ORIGIN || "http://localhost:4020",
				credentials: true,
			},
		});

		this.io.on("connection", (socket) => {
			logger.silly(`WebSocket client connected: ${socket.id}`);

			socket.on("join:board", (boardId: string) => {
				socket.join(`board:${boardId}`);
				logger.silly(`Socket ${socket.id} joined board:${boardId}`);
			});

			socket.on("leave:board", (boardId: string) => {
				socket.leave(`board:${boardId}`);
			});

			socket.on("join:task", (taskId: string) => {
				socket.join(`task:${taskId}`);
			});

			socket.on("leave:task", (taskId: string) => {
				socket.leave(`task:${taskId}`);
			});

			socket.on("join:project", (projectId: string) => {
				socket.join(`project:${projectId}`);
			});

			socket.on("leave:project", (projectId: string) => {
				socket.leave(`project:${projectId}`);
			});

			socket.on("join:user", (userId: string) => {
				socket.join(`user:${userId}`);
			});

			socket.on("disconnect", () => {
				logger.silly(`WebSocket client disconnected: ${socket.id}`);
			});
		});

		logger.info("WebSocket server initialized");
	}

	public getIO(): SocketIOServer | null {
		return this.io;
	}

	public emitToBoard(boardId: string, event: string, data: unknown): void {
		this.io?.to(`board:${boardId}`).emit(event, data);
	}

	public emitToTask(taskId: string, event: string, data: unknown): void {
		this.io?.to(`task:${taskId}`).emit(event, data);
	}

	public emitToProject(projectId: string, event: string, data: unknown): void {
		this.io?.to(`project:${projectId}`).emit(event, data);
	}

	public emitToUser(userId: string, event: string, data: unknown): void {
		this.io?.to(`user:${userId}`).emit(event, data);
	}
}

export default WebSocketService.getInstance();
