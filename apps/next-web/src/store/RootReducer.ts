import {combineReducers} from "@reduxjs/toolkit";

import exampleReducer from "@/store/example/ExampleSlice";
import authReducer from "@/store/auth/AuthSlice";
import organizationReducer from "@/store/organization/OrganizationSlice";
import projectsReducer from "@/store/projects/ProjectsSlice";
import boardsReducer from "@/store/boards/BoardsSlice";
import tasksReducer from "@/store/tasks/TasksSlice";
import taskDetailReducer from "@/store/taskDetail/TaskDetailSlice";
import labelsReducer from "@/store/labels/LabelsSlice";
import notificationsReducer from "@/store/notifications/NotificationsSlice";
import autoSortRulesReducer from "@/store/autoSortRules/AutoSortRulesSlice";
import todosReducer from "@/store/todos/TodosSlice";
import membersReducer from "@/store/members/MembersSlice";
import userReducer from "@/store/user/UserSlice";

// Combine multiple reducers into a single root reducer
const rootReducer = combineReducers({
	exampleReducer,
	authReducer,
	organizationReducer,
	projectsReducer,
	boardsReducer,
	tasksReducer,
	taskDetailReducer,
	labelsReducer,
	notificationsReducer,
	autoSortRulesReducer,
	todosReducer,
	membersReducer,
	userReducer,
});

export default rootReducer;
