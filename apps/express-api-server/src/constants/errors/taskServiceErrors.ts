import {asTypeIResponseError} from "@customTypes/responseTypes";

export const taskServiceError = asTypeIResponseError({
	getTask: {
		TaskNotFound: {
			error: "TaskNotFound",
			message: "Task not found",
			details: null,
		},
	},
	updateTask: {
		TaskNotFound: {
			error: "TaskNotFound",
			message: "Task not found",
			details: null,
		},
	},
	deleteTask: {
		TaskNotFound: {
			error: "TaskNotFound",
			message: "Task not found",
			details: null,
		},
	},
	moveTask: {
		TaskNotFound: {
			error: "TaskNotFound",
			message: "Task not found",
			details: null,
		},
	},
	getComment: {
		CommentNotFound: {
			error: "CommentNotFound",
			message: "Comment not found",
			details: null,
		},
	},
	updateComment: {
		CommentNotFound: {
			error: "CommentNotFound",
			message: "Comment not found",
			details: null,
		},
		NotCommentOwner: {
			error: "NotCommentOwner",
			message: "You can only edit your own comments",
			details: null,
		},
	},
	deleteComment: {
		CommentNotFound: {
			error: "CommentNotFound",
			message: "Comment not found",
			details: null,
		},
		NotCommentOwner: {
			error: "NotCommentOwner",
			message: "You can only delete your own comments",
			details: null,
		},
	},
	getLabel: {
		LabelNotFound: {
			error: "LabelNotFound",
			message: "Label not found",
			details: null,
		},
	},
	deleteAttachment: {
		AttachmentNotFound: {
			error: "AttachmentNotFound",
			message: "Attachment not found",
			details: null,
		},
	},
	getTaskContent: {
		ContentNotFound: {
			error: "ContentNotFound",
			message: "Content not found",
			details: null,
		},
	},
	updateTaskContent: {
		ContentNotFound: {
			error: "ContentNotFound",
			message: "Content not found",
			details: null,
		},
		NotContentOwner: {
			error: "NotContentOwner",
			message: "You can only edit your own content",
			details: null,
		},
	},
	deleteTaskContent: {
		ContentNotFound: {
			error: "ContentNotFound",
			message: "Content not found",
			details: null,
		},
		NotContentOwner: {
			error: "NotContentOwner",
			message: "You can only delete your own content",
			details: null,
		},
	},
});
