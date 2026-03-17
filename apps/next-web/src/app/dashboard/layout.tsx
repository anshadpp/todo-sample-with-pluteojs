"use client";

import {useEffect, useState, useCallback} from "react";
import {useRouter, usePathname} from "next/navigation";
import Link from "next/link";
import {
	useAuthStore,
	useOrganizationStore,
	useProjectsStore,
	useNotificationsStore,
	useMembersStore,
	useUserStore,
} from "@/store";
import {organizationService} from "@/services/api/PluteoJS";
import {Button} from "@/components/lib/shadcn/ui/button";
import {Avatar, AvatarFallback} from "@/components/lib/shadcn/ui/avatar";
import {Badge} from "@/components/lib/shadcn/ui/badge";
import {ScrollArea} from "@/components/lib/shadcn/ui/scroll-area";
import {Skeleton} from "@/components/lib/shadcn/ui/skeleton";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
} from "@/components/lib/shadcn/ui/dropdown-menu";

interface User {
	id: string;
	name: string;
	email: string;
	image: string | null;
}
interface Organization {
	id: string;
	name: string;
	slug: string;
	logo: string | null;
}
interface Project {
	id: string;
	name: string;
	description: string | null;
	color: string | null;
	icon: string | null;
}

const PROJECT_COLORS = [
	{label: "Blue", value: "#3B82F6"},
	{label: "Green", value: "#10B981"},
	{label: "Amber", value: "#F59E0B"},
	{label: "Red", value: "#EF4444"},
	{label: "Purple", value: "#8B5CF6"},
	{label: "Pink", value: "#EC4899"},
	{label: "Indigo", value: "#6366F1"},
	{label: "Teal", value: "#14B8A6"},
	{label: "Orange", value: "#F97316"},
	{label: "Slate", value: "#64748B"},
];

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const pathname = usePathname();

	// Store state
	const user = useAuthStore((s) => s.user) as User | null;
	const getSession = useAuthStore((s) => s.getSession);
	const signOut = useAuthStore((s) => s.signOut);
	const organizations = useOrganizationStore(
		(s) => s.organizations
	) as unknown as Organization[];
	const listOrganizations = useOrganizationStore((s) => s.listOrganizations);
	const projects = useProjectsStore((s) => s.items) as unknown as Project[];
	const fetchProjectsAction = useProjectsStore((s) => s.fetchProjects);
	const unreadCount = useNotificationsStore((s) => s.unreadCount);
	const fetchUnreadCount = useNotificationsStore((s) => s.fetchUnreadCount);
	const markAllAsRead = useNotificationsStore((s) => s.markAllAsRead);
	const listMembers = useMembersStore((s) => s.listMembers);
	const fetchUserProfile = useUserStore((s) => s.fetchUserProfile);

	// Local UI state
	const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
	const [loading, setLoading] = useState(true);
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [darkMode, setDarkMode] = useState(false);

	// Modal states
	const [showCreateOrg, setShowCreateOrg] = useState(false);
	const [showCreateProject, setShowCreateProject] = useState(false);
	const [showInviteMembers, setShowInviteMembers] = useState(false);
	const [editingProject, setEditingProject] = useState<Project | null>(null);
	const [deletingProject, setDeletingProject] = useState<Project | null>(null);
	const [showEditOrg, setShowEditOrg] = useState(false);
	const [showDeleteOrg, setShowDeleteOrg] = useState(false);
	const [showProfile, setShowProfile] = useState(false);

	const isPersonalWorkspace = !activeOrg;

	const fetchData = useCallback(async () => {
		await getSession();
		const authState = useAuthStore.getState();
		if (!authState.isAuthenticated) {
			router.push("/login");
			return;
		}

		await listOrganizations();
		const orgState = useOrganizationStore.getState();
		const savedOrgId = localStorage.getItem("activeOrgId");
		if (savedOrgId && savedOrgId !== "personal") {
			const found = orgState.organizations.find(
				(o: Record<string, unknown>) => o.id === savedOrgId
			) as Organization | undefined;
			if (found) {
				setActiveOrg(found);
			} else {
				localStorage.setItem("activeOrgId", "personal");
			}
		} else {
			localStorage.setItem("activeOrgId", "personal");
		}

		const orgId = savedOrgId && savedOrgId !== "personal" ? savedOrgId : null;
		await fetchProjectsAction(orgId);
		await fetchUnreadCount();
		if (orgId) {
			await listMembers();
		}
		await fetchUserProfile();

		setLoading(false);
	}, [
		router,
		getSession,
		listOrganizations,
		fetchProjectsAction,
		fetchUnreadCount,
		listMembers,
		fetchUserProfile,
	]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	useEffect(() => {
		const isDark = localStorage.getItem("darkMode") === "true";
		setDarkMode(isDark);
		document.documentElement.classList.toggle("dark", isDark);
	}, []);

	const toggleDarkMode = () => {
		const newVal = !darkMode;
		setDarkMode(newVal);
		localStorage.setItem("darkMode", String(newVal));
		document.documentElement.classList.toggle("dark", newVal);
	};

	const handleOrgSwitch = async (org: Organization | null) => {
		setActiveOrg(org);
		if (org) {
			localStorage.setItem("activeOrgId", org.id);
			await fetchProjectsAction(org.id);
		} else {
			localStorage.setItem("activeOrgId", "personal");
			await fetchProjectsAction(null);
		}
	};

	const handleSignOut = async () => {
		await signOut();
		router.push("/login");
	};

	const handleOrgCreated = async () => {
		// After store action succeeds, re-read organizations from store
		const orgState = useOrganizationStore.getState();
		const latestOrgs = orgState.organizations as unknown as Organization[];
		const newOrg = latestOrgs[latestOrgs.length - 1];
		if (newOrg) {
			handleOrgSwitch(newOrg);
		}
		setShowCreateOrg(false);
	};

	const handleProjectCreated = () => {
		// Store already has the updated items
		setShowCreateProject(false);
	};

	const handleProjectUpdated = () => {
		// Store already has the updated items
		setEditingProject(null);
	};

	const handleProjectDeleted = async (projectId: string) => {
		const activeOrgId = activeOrg?.id || null;
		await useProjectsStore.getState().deleteProject(activeOrgId, projectId);
		setDeletingProject(null);
		if (pathname.includes(projectId)) {
			router.push("/dashboard");
		}
	};

	const handleOrgUpdated = (org: Organization) => {
		if (activeOrg?.id === org.id) setActiveOrg(org);
		setShowEditOrg(false);
		// Re-fetch organizations to sync store
		listOrganizations();
	};

	const handleOrgDeleted = async () => {
		if (!activeOrg) return;
		await useOrganizationStore.getState().deleteOrganization(activeOrg.id);
		handleOrgSwitch(null);
		setShowDeleteOrg(false);
		router.push("/dashboard");
		// Re-fetch organizations to sync store
		listOrganizations();
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<div className="space-y-4 w-64">
					<Skeleton className="h-8 w-full" />
					<Skeleton className="h-4 w-3/4" />
					<Skeleton className="h-4 w-1/2" />
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex bg-background">
			{/* Sidebar */}
			<aside
				className={`${sidebarCollapsed ? "w-16" : "w-64"} border-r border-border flex flex-col transition-all duration-200`}
			>
				{/* Workspace selector */}
				<div className="p-3 border-b border-border">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								className="w-full justify-start gap-2 px-2"
							>
								<div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
									{isPersonalWorkspace
										? user?.name?.charAt(0) || "P"
										: activeOrg?.name?.charAt(0) || "?"}
								</div>
								{!sidebarCollapsed && (
									<span className="truncate text-sm font-medium">
										{isPersonalWorkspace ? "Personal" : activeOrg?.name}
									</span>
								)}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start" className="w-56">
							<DropdownMenuItem onClick={() => handleOrgSwitch(null)}>
								<div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-xs font-bold mr-2">
									{user?.name?.charAt(0) || "P"}
								</div>
								Personal
								{isPersonalWorkspace && (
									<span className="ml-auto text-primary">&#10003;</span>
								)}
							</DropdownMenuItem>

							{organizations.length > 0 && <DropdownMenuSeparator />}

							{organizations.map((org) => (
								<DropdownMenuItem
									key={org.id}
									onClick={() => handleOrgSwitch(org)}
								>
									<div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-xs font-bold mr-2">
										{org.name.charAt(0)}
									</div>
									{org.name}
									{org.id === activeOrg?.id && (
										<span className="ml-auto text-primary">&#10003;</span>
									)}
								</DropdownMenuItem>
							))}
							{activeOrg && (
								<>
									<DropdownMenuSeparator />
									<DropdownMenuItem onClick={() => setShowEditOrg(true)}>
										Edit Organization
									</DropdownMenuItem>
									<DropdownMenuItem
										className="text-destructive focus:text-destructive"
										onClick={() => setShowDeleteOrg(true)}
									>
										Delete Organization
									</DropdownMenuItem>
								</>
							)}
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={() => setShowCreateOrg(true)}>
								+ New Organization
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				{/* Projects */}
				<ScrollArea className="flex-1">
					<div className="p-3">
						{!sidebarCollapsed && (
							<div className="flex items-center justify-between mb-2">
								<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
									Projects
								</span>
								<Button
									variant="ghost"
									size="sm"
									className="h-6 w-6 p-0"
									onClick={() => setShowCreateProject(true)}
								>
									+
								</Button>
							</div>
						)}
						<div className="space-y-1">
							{projects.map((project) => (
								<div key={project.id} className="flex items-center group">
									<Link
										href={`/dashboard/projects/${project.id}`}
										className="flex-1 min-w-0"
									>
										<Button
											variant={
												pathname.includes(project.id) ? "secondary" : "ghost"
											}
											className="w-full justify-start gap-2 px-2 h-8"
											size="sm"
										>
											<div
												className="w-3 h-3 rounded-sm shrink-0"
												style={{
													backgroundColor: project.color || "#6B7280",
												}}
											/>
											{!sidebarCollapsed && (
												<span className="truncate text-sm">{project.name}</span>
											)}
										</Button>
									</Link>
									{!sidebarCollapsed && (
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													size="sm"
													className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
												>
													<span className="text-xs">
														&middot;&middot;&middot;
													</span>
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end" className="w-36">
												<DropdownMenuItem
													onClick={() => setEditingProject(project)}
												>
													Edit
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													className="text-destructive focus:text-destructive"
													onClick={() => setDeletingProject(project)}
												>
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									)}
								</div>
							))}
							{projects.length === 0 && !sidebarCollapsed && (
								<p className="text-xs text-muted-foreground px-2 py-1">
									No projects yet
								</p>
							)}
						</div>
					</div>
				</ScrollArea>

				{/* Invite Members (org only) */}
				{!isPersonalWorkspace && (
					<div className="px-3 py-2 border-t border-border">
						<Button
							variant="outline"
							size="sm"
							className="w-full justify-start gap-2 px-2 h-8"
							onClick={() => setShowInviteMembers(true)}
						>
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								className="shrink-0"
							>
								<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
								<circle cx="9" cy="7" r="4" />
								<line x1="19" y1="8" x2="19" y2="14" />
								<line x1="22" y1="11" x2="16" y2="11" />
							</svg>
							{!sidebarCollapsed && (
								<span className="text-sm">Invite Members</span>
							)}
						</Button>
					</div>
				)}

				{/* Bottom */}
				<div className="p-3 border-t border-border space-y-1">
					<Link href="/dashboard/focus">
						<Button
							variant={pathname === "/dashboard/focus" ? "secondary" : "ghost"}
							size="sm"
							className="w-full justify-start gap-2 px-2 h-8"
						>
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="shrink-0"
							>
								<circle cx="12" cy="12" r="10" />
								<circle cx="12" cy="12" r="6" />
								<circle cx="12" cy="12" r="2" />
							</svg>
							{!sidebarCollapsed && <span className="text-sm">Focus Mode</span>}
						</Button>
					</Link>
					<Button
						variant="ghost"
						size="sm"
						className="w-full justify-start gap-2 px-2 h-8"
						onClick={toggleDarkMode}
					>
						<span className="shrink-0">{darkMode ? "\u2600" : "\u25CF"}</span>
						{!sidebarCollapsed && (
							<span className="text-sm">
								{darkMode ? "Light mode" : "Dark mode"}
							</span>
						)}
					</Button>
					<Button
						variant="ghost"
						size="sm"
						className="w-full justify-start gap-2 px-2 h-8"
						onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
					>
						<span className="shrink-0">
							{sidebarCollapsed ? "\u2192" : "\u2190"}
						</span>
						{!sidebarCollapsed && <span className="text-sm">Collapse</span>}
					</Button>
				</div>
			</aside>

			{/* Main content */}
			<div className="flex-1 flex flex-col min-w-0">
				{/* Top bar */}
				<header className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0">
					<div className="text-sm font-medium text-muted-foreground">
						{isPersonalWorkspace ? "Personal Workspace" : activeOrg?.name}
					</div>
					<div className="flex items-center gap-2">
						<NotificationDropdown
							unreadCount={unreadCount}
							onMarkAllRead={async () => {
								await markAllAsRead();
							}}
						/>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="sm" className="gap-2">
									<Avatar className="h-6 w-6">
										<AvatarFallback className="text-xs">
											{user?.name?.charAt(0) || "?"}
										</AvatarFallback>
									</Avatar>
									<span className="text-sm">{user?.name}</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem className="text-xs text-muted-foreground">
									{user?.email}
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={() => setShowProfile(true)}>
									Profile Settings
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={handleSignOut}>
									Sign Out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</header>

				<main className="flex-1 overflow-hidden">{children}</main>
			</div>

			{/* Create Organization Modal */}
			{showCreateOrg && (
				<CreateOrganizationModal
					onClose={() => setShowCreateOrg(false)}
					onCreated={handleOrgCreated}
				/>
			)}

			{/* Create Project Modal */}
			{showCreateProject && (
				<CreateProjectModal
					orgId={activeOrg?.id || null}
					onClose={() => setShowCreateProject(false)}
					onCreated={handleProjectCreated}
				/>
			)}

			{/* Invite Members Modal */}
			{showInviteMembers && activeOrg && (
				<InviteMembersModal
					organization={activeOrg}
					onClose={() => setShowInviteMembers(false)}
				/>
			)}

			{/* Edit Project Modal */}
			{editingProject && (
				<EditProjectModal
					project={editingProject}
					orgId={activeOrg?.id || null}
					onClose={() => setEditingProject(null)}
					onUpdated={handleProjectUpdated}
				/>
			)}

			{/* Delete Project Confirm */}
			{deletingProject && (
				<ConfirmDeleteModal
					title="Delete Project"
					message={`Are you sure you want to delete "${deletingProject.name}"? All boards, categories, and tasks in this project will be permanently deleted.`}
					onClose={() => setDeletingProject(null)}
					onConfirm={() => handleProjectDeleted(deletingProject.id)}
				/>
			)}

			{/* Edit Organization Modal */}
			{showEditOrg && activeOrg && (
				<EditOrganizationModal
					organization={activeOrg}
					onClose={() => setShowEditOrg(false)}
					onUpdated={handleOrgUpdated}
				/>
			)}

			{/* Delete Organization Confirm */}
			{showDeleteOrg && activeOrg && (
				<ConfirmDeleteModal
					title="Delete Organization"
					message={`Are you sure you want to delete "${activeOrg.name}"? This will remove all organization data, members, and projects. This action cannot be undone.`}
					onClose={() => setShowDeleteOrg(false)}
					onConfirm={handleOrgDeleted}
				/>
			)}

			{/* Profile Modal */}
			{showProfile && user && (
				<ProfileModal
					user={user}
					onClose={() => setShowProfile(false)}
					onUpdated={() => {
						setShowProfile(false);
					}}
				/>
			)}
		</div>
	);
}

// ===========================================================================
// CreateOrganizationModal
// ===========================================================================

function CreateOrganizationModal({
	onClose,
	onCreated,
}: {
	onClose: () => void;
	onCreated: () => void;
}) {
	const createOrganization = useOrganizationStore((s) => s.createOrganization);
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");

	const handleNameChange = (val: string) => {
		setName(val);
		setSlug(
			val
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-|-$/g, "")
				.substring(0, 50)
		);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;
		setSubmitting(true);
		setError("");

		try {
			await createOrganization({
				name: name.trim(),
				slug:
					slug ||
					name
						.trim()
						.toLowerCase()
						.replace(/[^a-z0-9]+/g, "-"),
			});

			const storeState = useOrganizationStore.getState();
			if (storeState.createStatus.message) {
				setError(
					storeState.createStatus.message || "Failed to create organization"
				);
			} else {
				onCreated();
			}
		} catch {
			setError("Failed to create organization");
		}
		setSubmitting(false);
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
			onClick={onClose}
		>
			<div
				className="bg-background border border-border rounded-lg shadow-xl w-full max-w-md mx-4"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="px-6 py-4 border-b border-border">
					<h2 className="text-lg font-semibold">Create Organization</h2>
					<p className="text-sm text-muted-foreground mt-1">
						Create a team workspace to collaborate with others.
					</p>
				</div>

				<form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
					<div>
						<label className="block text-sm font-medium mb-1.5">
							Organization Name
						</label>
						<input
							autoFocus
							value={name}
							onChange={(e) => handleNameChange(e.target.value)}
							placeholder="e.g. Acme Inc"
							className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-1.5">URL Slug</label>
						<input
							value={slug}
							onChange={(e) => setSlug(e.target.value)}
							placeholder="acme-inc"
							className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring text-muted-foreground"
						/>
						<p className="text-xs text-muted-foreground mt-1">
							Used in URLs. Auto-generated from name.
						</p>
					</div>

					{error && <p className="text-sm text-destructive">{error}</p>}

					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="ghost"
							onClick={onClose}
							disabled={submitting}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={!name.trim() || submitting}>
							{submitting ? "Creating..." : "Create Organization"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}

// ===========================================================================
// CreateProjectModal
// ===========================================================================

function CreateProjectModal({
	orgId,
	onClose,
	onCreated,
}: {
	orgId: string | null;
	onClose: () => void;
	onCreated: () => void;
}) {
	const createProject = useProjectsStore((s) => s.createProject);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [color, setColor] = useState(PROJECT_COLORS[0]!.value);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;
		setSubmitting(true);
		setError("");

		try {
			await createProject(orgId, {
				name: name.trim(),
				description: description.trim() || undefined,
				color,
			});

			const storeState = useProjectsStore.getState();
			if (storeState.createStatus.message) {
				setError(storeState.createStatus.message || "Failed to create project");
			} else {
				onCreated();
			}
		} catch {
			setError("Failed to create project");
		}
		setSubmitting(false);
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
			onClick={onClose}
		>
			<div
				className="bg-background border border-border rounded-lg shadow-xl w-full max-w-md mx-4"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="px-6 py-4 border-b border-border">
					<h2 className="text-lg font-semibold">New Project</h2>
					<p className="text-sm text-muted-foreground mt-1">
						Create a new project with a Kanban board.
					</p>
				</div>

				<form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
					<div>
						<label className="block text-sm font-medium mb-1.5">
							Project Name
						</label>
						<input
							autoFocus
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. Website Redesign"
							className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-1.5">
							Description{" "}
							<span className="text-muted-foreground font-normal">
								(optional)
							</span>
						</label>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="What's this project about?"
							rows={3}
							className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-1.5">Color</label>
						<div className="flex gap-2 flex-wrap">
							{PROJECT_COLORS.map((c) => (
								<button
									key={c.value}
									type="button"
									onClick={() => setColor(c.value)}
									className={`w-8 h-8 rounded-full border-2 transition-all ${
										color === c.value
											? "border-foreground scale-110"
											: "border-transparent hover:scale-105"
									}`}
									style={{backgroundColor: c.value}}
									title={c.label}
								/>
							))}
						</div>
					</div>

					{error && <p className="text-sm text-destructive">{error}</p>}

					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="ghost"
							onClick={onClose}
							disabled={submitting}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={!name.trim() || submitting}>
							{submitting ? "Creating..." : "Create Project"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}

// ===========================================================================
// NotificationDropdown
// ===========================================================================

interface Notification {
	id: string;
	type: string;
	title: string;
	body: string | null;
	resourceType: string | null;
	resourceId: string | null;
	isRead: boolean;
	createdAt: string;
}

function NotificationDropdown({
	unreadCount,
	onMarkAllRead,
}: {
	unreadCount: number;
	onMarkAllRead: () => void;
}) {
	const fetchNotifications = useNotificationsStore((s) => s.fetchNotifications);
	const markAsRead = useNotificationsStore((s) => s.markAsRead);
	const storeNotifications = useNotificationsStore(
		(s) => s.items
	) as unknown as Notification[];
	const [open, setOpen] = useState(false);
	const [loaded, setLoaded] = useState(false);

	const loadNotifications = async () => {
		if (loaded) return;
		await fetchNotifications();
		setLoaded(true);
	};

	const handleOpen = () => {
		setOpen(!open);
		if (!open) loadNotifications();
	};

	const handleMarkAllRead = () => {
		onMarkAllRead();
	};

	const handleMarkRead = async (id: string) => {
		await markAsRead(id);
	};

	const timeAgo = (date: string) => {
		const diff = Date.now() - new Date(date).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return "just now";
		if (mins < 60) return `${mins}m ago`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	};

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="relative"
					onClick={handleOpen}
				>
					<svg
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
					>
						<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
						<path d="M13.73 21a2 2 0 0 1-3.46 0" />
					</svg>
					{unreadCount > 0 && (
						<Badge
							variant="destructive"
							className="absolute -top-1 -right-1 h-4 min-w-4 p-0 flex items-center justify-center text-[10px]"
						>
							{unreadCount}
						</Badge>
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-80">
				<div className="flex items-center justify-between px-3 py-2">
					<span className="text-sm font-medium">Notifications</span>
					{unreadCount > 0 && (
						<button
							onClick={handleMarkAllRead}
							className="text-xs text-primary hover:underline"
						>
							Mark all read
						</button>
					)}
				</div>
				<DropdownMenuSeparator />
				<ScrollArea className="max-h-80">
					{storeNotifications.length === 0 && (
						<div className="px-3 py-6 text-center text-sm text-muted-foreground">
							No notifications
						</div>
					)}
					{storeNotifications.map((n) => (
						<DropdownMenuItem
							key={n.id}
							className="flex-col items-start gap-0.5 px-3 py-2 cursor-pointer"
							onClick={() => {
								if (!n.isRead) handleMarkRead(n.id);
							}}
						>
							<div className="flex items-center gap-2 w-full">
								{!n.isRead && (
									<div className="w-2 h-2 rounded-full bg-primary shrink-0" />
								)}
								<span
									className={`text-sm truncate flex-1 ${n.isRead ? "text-muted-foreground" : "font-medium"}`}
								>
									{n.title}
								</span>
								<span className="text-xs text-muted-foreground shrink-0">
									{timeAgo(n.createdAt)}
								</span>
							</div>
							{n.body && (
								<p className="text-xs text-muted-foreground line-clamp-2 ml-4">
									{n.body}
								</p>
							)}
						</DropdownMenuItem>
					))}
				</ScrollArea>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

// ===========================================================================
// InviteMembersModal
// ===========================================================================

interface OrgMember {
	id: string;
	userId: string;
	name: string;
	email: string;
	image: string | null;
	role: string;
	title: string | null;
}

interface PendingInvite {
	id: string;
	email: string;
	role: string;
	status: string;
	expiresAt: string;
}

function InviteMembersModal({
	organization,
	onClose,
}: {
	organization: Organization;
	onClose: () => void;
}) {
	const inviteMember = useOrganizationStore((s) => s.inviteMember);
	const getFullOrganization = useOrganizationStore(
		(s) => s.getFullOrganization
	);
	const listMembersAction = useMembersStore((s) => s.listMembers);
	const storeMembers = useMembersStore(
		(s) => s.items
	) as unknown as OrgMember[];
	const updateMemberTitle = useMembersStore((s) => s.updateMemberTitle);

	const [activeTab, setActiveTab] = useState<"invite" | "members" | "link">(
		"invite"
	);
	const [email, setEmail] = useState("");
	const [role, setRole] = useState("member");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
	const [loadingMembers, setLoadingMembers] = useState(true);
	const [inviteLink, setInviteLink] = useState("");
	const [linkCopied, setLinkCopied] = useState(false);
	const [bulkEmails, setBulkEmails] = useState("");
	const [bulkMode, setBulkMode] = useState(false);
	const [editingTitle, setEditingTitle] = useState<string | null>(null);
	const [titleInput, setTitleInput] = useState("");

	useEffect(() => {
		(async () => {
			// Fetch current members via store
			await listMembersAction();

			// Fetch full org to get pending invitations
			await getFullOrganization(organization.id);
			const orgStoreState = useOrganizationStore.getState();
			if (orgStoreState.activeOrganization) {
				const fullOrg = orgStoreState.activeOrganization as unknown as {
					invitations?: PendingInvite[];
				};
				if (fullOrg.invitations) {
					setPendingInvites(
						fullOrg.invitations.filter((i) => i.status === "pending")
					);
				}
			}

			setLoadingMembers(false);
		})();
	}, [organization.id, listMembersAction, getFullOrganization]);

	const handleInvite = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email.trim()) return;
		setSubmitting(true);
		setError("");
		setSuccess("");

		await inviteMember({
			organizationId: organization.id,
			email: email.trim(),
			role,
		});

		const storeState = useOrganizationStore.getState();
		if (!storeState.inviteStatus.message) {
			setSuccess(`Invitation sent to ${email.trim()}`);
			setPendingInvites((prev) => [
				...prev,
				{
					id: Date.now().toString(),
					email: email.trim(),
					role,
					status: "pending",
					expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
				},
			]);
			setEmail("");
		} else {
			setError(storeState.inviteStatus.message || "Failed to send invitation");
		}
		setSubmitting(false);
	};

	const handleBulkInvite = async (e: React.FormEvent) => {
		e.preventDefault();
		const emails = bulkEmails
			.split(/[,\n;]+/)
			.map((e) => e.trim())
			.filter((e) => e && e.includes("@"));

		if (emails.length === 0) {
			setError("No valid email addresses found");
			return;
		}

		setSubmitting(true);
		setError("");
		setSuccess("");

		let successCount = 0;
		let failCount = 0;

		for (const addr of emails) {
			await inviteMember({
				organizationId: organization.id,
				email: addr,
				role,
			});
			const storeState = useOrganizationStore.getState();
			if (!storeState.inviteStatus.message) {
				successCount++;
				setPendingInvites((prev) => [
					...prev,
					{
						id: Date.now().toString(),
						email: addr,
						role,
						status: "pending",
						expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
					},
				]);
			} else {
				failCount++;
			}
		}

		if (successCount > 0) {
			setSuccess(
				`${successCount} invitation${successCount > 1 ? "s" : ""} sent${failCount > 0 ? `, ${failCount} failed` : ""}`
			);
			setBulkEmails("");
		} else {
			setError("All invitations failed");
		}
		setSubmitting(false);
	};

	const handleCancelInvite = async (inviteId: string) => {
		const result = await organizationService.cancelInvitation(inviteId);
		if (!result.message) {
			setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));
		}
	};

	const generateInviteLink = () => {
		// Generate a shareable link with the org ID that can be shared
		const baseUrl = window.location.origin;
		const link = `${baseUrl}/accept-invitation/${organization.id}`;
		setInviteLink(link);
	};

	const copyToClipboard = async (text: string) => {
		await navigator.clipboard.writeText(text);
		setLinkCopied(true);
		setTimeout(() => setLinkCopied(false), 2000);
	};

	const tabClass = (tab: string) =>
		`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
			activeTab === tab
				? "border-primary text-primary"
				: "border-transparent text-muted-foreground hover:text-foreground"
		}`;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
			onClick={onClose}
		>
			<div
				className="bg-background border border-border rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="px-6 py-4 border-b border-border shrink-0">
					<h2 className="text-lg font-semibold">Manage Members</h2>
					<p className="text-sm text-muted-foreground mt-1">
						Invite people to{" "}
						<span className="font-medium text-foreground">
							{organization.name}
						</span>
					</p>
				</div>

				{/* Tabs */}
				<div className="flex border-b border-border shrink-0">
					<button
						className={tabClass("invite")}
						onClick={() => setActiveTab("invite")}
					>
						Invite
					</button>
					<button
						className={tabClass("members")}
						onClick={() => setActiveTab("members")}
					>
						Members ({storeMembers.length})
					</button>
					<button
						className={tabClass("link")}
						onClick={() => setActiveTab("link")}
					>
						Invite Link
					</button>
				</div>

				{/* Tab content */}
				<div className="flex-1 overflow-y-auto">
					{/* Invite Tab */}
					{activeTab === "invite" && (
						<div className="px-6 py-4 space-y-4">
							{/* Toggle single/bulk */}
							<div className="flex items-center gap-2">
								<button
									className={`text-xs px-3 py-1 rounded-full transition-colors ${!bulkMode ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
									onClick={() => setBulkMode(false)}
								>
									Single
								</button>
								<button
									className={`text-xs px-3 py-1 rounded-full transition-colors ${bulkMode ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
									onClick={() => setBulkMode(true)}
								>
									Bulk Invite
								</button>
							</div>

							{!bulkMode ? (
								<form onSubmit={handleInvite} className="space-y-3">
									<div>
										<label className="block text-sm font-medium mb-1.5">
											Email Address
										</label>
										<input
											autoFocus
											type="email"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											placeholder="colleague@example.com"
											className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium mb-1.5">
											Role
										</label>
										<select
											value={role}
											onChange={(e) => setRole(e.target.value)}
											className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
										>
											<option value="member">Member</option>
											<option value="admin">Admin</option>
											<option value="owner">Owner</option>
										</select>
									</div>

									<Button
										type="submit"
										className="w-full"
										disabled={!email.trim() || submitting}
									>
										{submitting ? "Sending..." : "Send Invitation"}
									</Button>
								</form>
							) : (
								<form onSubmit={handleBulkInvite} className="space-y-3">
									<div>
										<label className="block text-sm font-medium mb-1.5">
											Email Addresses
											<span className="text-muted-foreground font-normal ml-1">
												(one per line, or comma/semicolon separated)
											</span>
										</label>
										<textarea
											autoFocus
											value={bulkEmails}
											onChange={(e) => setBulkEmails(e.target.value)}
											placeholder={
												"alice@example.com\nbob@example.com\ncharlie@example.com"
											}
											rows={5}
											className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none font-mono"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium mb-1.5">
											Role for all
										</label>
										<select
											value={role}
											onChange={(e) => setRole(e.target.value)}
											className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
										>
											<option value="member">Member</option>
											<option value="admin">Admin</option>
										</select>
									</div>

									<Button
										type="submit"
										className="w-full"
										disabled={!bulkEmails.trim() || submitting}
									>
										{submitting ? "Sending..." : "Send All Invitations"}
									</Button>
								</form>
							)}

							{error && <p className="text-sm text-destructive">{error}</p>}
							{success && <p className="text-sm text-green-600">{success}</p>}

							{/* Pending invitations */}
							{pendingInvites.length > 0 && (
								<div>
									<h3 className="text-sm font-medium mb-2 text-muted-foreground">
										Pending Invitations ({pendingInvites.length})
									</h3>
									<div className="space-y-2">
										{pendingInvites.map((invite) => (
											<div
												key={invite.id}
												className="flex items-center justify-between px-3 py-2 border border-border rounded-md"
											>
												<div>
													<p className="text-sm">{invite.email}</p>
													<p className="text-xs text-muted-foreground capitalize">
														{invite.role}
													</p>
												</div>
												<Button
													variant="ghost"
													size="sm"
													className="h-7 text-xs text-destructive"
													onClick={() => handleCancelInvite(invite.id)}
												>
													Cancel
												</Button>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					)}

					{/* Members Tab */}
					{activeTab === "members" && (
						<div className="px-6 py-4">
							{loadingMembers ? (
								<div className="space-y-3">
									{[1, 2, 3].map((i) => (
										<div
											key={i}
											className="flex items-center gap-3 animate-pulse"
										>
											<div className="w-8 h-8 rounded-full bg-muted" />
											<div className="flex-1 space-y-1.5">
												<div className="h-3 w-24 bg-muted rounded" />
												<div className="h-2.5 w-32 bg-muted rounded" />
											</div>
										</div>
									))}
								</div>
							) : storeMembers.length === 0 ? (
								<p className="text-sm text-muted-foreground text-center py-8">
									No members yet. Invite someone to get started.
								</p>
							) : (
								<div className="space-y-2">
									{storeMembers.map((member) => (
										<div
											key={member.id}
											className="px-3 py-2.5 border border-border rounded-md"
										>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-3 min-w-0">
													<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
														{member.name?.charAt(0) ||
															member.email.charAt(0).toUpperCase()}
													</div>
													<div className="min-w-0">
														<p className="text-sm font-medium truncate">
															{member.name || "Unknown"}
														</p>
														<p className="text-xs text-muted-foreground truncate">
															{member.email}
														</p>
													</div>
												</div>
												<div className="flex items-center gap-2 shrink-0">
													<span
														className={`text-xs px-2 py-0.5 rounded-full capitalize ${
															member.role === "owner"
																? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
																: member.role === "admin"
																	? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
																	: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
														}`}
													>
														{member.role}
													</span>
												</div>
											</div>
											{/* Title row */}
											<div className="mt-1.5 ml-11">
												{editingTitle === member.id ? (
													<div className="flex items-center gap-1.5">
														<input
															autoFocus
															value={titleInput}
															onChange={(e) => setTitleInput(e.target.value)}
															onKeyDown={async (e) => {
																if (e.key === "Enter") {
																	const newTitle = titleInput.trim() || null;
																	await updateMemberTitle(
																		member.id,
																		newTitle as string
																	);
																	// Re-fetch members to get updated data
																	await listMembersAction();
																	setEditingTitle(null);
																} else if (e.key === "Escape") {
																	setEditingTitle(null);
																}
															}}
															placeholder="e.g. Lead Developer, Designer..."
															className="flex-1 px-2 py-0.5 text-xs border border-input rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
														/>
														<Button
															variant="ghost"
															size="sm"
															className="h-5 w-5 p-0 text-xs"
															onClick={async () => {
																const newTitle = titleInput.trim() || null;
																await updateMemberTitle(
																	member.id,
																	newTitle as string
																);
																// Re-fetch members to get updated data
																await listMembersAction();
																setEditingTitle(null);
															}}
														>
															&#10003;
														</Button>
														<Button
															variant="ghost"
															size="sm"
															className="h-5 w-5 p-0 text-xs"
															onClick={() => setEditingTitle(null)}
														>
															&#10005;
														</Button>
													</div>
												) : (
													<button
														onClick={() => {
															setEditingTitle(member.id);
															setTitleInput(member.title || "");
														}}
														className="text-xs text-muted-foreground hover:text-foreground transition-colors"
													>
														{member.title ? (
															<span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
																{member.title}
															</span>
														) : (
															<span className="italic opacity-50">
																+ Add title
															</span>
														)}
													</button>
												)}
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					)}

					{/* Invite Link Tab */}
					{activeTab === "link" && (
						<div className="px-6 py-4 space-y-4">
							<p className="text-sm text-muted-foreground">
								Generate a shareable invite link that anyone can use to join
								your organization.
							</p>

							{!inviteLink ? (
								<Button onClick={generateInviteLink} className="w-full">
									Generate Invite Link
								</Button>
							) : (
								<div className="space-y-3">
									<div className="flex gap-2">
										<input
											readOnly
											value={inviteLink}
											className="flex-1 px-3 py-2 text-sm border border-input rounded-md bg-muted/50 font-mono text-xs"
										/>
										<Button
											variant="outline"
											onClick={() => copyToClipboard(inviteLink)}
											className="shrink-0"
										>
											{linkCopied ? "Copied!" : "Copy"}
										</Button>
									</div>
									<p className="text-xs text-muted-foreground">
										Share this link with anyone you want to invite. They will
										need to sign in or create an account to join.
									</p>
								</div>
							)}

							<div className="border-t border-border pt-4">
								<h3 className="text-sm font-medium mb-2">Share via</h3>
								<div className="grid grid-cols-3 gap-2">
									<Button
										variant="outline"
										size="sm"
										className="h-auto py-3 flex-col gap-1"
										onClick={() => {
											if (!inviteLink) generateInviteLink();
											const link =
												inviteLink ||
												`${window.location.origin}/accept-invitation/${organization.id}`;
											window.open(
												`mailto:?subject=Join ${organization.name}&body=You've been invited to join ${organization.name}! Click here to accept: ${encodeURIComponent(link)}`,
												"_self"
											);
										}}
									>
										<svg
											width="18"
											height="18"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
										>
											<rect width="20" height="16" x="2" y="4" rx="2" />
											<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
										</svg>
										<span className="text-xs">Email</span>
									</Button>
									<Button
										variant="outline"
										size="sm"
										className="h-auto py-3 flex-col gap-1"
										onClick={() => {
											if (!inviteLink) generateInviteLink();
											const link =
												inviteLink ||
												`${window.location.origin}/accept-invitation/${organization.id}`;
											window.open(
												`https://wa.me/?text=${encodeURIComponent(`Join ${organization.name}! ${link}`)}`,
												"_blank"
											);
										}}
									>
										<svg
											width="18"
											height="18"
											viewBox="0 0 24 24"
											fill="currentColor"
										>
											<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
										</svg>
										<span className="text-xs">WhatsApp</span>
									</Button>
									<Button
										variant="outline"
										size="sm"
										className="h-auto py-3 flex-col gap-1"
										onClick={() => {
											if (!inviteLink) generateInviteLink();
											const link =
												inviteLink ||
												`${window.location.origin}/accept-invitation/${organization.id}`;
											copyToClipboard(link);
										}}
									>
										<svg
											width="18"
											height="18"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
										>
											<rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
											<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
										</svg>
										<span className="text-xs">Copy Link</span>
									</Button>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="px-6 py-3 border-t border-border flex justify-end shrink-0">
					<Button variant="ghost" onClick={onClose}>
						Close
					</Button>
				</div>
			</div>
		</div>
	);
}

// ===========================================================================
// EditProjectModal
// ===========================================================================

function EditProjectModal({
	project,
	orgId,
	onClose,
	onUpdated,
}: {
	project: Project;
	orgId: string | null;
	onClose: () => void;
	onUpdated: () => void;
}) {
	const updateProject = useProjectsStore((s) => s.updateProject);
	const [name, setName] = useState(project.name);
	const [description, setDescription] = useState(project.description || "");
	const [color, setColor] = useState(project.color || PROJECT_COLORS[0]!.value);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;
		setSubmitting(true);
		setError("");

		try {
			await updateProject(orgId, project.id, {
				name: name.trim(),
				description: description.trim() || null,
				color,
			});

			const storeState = useProjectsStore.getState();
			if (storeState.updateStatus.message) {
				setError(storeState.updateStatus.message || "Failed to update project");
			} else {
				onUpdated();
			}
		} catch {
			setError("Failed to update project");
		}
		setSubmitting(false);
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
			onClick={onClose}
		>
			<div
				className="bg-background border border-border rounded-lg shadow-xl w-full max-w-md mx-4"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="px-6 py-4 border-b border-border">
					<h2 className="text-lg font-semibold">Edit Project</h2>
					<p className="text-sm text-muted-foreground mt-1">
						Update project details.
					</p>
				</div>

				<form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
					<div>
						<label className="block text-sm font-medium mb-1.5">
							Project Name
						</label>
						<input
							autoFocus
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. Website Redesign"
							className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-1.5">
							Description{" "}
							<span className="text-muted-foreground font-normal">
								(optional)
							</span>
						</label>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="What's this project about?"
							rows={3}
							className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-1.5">Color</label>
						<div className="flex gap-2 flex-wrap">
							{PROJECT_COLORS.map((c) => (
								<button
									key={c.value}
									type="button"
									onClick={() => setColor(c.value)}
									className={`w-8 h-8 rounded-full border-2 transition-all ${
										color === c.value
											? "border-foreground scale-110"
											: "border-transparent hover:scale-105"
									}`}
									style={{backgroundColor: c.value}}
									title={c.label}
								/>
							))}
						</div>
					</div>

					{error && <p className="text-sm text-destructive">{error}</p>}

					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="ghost"
							onClick={onClose}
							disabled={submitting}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={!name.trim() || submitting}>
							{submitting ? "Saving..." : "Save Changes"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}

// ===========================================================================
// EditOrganizationModal
// ===========================================================================

function EditOrganizationModal({
	organization,
	onClose,
	onUpdated,
}: {
	organization: Organization;
	onClose: () => void;
	onUpdated: (org: Organization) => void;
}) {
	const updateOrganization = useOrganizationStore((s) => s.updateOrganization);
	const [name, setName] = useState(organization.name);
	const [slug, setSlug] = useState(organization.slug);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;
		setSubmitting(true);
		setError("");

		try {
			await updateOrganization({
				organizationId: organization.id,
				name: name.trim(),
				slug: slug.trim() || undefined,
			});

			const storeState = useOrganizationStore.getState();
			if (storeState.updateStatus.message) {
				setError(
					storeState.updateStatus.message || "Failed to update organization"
				);
			} else {
				onUpdated({
					...organization,
					name: name.trim(),
					slug: slug.trim() || organization.slug,
				});
			}
		} catch {
			setError("Failed to update organization");
		}
		setSubmitting(false);
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
			onClick={onClose}
		>
			<div
				className="bg-background border border-border rounded-lg shadow-xl w-full max-w-md mx-4"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="px-6 py-4 border-b border-border">
					<h2 className="text-lg font-semibold">Edit Organization</h2>
					<p className="text-sm text-muted-foreground mt-1">
						Update organization details.
					</p>
				</div>

				<form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
					<div>
						<label className="block text-sm font-medium mb-1.5">
							Organization Name
						</label>
						<input
							autoFocus
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. Acme Inc"
							className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-1.5">URL Slug</label>
						<input
							value={slug}
							onChange={(e) => setSlug(e.target.value)}
							placeholder="acme-inc"
							className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring text-muted-foreground"
						/>
					</div>

					{error && <p className="text-sm text-destructive">{error}</p>}

					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="ghost"
							onClick={onClose}
							disabled={submitting}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={!name.trim() || submitting}>
							{submitting ? "Saving..." : "Save Changes"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}

// ===========================================================================
// ConfirmDeleteModal
// ===========================================================================

function ConfirmDeleteModal({
	title,
	message,
	onClose,
	onConfirm,
}: {
	title: string;
	message: string;
	onClose: () => void;
	onConfirm: () => void;
}) {
	const [confirming, setConfirming] = useState(false);

	const handleConfirm = async () => {
		setConfirming(true);
		await onConfirm();
		setConfirming(false);
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
			onClick={onClose}
		>
			<div
				className="bg-background border border-border rounded-lg shadow-xl w-full max-w-sm mx-4"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="px-6 py-4 border-b border-border">
					<h2 className="text-lg font-semibold text-destructive">{title}</h2>
				</div>

				<div className="px-6 py-4">
					<p className="text-sm text-muted-foreground">{message}</p>
				</div>

				<div className="px-6 py-3 border-t border-border flex justify-end gap-2">
					<Button variant="ghost" onClick={onClose} disabled={confirming}>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={handleConfirm}
						disabled={confirming}
					>
						{confirming ? "Deleting..." : "Delete"}
					</Button>
				</div>
			</div>
		</div>
	);
}

// ===========================================================================
// ProfileModal
// ===========================================================================

function ProfileModal({
	user,
	onClose,
	onUpdated,
}: {
	user: User;
	onClose: () => void;
	onUpdated: () => void;
}) {
	const updateUserProfile = useUserStore((s) => s.updateUserProfile);
	const [name, setName] = useState(user.name);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;
		setSubmitting(true);
		setError("");
		setSuccess("");

		try {
			await updateUserProfile({name: name.trim()});

			const storeState = useUserStore.getState();
			if (storeState.updateStatus.message) {
				setError(storeState.updateStatus.message || "Failed to update profile");
			} else {
				setSuccess("Profile updated successfully");
				onUpdated();
			}
		} catch {
			setError("Failed to update profile");
		}
		setSubmitting(false);
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
			onClick={onClose}
		>
			<div
				className="bg-background border border-border rounded-lg shadow-xl w-full max-w-md mx-4"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="px-6 py-4 border-b border-border">
					<h2 className="text-lg font-semibold">Profile Settings</h2>
					<p className="text-sm text-muted-foreground mt-1">
						Update your personal information.
					</p>
				</div>

				<form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
					{/* Avatar preview */}
					<div className="flex items-center gap-4">
						<div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
							{name?.charAt(0)?.toUpperCase() || "?"}
						</div>
						<div>
							<p className="text-sm font-medium">{user.email}</p>
							<p className="text-xs text-muted-foreground">
								Member since {new Date().toLocaleDateString()}
							</p>
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium mb-1.5">
							Display Name
						</label>
						<input
							autoFocus
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Your name"
							className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-1.5">Email</label>
						<input
							readOnly
							value={user.email}
							className="w-full px-3 py-2 text-sm border border-input rounded-md bg-muted/50 text-muted-foreground cursor-not-allowed"
						/>
						<p className="text-xs text-muted-foreground mt-1">
							Email cannot be changed.
						</p>
					</div>

					{error && <p className="text-sm text-destructive">{error}</p>}
					{success && <p className="text-sm text-green-600">{success}</p>}

					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="ghost"
							onClick={onClose}
							disabled={submitting}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={!name.trim() || submitting}>
							{submitting ? "Saving..." : "Save Changes"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
