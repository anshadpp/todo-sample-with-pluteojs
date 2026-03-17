import {iAPIRequestStatus} from "@/customTypes/NetworkTypes";
import {Todo} from "@/services/api/PluteoJS/TodoService";

export const REDUCER_NAME = "todosState";

export interface iTodosState {
	items: Todo[];
	fetchStatus: iAPIRequestStatus;
	createStatus: iAPIRequestStatus;
	updateStatus: iAPIRequestStatus;
	deleteStatus: iAPIRequestStatus;
}
