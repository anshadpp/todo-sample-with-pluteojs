"use client";

import {Suspense, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";

import {Button} from "@/components/lib/shadcn/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/lib/shadcn/ui/card";
import {authService} from "@/services/api/PluteoJS";

export default function LoginPage() {
	return (
		<Suspense>
			<LoginForm />
		</Suspense>
	);
}

function LoginForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const redirectUrl = searchParams.get("redirect");
	const [isSignUp, setIsSignUp] = useState(false);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			if (isSignUp) {
				const result = await authService.signUp(name, email, password);
				if (result.error) {
					setError(String(result.message || result.error || "Sign up failed"));
					setLoading(false);
					return;
				}
			} else {
				const result = await authService.signIn(email, password);
				if (result.error) {
					setError(
						String(result.message || result.error || "Invalid credentials")
					);
					setLoading(false);
					return;
				}
			}

			router.push(redirectUrl || "/dashboard");
		} catch {
			setError("Something went wrong. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-background px-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-2xl text-center">
						{isSignUp ? "Create Account" : "Sign In"}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						{isSignUp && (
							<div>
								<label
									htmlFor="name"
									className="block text-sm font-medium mb-1"
								>
									Name
								</label>
								<input
									id="name"
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									required={isSignUp}
									className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
									placeholder="Your name"
								/>
							</div>
						)}

						<div>
							<label htmlFor="email" className="block text-sm font-medium mb-1">
								Email
							</label>
							<input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
								placeholder="you@example.com"
							/>
						</div>

						<div>
							<label
								htmlFor="password"
								className="block text-sm font-medium mb-1"
							>
								Password
							</label>
							<input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								minLength={8}
								className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
								placeholder="Min 8 characters"
							/>
						</div>

						{error && <p className="text-sm text-destructive">{error}</p>}

						<Button type="submit" className="w-full" disabled={loading}>
							{loading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
						</Button>
					</form>

					<p className="text-center text-sm text-muted-foreground mt-4">
						{isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
						<button
							type="button"
							onClick={() => {
								setIsSignUp(!isSignUp);
								setError("");
							}}
							className="text-primary underline-offset-4 hover:underline"
						>
							{isSignUp ? "Sign In" : "Sign Up"}
						</button>
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
