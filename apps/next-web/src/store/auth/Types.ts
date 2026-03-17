import {iAPIRequestStatus} from "@/customTypes/NetworkTypes";
import {AuthUser} from "@/services/api/PluteoJS/AuthService";

export const REDUCER_NAME = "authState";

export interface iAuthState {
	user: AuthUser | null;
	isAuthenticated: boolean;
	sessionStatus: iAPIRequestStatus;
	signInStatus: iAPIRequestStatus;
	signUpStatus: iAPIRequestStatus;
	signOutStatus: iAPIRequestStatus;
}
