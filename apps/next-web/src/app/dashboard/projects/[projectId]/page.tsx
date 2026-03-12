"use client";

import {useEffect, useState, useCallback} from "react";
import {useRouter, useParams} from "next/navigation";
import {boardService} from "@/services/api/PluteoJS";
import {Button} from "@/components/lib/shadcn/ui/button";

export default function ProjectPage() {
	const router = useRouter();
	const params = useParams();
	const projectId = params.projectId as string;

	const [noBoards, setNoBoards] = useState(false);
	const [creating, setCreating] = useState(false);

	useEffect(() => {
		(async () => {
			const result = await boardService.getBoards(projectId);
			if (!result.error && result.data) {
				const boards = result.data as unknown as {id: string}[];
				if (boards.length > 0) {
					router.replace(
						`/dashboard/projects/${projectId}/boards/${boards[0]!.id}`
					);
				} else {
					setNoBoards(true);
				}
			}
		})();
	}, [projectId, router]);

	const handleCreateBoard = useCallback(
		async (type: "status" | "category") => {
			setCreating(true);
			const name = type === "status" ? "Status Board" : "Category Board";
			const result = await boardService.createBoard(projectId, {name, type});
			if (!result.error && result.data) {
				const board = result.data as unknown as {id: string};
				router.replace(`/dashboard/projects/${projectId}/boards/${board.id}`);
			}
			setCreating(false);
		},
		[projectId, router]
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
