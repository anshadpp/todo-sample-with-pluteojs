import {describe, it, expect, vi, beforeEach} from "vitest";

import {
	createTestStore,
	mockSuccessResponse,
	expectSuccess,
	TestStore,
} from "./testHelpers";
import {
	fetchMembers,
	updateMemberTitle,
	resetMembersState,
} from "@/store/members/MembersSlice";

vi.mock("@/services/api/PluteoJS", () => ({
	memberService: {
		getMembers: vi.fn(),
		updateMemberTitle: vi.fn(),
	},
}));

import {memberService} from "@/services/api/PluteoJS";

const mockMember = {id: "m-1", name: "Alice", title: "Developer"};
const mockMember2 = {id: "m-2", name: "Bob", title: null};

describe("MembersSlice", () => {
	let store: TestStore;

	beforeEach(() => {
		store = createTestStore();
		vi.clearAllMocks();
	});

	it("should fetch members", async () => {
		vi.mocked(memberService.getMembers).mockResolvedValue(
			mockSuccessResponse([mockMember, mockMember2])
		);
		await store.dispatch(fetchMembers());

		const state = store.getState().membersReducer;
		expectSuccess(state.fetchStatus);
		expect(state.items).toEqual([mockMember, mockMember2]);
	});

	it("should update member title", async () => {
		vi.mocked(memberService.updateMemberTitle).mockResolvedValue(
			mockSuccessResponse({})
		);
		await store.dispatch(
			updateMemberTitle({memberId: "m-1", title: "Senior Dev"})
		);
		expectSuccess(store.getState().membersReducer.updateTitleStatus);
	});

	it("resetMembersState should reset", async () => {
		vi.mocked(memberService.getMembers).mockResolvedValue(
			mockSuccessResponse([mockMember])
		);
		await store.dispatch(fetchMembers());
		store.dispatch(resetMembersState());
		expect(store.getState().membersReducer.items).toEqual([]);
	});
});
