import {apiServer, injectStore} from "./axiosConfig";
import ExampleService from "./ExampleService";
import AuthService from "./AuthService";
import TodoService from "./TodoService";
import OrganizationService from "./OrganizationService";
import ProjectService from "./ProjectService";
import BoardService from "./BoardService";
import TaskService from "./TaskService";
import CommentService from "./CommentService";
import NotificationService from "./NotificationService";
import LabelService from "./LabelService";
import ActivityService from "./ActivityService";
import MemberService from "./MemberService";
import UserService from "./UserService";

const exampleService = ExampleService(apiServer);
const authService = AuthService(apiServer);
const todoService = TodoService(apiServer);
const organizationService = OrganizationService(apiServer);
const projectService = ProjectService(apiServer);
const boardService = BoardService(apiServer);
const taskService = TaskService(apiServer);
const commentService = CommentService(apiServer);
const notificationService = NotificationService(apiServer);
const labelService = LabelService(apiServer);
const activityService = ActivityService(apiServer);
const memberService = MemberService(apiServer);
const userService = UserService(apiServer);

export {
	injectStore,
	exampleService,
	authService,
	todoService,
	organizationService,
	projectService,
	boardService,
	taskService,
	commentService,
	notificationService,
	labelService,
	activityService,
	memberService,
	userService,
};
