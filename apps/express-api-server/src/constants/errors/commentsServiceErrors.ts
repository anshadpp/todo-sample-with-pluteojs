import {asTypeIResponseError} from "@customTypes/responseTypes";

export const commentsServiceError = asTypeIResponseError({
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
});
