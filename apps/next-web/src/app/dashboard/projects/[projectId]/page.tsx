"use client";

import {useEffect, useState, useCallback} from "react";
import {useRouter, useParams} from "next/navigation";
import {useBoardsStore} from "@/store";
import {Button} from "@/components/lib/shadcn/ui/button";

export default function ProjectPage() {
	const router = useRouter();
	const params = useParams();
	const projectId = params.projectId as string;

	const fetchBoards = useBoardsStore((s) => s.fetchBoards);
	const createBoard = useBoardsStore((s) => s.createBoard);

	const [noBoards, setNoBoards] = useState(false);
	const [creating, setCreating] = useState(false);

	useEffect(() => {
		(async () => {
			await fetchBoards(projectId);
			const state = useBoardsStore.getState();
			const boardItems = state.items as unknown as {id: string}[];
			if (boardItems.length > 0) {
				router.replace(
					`/dashboard/projects/${projectId}/boards/${boardItems[0]!.id}`
				);
			} else {
				setNoBoards(true);
			}
		})();
	}, [projectId, router, fetchBoards]);

	const handleCreateBoard = useCallback(
		async (type: "status" | "category") => {
			setCreating(true);
			const name = type === "status" ? "Status Board" : "Category Board";
			await createBoard(projectId, {name, type});
			const state = useBoardsStore.getState();
			const latest = state.items[state.items.length - 1] as unknown as {
				id: string;
			};
			if (latest) {
				router.replace(`/dashboard/projects/${projectId}/boards/${latest.id}`);
			}
			setCreating(false);
		},
		[projectId, router, createBoard]
	);

	if (noBoards) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-center space-y-4">
					<p className="text-muted-foreground">
						No boards yet. Create one to get started.
					</p>
					<div className="flex gap-3 justify-center">
						<Button
							onClick={() => handleCreateBoard("status")}
							disabled={creating}
						>
							{creating ? "Creating..." : "Create Status Board"}
						</Button>
						<Button
							variant="outline"
							onClick={() => handleCreateBoard("category")}
							disabled={creating}
						>
							{creating ? "Creating..." : "Create Category Board"}
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex items-center justify-center h-full">
			<p className="text-muted-foreground">Loading board...</p>
		</div>
	);
}
