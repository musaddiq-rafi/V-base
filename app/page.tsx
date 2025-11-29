import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="flex flex-col items-center justify-center gap-8 text-center px-4">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white">
            VBase
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl">
            Real-time collaborative virtual workspace for teams
          </p>
        </div>

        <Link
          href="/sign-in"
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
        >
          Get Started
        </Link>
      </main>
    </div>
  );
}
