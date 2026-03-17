import type {iAPIRequestStatus} from "@/customTypes/NetworkTypes";
import type {AuthUser} from "@/services/api/PluteoJS/AuthService";

export interface iAuthState {
	user: AuthUser | null;
	isAuthenticated: boolean;
	sessionStatus: iAPIRequestStatus;
	signInStatus: iAPIRequestStatus;
	signUpStatus: iAPIRequestStatus;
	signOutStatus: iAPIRequestStatus;
}
