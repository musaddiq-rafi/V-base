import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default async function SignInPage() {
  // Redirect authenticated users to dashboard
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-cyan-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative flex flex-col min-h-screen">
        {/* Header */}
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2 w-fit group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              VBase
            </span>
          </Link>
        </div>

        {/* Sign In Form */}
        <div className="flex-1 flex items-center justify-center px-4 pb-12">
          <SignIn
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-xl border-0",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
