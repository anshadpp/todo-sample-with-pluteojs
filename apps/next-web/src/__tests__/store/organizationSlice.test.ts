import {describe, it, expect, vi, beforeEach} from "vitest";

import {
	createTestStore,
	mockSuccessResponse,
	mockErrorResponse,
	expectIdle,
	expectLoading,
	expectSuccess,
	expectError,
	TestStore,
} from "./testHelpers";
import {
	listOrganizations,
	createOrganization,
	updateOrganization,
	deleteOrganization,
	setActiveOrganization,
	getFullOrganization,
	inviteMember,
	acceptInvitation,
	rejectInvitation,
	resetOrganizationState,
	setActiveOrgId,
	clearCreateStatus,
	clearInviteStatus,
} from "@/store/organization/OrganizationSlice";

vi.mock("@/services/api/PluteoJS", () => ({
	organizationService: {
		listOrganizations: vi.fn(),
		createOrganization: vi.fn(),
		updateOrganization: vi.fn(),
		deleteOrganization: vi.fn(),
		setActiveOrganization: vi.fn(),
		getFullOrganization: vi.fn(),
		inviteMember: vi.fn(),
		acceptInvitation: vi.fn(),
		rejectInvitation: vi.fn(),
	},
}));

import {organizationService} from "@/services/api/PluteoJS";

const mockOrg = {id: "org-1", name: "Test Org", slug: "test-org"};
const mockOrg2 = {id: "org-2", name: "Another Org", slug: "another-org"};

describe("OrganizationSlice", () => {
	let store: TestStore;

	beforeEach(() => {
		store = createTestStore();
		vi.clearAllMocks();
	});

	describe("initial state", () => {
		it("should have correct initial state", () => {
			const state = store.getState().organizationReducer;
			expect(state.organizations).toEqual([]);
			expect(state.activeOrganizationId).toBeNull();
			expect(state.activeOrganization).toBeNull();
			expectIdle(state.fetchStatus);
		});
	});

	describe("listOrganizations", () => {
		it("should fetch organizations successfully", async () => {
			vi.mocked(organizationService.listOrganizations).mockResolvedValue(
				mockSuccessResponse([mockOrg, mockOrg2])
			);

			await store.dispatch(listOrganizations());

			const state = store.getState().organizationReducer;
			expectSuccess(state.fetchStatus);
			expect(state.organizations).toEqual([mockOrg, mockOrg2]);
		});

		it("should handle pending state", () => {
			vi.mocked(organizationService.listOrganizations).mockReturnValue(
				new Promise(() => {})
			);
			store.dispatch(listOrganizations());
			expectLoading(store.getState().organizationReducer.fetchStatus);
		});

		it("should handle error", async () => {
			vi.mocked(organizationService.listOrganizations).mockResolvedValue(
				mockErrorResponse("Failed", 500)
			);

			await store.dispatch(listOrganizations());
			expectError(store.getState().organizationReducer.fetchStatus);
		});
	});

	describe("createOrganization", () => {
		it("should create and append organization", async () => {
			vi.mocked(organizationService.createOrganization).mockResolvedValue(
				mockSuccessResponse(mockOrg)
			);

			await store.dispatch(createOrganization({name: "Test Org"}));

			const state = store.getState().organizationReducer;
			expectSuccess(state.createStatus);
			expect(state.organizations).toHaveLength(1);
			expect(state.organizations[0]).toEqual(mockOrg);
		});

		it("should handle error", async () => {
			vi.mocked(organizationService.createOrganization).mockResolvedValue(
				mockErrorResponse("Failed", 400)
			);

			await store.dispatch(createOrganization({name: "Bad"}));
			expectError(store.getState().organizationReducer.createStatus);
		});
	});

	describe("updateOrganization", () => {
		it("should handle update success", async () => {
			vi.mocked(organizationService.updateOrganization).mockResolvedValue(
				mockSuccessResponse(mockOrg)
			);

			await store.dispatch(
				updateOrganization({organizationId: "org-1", name: "Updated"})
			);
			expectSuccess(store.getState().organizationReducer.updateStatus);
		});
	});

	describe("deleteOrganization", () => {
		it("should handle delete success", async () => {
			vi.mocked(organizationService.deleteOrganization).mockResolvedValue(
				mockSuccessResponse({})
			);

			await store.dispatch(deleteOrganization("org-1"));
			expectSuccess(store.getState().organizationReducer.deleteStatus);
		});
	});

	describe("setActiveOrganization", () => {
		it("should set active org ID on success", async () => {
			vi.mocked(organizationService.setActiveOrganization).mockResolvedValue(
				mockSuccessResponse({})
			);

			await store.dispatch(setActiveOrganization("org-1"));

			const state = store.getState().organizationReducer;
			expectSuccess(state.setActiveStatus);
			expect(state.activeOrganizationId).toBe("org-1");
		});
	});

	describe("getFullOrganization", () => {
		it("should set active organization data", async () => {
			vi.mocked(organizationService.getFullOrganization).mockResolvedValue(
				mockSuccessResponse(mockOrg)
			);

			await store.dispatch(getFullOrganization("org-1"));
			expect(store.getState().organizationReducer.activeOrganization).toEqual(
				mockOrg
			);
		});
	});

	describe("inviteMember", () => {
		it("should handle invite success", async () => {
			vi.mocked(organizationService.inviteMember).mockResolvedValue(
				mockSuccessResponse({})
			);

			await store.dispatch(
				inviteMember({
					organizationId: "org-1",
					email: "new@test.com",
					role: "member",
				})
			);
			expectSuccess(store.getState().organizationReducer.inviteStatus);
		});

		it("should handle invite error", async () => {
			vi.mocked(organizationService.inviteMember).mockResolvedValue(
				mockErrorResponse("Failed", 400)
			);

			await store.dispatch(
				inviteMember({organizationId: "org-1", email: "bad", role: "member"})
			);
			expectError(store.getState().organizationReducer.inviteStatus);
		});
	});

	describe("acceptInvitation", () => {
		it("should handle accept success", async () => {
			vi.mocked(organizationService.acceptInvitation).mockResolvedValue(
				mockSuccessResponse({})
			);

			await store.dispatch(acceptInvitation("inv-1"));
			expectSuccess(
				store.getState().organizationReducer.acceptInvitationStatus
			);
		});
	});

	describe("rejectInvitation", () => {
		it("should handle reject success", async () => {
			vi.mocked(organizationService.rejectInvitation).mockResolvedValue(
				mockSuccessResponse({})
			);

			await store.dispatch(rejectInvitation("inv-1"));
			expectSuccess(
				store.getState().organizationReducer.rejectInvitationStatus
			);
		});
	});

	describe("sync reducers", () => {
		it("resetOrganizationState should reset to initial", async () => {
			vi.mocked(organizationService.listOrganizations).mockResolvedValue(
				mockSuccessResponse([mockOrg])
			);
			await store.dispatch(listOrganizations());

			store.dispatch(resetOrganizationState());
			expect(store.getState().organizationReducer.organizations).toEqual([]);
		});

		it("setActiveOrgId should set active org ID", () => {
			store.dispatch(setActiveOrgId("org-123"));
			expect(store.getState().organizationReducer.activeOrganizationId).toBe(
				"org-123"
			);
		});

		it("clearCreateStatus should reset createStatus", async () => {
			vi.mocked(organizationService.createOrganization).mockResolvedValue(
				mockErrorResponse("Fail", 400)
			);
			await store.dispatch(createOrganization({name: "Bad"}));

			store.dispatch(clearCreateStatus());
			expectIdle(store.getState().organizationReducer.createStatus);
		});

		it("clearInviteStatus should reset inviteStatus", async () => {
			vi.mocked(organizationService.inviteMember).mockResolvedValue(
				mockErrorResponse("Fail", 400)
			);
			await store.dispatch(
				inviteMember({organizationId: "o", email: "e", role: "r"})
			);

			store.dispatch(clearInviteStatus());
			expectIdle(store.getState().organizationReducer.inviteStatus);
		});
	});
});
