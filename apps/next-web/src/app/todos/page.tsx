"use client";

import {useEffect, useState, useCallback} from "react";
import {useRouter} from "next/navigation";

import {Button} from "@/components/lib/shadcn/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/lib/shadcn/ui/card";
import {authService, todoService} from "@/services/api/PluteoJS";
import type {AuthUser} from "@/services/api/PluteoJS/AuthService";
import type {
	Todo,
	CreateTodoInput,
	UpdateTodoInput,
} from "@/services/api/PluteoJS/TodoService";

export default function TodosPage() {
	const router = useRouter();
	const [user, setUser] = useState<AuthUser | null>(null);
	const [todos, setTodos] = useState<Todo[]>([]);
	const [loading, setLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

	// Form state
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [dueAt, setDueAt] = useState("");
	const [notifyAt, setNotifyAt] = useState("");

	const fetchTodos = useCallback(async () => {
		const result = await todoService.getTodos();
		if (!result.error && result.data) {
			setTodos(result.data as unknown as Todo[]);
		}
	}, []);

	useEffect(() => {
		const checkAuth = async () => {
			const sessionResult = await authService.getSession();
			if (sessionResult.error || !sessionResult.data) {
				router.push("/login");
				return;
			}

			const sessionData = sessionResult.data as unknown as {user: AuthUser};
			setUser(sessionData.user);
			await fetchTodos();
			setLoading(false);
		};

		checkAuth();
	}, [router, fetchTodos]);

	const resetForm = () => {
		setTitle("");
		setDescription("");
		setDueAt("");
		setNotifyAt("");
		setEditingTodo(null);
		setShowForm(false);
	};

	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault();

		const input: CreateTodoInput = {title};
		if (description) input.description = description;
		if (dueAt) input.dueAt = new Date(dueAt).toISOString();
		if (notifyAt) input.notifyAt = new Date(notifyAt).toISOString();

		await todoService.createTodo(input);
		resetForm();
		await fetchTodos();
	};

	const handleUpdate = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingTodo) return;

		const input: UpdateTodoInput = {};
		if (title !== editingTodo.title) input.title = title;
		if (description !== (editingTodo.description || ""))
			input.description = description || null;
		if (dueAt) {
			input.dueAt = new Date(dueAt).toISOString();
		} else if (editingTodo.dueAt && !dueAt) {
			input.dueAt = null;
		}
		if (notifyAt) {
			input.notifyAt = new Date(notifyAt).toISOString();
		} else if (editingTodo.notifyAt && !notifyAt) {
			input.notifyAt = null;
		}

		await todoService.updateTodo(editingTodo.id, input);
		resetForm();
		await fetchTodos();
	};

	const handleToggleComplete = async (todo: Todo) => {
		await todoService.updateTodo(todo.id, {completed: !todo.completed});
		await fetchTodos();
	};

	const handleDelete = async (todoId: string) => {
		await todoService.deleteTodo(todoId);
		await fetchTodos();
	};

	const startEdit = (todo: Todo) => {
		setEditingTodo(todo);
		setTitle(todo.title);
		setDescription(todo.description || "");
		setDueAt(todo.dueAt ? toLocalDatetime(todo.dueAt) : "");
		setNotifyAt(todo.notifyAt ? toLocalDatetime(todo.notifyAt) : "");
		setShowForm(true);
	};

	const handleSignOut = async () => {
		await authService.signOut();
		router.push("/login");
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<p className="text-muted-foreground">Loading...</p>
			</div>
		);
	}

	const pendingTodos = todos.filter((t) => !t.completed);
	const completedTodos = todos.filter((t) => t.completed);

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="border-b border-border">
				<div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
					<h1 className="text-xl font-semibold">Todo App</h1>
					<div className="flex items-center gap-3">
						<span className="text-sm text-muted-foreground">{user?.name}</span>
						<Button variant="outline" size="sm" onClick={handleSignOut}>
							Sign Out
						</Button>
					</div>
				</div>
			</header>

			<main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
				{/* Add / Edit Form */}
				{showForm ? (
					<Card>
						<CardHeader>
							<CardTitle>{editingTodo ? "Edit Todo" : "New Todo"}</CardTitle>
						</CardHeader>
						<CardContent>
							<form
								onSubmit={editingTodo ? handleUpdate : handleCreate}
								className="space-y-4"
							>
								<div>
									<label
										htmlFor="title"
										className="block text-sm font-medium mb-1"
									>
										Title
									</label>
									<input
										id="title"
										type="text"
										value={title}
										onChange={(e) => setTitle(e.target.value)}
										required
										className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
										placeholder="What needs to be done?"
									/>
								</div>

								<div>
									<label
										htmlFor="description"
										className="block text-sm font-medium mb-1"
									>
										Description
									</label>
									<textarea
										id="description"
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										rows={2}
										className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
										placeholder="Optional details..."
									/>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div>
										<label
											htmlFor="dueAt"
											className="block text-sm font-medium mb-1"
										>
											Due Date
										</label>
										<input
											id="dueAt"
											type="datetime-local"
											value={dueAt}
											onChange={(e) => setDueAt(e.target.value)}
											className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
										/>
									</div>

									<div>
										<label
											htmlFor="notifyAt"
											className="block text-sm font-medium mb-1"
										>
											Remind At
										</label>
										<input
											id="notifyAt"
											type="datetime-local"
											value={notifyAt}
											onChange={(e) => setNotifyAt(e.target.value)}
											className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
										/>
									</div>
								</div>

								<div className="flex gap-2">
									<Button type="submit">
										{editingTodo ? "Update" : "Add Todo"}
									</Button>
									<Button type="button" variant="outline" onClick={resetForm}>
										Cancel
									</Button>
								</div>
							</form>
						</CardContent>
					</Card>
				) : (
					<Button onClick={() => setShowForm(true)} className="w-full">
						+ Add New Todo
					</Button>
				)}

				{/* Pending Todos */}
				{pendingTodos.length > 0 && (
					<div className="space-y-2">
						<h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
							Pending ({pendingTodos.length})
						</h2>
						{pendingTodos.map((todo) => (
							<TodoItem
								key={todo.id}
								todo={todo}
								onToggle={handleToggleComplete}
								onEdit={startEdit}
								onDelete={handleDelete}
							/>
						))}
					</div>
				)}

				{/* Completed Todos */}
				{completedTodos.length > 0 && (
					<div className="space-y-2">
						<h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
							Completed ({completedTodos.length})
						</h2>
						{completedTodos.map((todo) => (
							<TodoItem
								key={todo.id}
								todo={todo}
								onToggle={handleToggleComplete}
								onEdit={startEdit}
								onDelete={handleDelete}
							/>
						))}
					</div>
				)}

				{/* Empty State */}
				{todos.length === 0 && (
					<div className="text-center py-12">
						<p className="text-muted-foreground text-lg">No todos yet</p>
						<p className="text-muted-foreground text-sm mt-1">
							Click the button above to create your first todo.
						</p>
					</div>
				)}
			</main>
		</div>
	);
}

function TodoItem({
	todo,
	onToggle,
	onEdit,
	onDelete,
}: {
	todo: Todo;
	onToggle: (todo: Todo) => void;
	onEdit: (todo: Todo) => void;
	onDelete: (todoId: string) => void;
}) {
	const formatDate = (dateStr: string | null) => {
		if (!dateStr) return null;
		return new Date(dateStr).toLocaleString();
	};

	return (
		<Card className={todo.completed ? "opacity-60" : ""}>
			<CardContent className="flex items-start gap-3 py-4">
				{/* Checkbox */}
				<button
					onClick={() => onToggle(todo)}
					className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
						todo.completed
							? "bg-primary border-primary text-primary-foreground"
							: "border-muted-foreground hover:border-primary"
					}`}
				>
					{todo.completed && (
						<svg
							width="12"
							height="12"
							viewBox="0 0 12 12"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							<path d="M2 6l3 3 5-5" />
						</svg>
					)}
				</button>

				{/* Content */}
				<div className="flex-1 min-w-0">
					<p
						className={`font-medium ${
							todo.completed ? "line-through text-muted-foreground" : ""
						}`}
					>
						{todo.title}
					</p>
					{todo.description && (
						<p className="text-sm text-muted-foreground mt-0.5">
							{todo.description}
						</p>
					)}
					<div className="flex flex-wrap gap-3 mt-1">
						{todo.dueAt && (
							<span className="text-xs text-muted-foreground">
								Due: {formatDate(todo.dueAt)}
							</span>
						)}
						{todo.notifyAt && (
							<span className="text-xs text-muted-foreground">
								Remind: {formatDate(todo.notifyAt)}
								{todo.notified && " (sent)"}
							</span>
						)}
					</div>
				</div>

				{/* Actions */}
				<div className="flex gap-1 shrink-0">
					<Button variant="ghost" size="sm" onClick={() => onEdit(todo)}>
						Edit
					</Button>
					<Button
						variant="ghost"
						size="sm"
						className="text-destructive hover:text-destructive"
						onClick={() => onDelete(todo.id)}
					>
						Delete
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

function toLocalDatetime(isoString: string): string {
	const date = new Date(isoString);
	const offset = date.getTimezoneOffset();
	const local = new Date(date.getTime() - offset * 60000);
	return local.toISOString().slice(0, 16);
}
