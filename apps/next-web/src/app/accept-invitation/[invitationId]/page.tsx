"use client";

import {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {Button} from "@/components/lib/shadcn/ui/button";
import {useAuthStore, useOrganizationStore} from "@/store";

interface InvitationData {
	id: string;
	organizationId: string;
	email: string;
	role: string;
	status: string;
	expiresAt: string;
	organizationName?: string;
	inviterEmail?: string;
}

export default function AcceptInvitationPage() {
	const params = useParams();
	const router = useRouter();
	const invitationId = params.invitationId as string;

	const getSession = useAuthStore((s) => s.getSession);
	const acceptInvitation = useOrganizationStore((s) => s.acceptInvitation);
	const rejectInvitation = useOrganizationStore((s) => s.rejectInvitation);

	const [invitation, setInvitation] = useState<InvitationData | null>(null);
	const [loading, setLoading] = useState(true);
	const [processing, setProcessing] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [isLoggedIn, setIsLoggedIn] = useState(false);

	useEffect(() => {
		(async () => {
			// Check if user is logged in via store
			await getSession();
			const authState = useAuthStore.getState();
			if (!authState.isAuthenticated) {
				router.push(`/login?redirect=/accept-invitation/${invitationId}`);
				return;
			}
			setIsLoggedIn(true);

			// Fetch invitation details (still direct since it's a one-off read)
			const {organizationService} = await import("@/services/api/PluteoJS");
			const result = await organizationService.getInvitation(invitationId);
			if (!result.error && result.data) {
				setInvitation(result.data as unknown as InvitationData);
			} else {
				setError(
					String(
						result.message ||
							result.error ||
							"Invitation not found or has expired."
					)
				);
			}
			setLoading(false);
		})();
	}, [invitationId, router, getSession]);

	const handleAccept = async () => {
		setProcessing(true);
		setError("");
		await acceptInvitation(invitationId);
		const state = useOrganizationStore.getState();
		if (state.acceptInvitationStatus.responseStatus === "SUCCESS") {
			setSuccess("Invitation accepted! Redirecting to dashboard...");
			setTimeout(() => router.push("/dashboard"), 1500);
		} else {
			setError(
				state.acceptInvitationStatus.message || "Failed to accept invitation."
			);
		}
		setProcessing(false);
	};

	const handleReject = async () => {
		setProcessing(true);
		setError("");
		await rejectInvitation(invitationId);
		const state = useOrganizationStore.getState();
		if (state.rejectInvitationStatus.responseStatus === "SUCCESS") {
			setSuccess("Invitation declined.");
			setTimeout(() => router.push("/dashboard"), 1500);
		} else {
			setError(
				state.rejectInvitationStatus.message || "Failed to decline invitation."
			);
		}
		setProcessing(false);
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<div className="text-center">
					<div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
					<p className="text-sm text-muted-foreground">Loading invitation...</p>
				</div>
			</div>
		);
	}

	if (!isLoggedIn) return null;

	const isExpired = invitation
		? new Date(invitation.expiresAt) < new Date()
		: false;
	const isPending = invitation?.status === "pending";

	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-md">
				<div className="px-6 py-5 border-b border-border text-center">
					<div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							className="text-primary"
						>
							<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
							<circle cx="9" cy="7" r="4" />
							<line x1="19" y1="8" x2="19" y2="14" />
							<line x1="22" y1="11" x2="16" y2="11" />
						</svg>
					</div>
					<h2 className="text-lg font-semibold">Organization Invitation</h2>
				</div>

				<div className="px-6 py-5">
					{error && !invitation && (
						<div className="text-center">
							<p className="text-sm text-destructive mb-4">{error}</p>
							<Button onClick={() => router.push("/dashboard")}>
								Go to Dashboard
							</Button>
						</div>
					)}

					{success && (
						<div className="text-center">
							<div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
								<svg
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									className="text-green-600"
								>
									<polyline points="20 6 9 17 4 12" />
								</svg>
							</div>
							<p className="text-sm font-medium text-green-600">{success}</p>
						</div>
					)}

					{invitation && !success && (
						<>
							<div className="space-y-3 mb-6">
								{invitation.organizationName && (
									<div className="flex justify-between items-center">
										<span className="text-sm text-muted-foreground">
											Organization
										</span>
										<span className="text-sm font-medium">
											{invitation.organizationName}
										</span>
									</div>
								)}
								<div className="flex justify-between items-center">
									<span className="text-sm text-muted-foreground">Role</span>
									<span className="text-sm font-medium capitalize px-2 py-0.5 rounded-full bg-primary/10 text-primary">
										{invitation.role || "member"}
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-sm text-muted-foreground">Status</span>
									<span
										className={`text-sm font-medium capitalize ${
											isExpired
												? "text-destructive"
												: isPending
													? "text-amber-600"
													: "text-muted-foreground"
										}`}
									>
										{isExpired ? "Expired" : invitation.status}
									</span>
								</div>
								{invitation.inviterEmail && (
									<div className="flex justify-between items-center">
										<span className="text-sm text-muted-foreground">
											Invited by
										</span>
										<span className="text-sm">{invitation.inviterEmail}</span>
									</div>
								)}
							</div>

							{error && (
								<p className="text-sm text-destructive mb-4">{error}</p>
							)}

							{isExpired ? (
								<div className="text-center">
									<p className="text-sm text-destructive mb-4">
										This invitation has expired. Please ask the organization
										admin to send a new one.
									</p>
									<Button onClick={() => router.push("/dashboard")}>
										Go to Dashboard
									</Button>
								</div>
							) : !isPending ? (
								<div className="text-center">
									<p className="text-sm text-muted-foreground mb-4">
										This invitation has already been {invitation.status}.
									</p>
									<Button onClick={() => router.push("/dashboard")}>
										Go to Dashboard
									</Button>
								</div>
							) : (
								<div className="flex gap-3">
									<Button
										variant="outline"
										className="flex-1"
										onClick={handleReject}
										disabled={processing}
									>
										Decline
									</Button>
									<Button
										className="flex-1"
										onClick={handleAccept}
										disabled={processing}
									>
										{processing ? "Processing..." : "Accept Invitation"}
									</Button>
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
}
