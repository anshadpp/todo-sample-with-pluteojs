import type {iAPIRequestStatus} from "@/customTypes/NetworkTypes";
import type {Todo} from "@/services/api/PluteoJS/TodoService";

export interface iTodosState {
	items: Todo[];
	fetchStatus: iAPIRequestStatus;
	createStatus: iAPIRequestStatus;
	updateStatus: iAPIRequestStatus;
	deleteStatus: iAPIRequestStatus;
}
