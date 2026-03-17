"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/lib/shadcn/ui/card";
import {Button} from "@/components/lib/shadcn/ui/button";
import {Skeleton} from "@/components/lib/shadcn/ui/skeleton";
import {useProjectsStore} from "@/store";
import {boardService} from "@/services/api/PluteoJS";

interface Project {
	id: string;
	name: string;
	description: string | null;
	color: string | null;
	createdAt: string;
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

export default function DashboardPage() {
	const router = useRouter();
	const projects = useProjectsStore((s) => s.items) as unknown as Project[];
	const fetchStatus = useProjectsStore((s) => s.fetchStatus);
	const [showCreateProject, setShowCreateProject] = useState(false);

	// Projects are already fetched by the dashboard layout - no need to re-fetch
	const loading = fetchStatus.isLoading;

	const handleProjectClick = async (project: Project) => {
		const result = await boardService.getBoards(project.id);
		if (!result.error && result.data) {
			const boards = result.data as unknown as {id: string}[];
			if (boards.length > 0) {
				router.push(
					`/dashboard/projects/${project.id}/boards/${boards[0]!.id}`
				);
			}
		}
	};

	const handleProjectCreated = () => {
		setShowCreateProject(false);
	};

	if (loading) {
		return (
			<div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{[1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-36" />
				))}
			</div>
		);
	}

	return (
		<div className="p-6">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold">Projects</h1>
				<Button onClick={() => setShowCreateProject(true)}>
					+ New Project
				</Button>
			</div>

			{projects.length === 0 ? (
				<div className="text-center py-20">
					<p className="text-muted-foreground text-lg mb-2">No projects yet</p>
					<p className="text-muted-foreground text-sm mb-4">
						Create your first project to get started.
					</p>
					<Button onClick={() => setShowCreateProject(true)}>
						Create Project
					</Button>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{projects.map((project) => (
						<Card
							key={project.id}
							className="cursor-pointer hover:shadow-md transition-shadow group"
							onClick={() => handleProjectClick(project)}
						>
							<div
								className="h-2 rounded-t-lg"
								style={{
									backgroundColor: project.color || "#6B7280",
								}}
							/>
							<CardHeader className="pb-2">
								<CardTitle className="text-lg group-hover:text-primary transition-colors">
									{project.name}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground line-clamp-2">
									{project.description || "No description"}
								</p>
								<p className="text-xs text-muted-foreground mt-2">
									Created {new Date(project.createdAt).toLocaleDateString()}
								</p>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Create Project Modal */}
			{showCreateProject && (
				<CreateProjectModal
					onClose={() => setShowCreateProject(false)}
					onCreated={handleProjectCreated}
				/>
			)}
		</div>
	);
}

// ===========================================================================
// CreateProjectModal
// ===========================================================================

function CreateProjectModal({
	onClose,
	onCreated,
}: {
	onClose: () => void;
	onCreated: (project: Project) => void;
}) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [color, setColor] = useState(PROJECT_COLORS[0]!.value);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");

	const createProject = useProjectsStore((s) => s.createProject);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;
		setSubmitting(true);
		setError("");

		const activeOrgId = localStorage.getItem("activeOrgId");
		const orgId =
			activeOrgId && activeOrgId !== "personal" ? activeOrgId : null;
		await createProject(orgId, {
			name: name.trim(),
			description: description.trim() || undefined,
			color,
		});

		const state = useProjectsStore.getState();
		if (state.createStatus.responseStatus === "SUCCESS") {
			const latest = state.items[state.items.length - 1] as unknown as Project;
			onCreated(latest);
		} else {
			setError(state.createStatus.message || "Failed to create project");
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
