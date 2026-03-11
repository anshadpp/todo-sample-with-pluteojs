"use client";

import {useEffect} from "react";
import {useRouter, useParams} from "next/navigation";
import {boardService} from "@/services/api/PluteoJS";

export default function ProjectPage() {
	const router = useRouter();
	const params = useParams();

	useEffect(() => {
		(async () => {
			const result = await boardService.getBoards(params.projectId as string);
			if (!result.error && result.data) {
				const boards = result.data as unknown as {id: string}[];
				if (boards.length > 0) {
					router.replace(
						`/dashboard/projects/${params.projectId}/boards/${boards[0]!.id}`
					);
				}
			}
		})();
	}, [params.projectId, router]);

	return (
		<div className="flex items-center justify-center h-full">
			<p className="text-muted-foreground">Loading board...</p>
		</div>
	);
}
