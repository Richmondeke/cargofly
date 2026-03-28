"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useAuth } from "@/contexts/AuthContext";
import AuthLayout from "@/components/auth/AuthLayout";

export default function ForgotPasswordPage() {
    const { resetPassword } = useAuth();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            await resetPassword(email);
            setIsSubmitted(true);
        } catch (err: any) {
            console.error("Reset password error:", err);
            setError(err.message || "Failed to send reset email. Please check your email address.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Reset your password"
            subtitle="We'll send you a link to securely reset your password."
        >
            <div className="text-center mb-8">
                <Link href="/" className="inline-flex items-center gap-3 mb-6">
                    <Image
                        src="/logo-dark.png"
                        alt="Cargofly"
                        width={140}
                        height={40}
                        className="h-10 w-auto"
                        priority
                    />
                </Link>

                {isSubmitted ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                            Check your email
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
                            We've sent a password reset link to <span className="font-semibold text-slate-900 dark:text-white">{email}</span>.
                            If you don't see it, check your spam folder.
                        </p>
                    </div>
                ) : (
                    <>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                            Forgot password?
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            Enter your email and we'll send you a reset link
                        </p>
                    </>
                )}
            </div>

            {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 text-sm"
                            role="alert"
                        >
                            {error}
                        </motion.div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <div className="relative">
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com"
                                required
                                autoComplete="email"
                                className="h-12 pl-12"
                            />
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={cn(
                            "w-full h-12 rounded-xl bg-blue-600 text-white font-bold transition-all hover:bg-blue-700 active:scale-[0.98]",
                            isLoading ? "opacity-70 cursor-not-allowed" : "shadow-lg shadow-blue-600/20"
                        )}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                        ) : (
                            "Send Reset Link"
                        )}
                    </button>

                    <Link
                        href="/login"
                        className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to login
                    </Link>
                </form>
            ) : (
                <div className="space-y-4 text-center">
                    <button
                        onClick={() => setIsSubmitted(false)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Didn't receive the email? Try again
                    </button>

                    <Link
                        href="/login"
                        className="block w-full h-12 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                        Return to login
                    </Link>
                </div>
            )}
        </AuthLayout>
    );
}
