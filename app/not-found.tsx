import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white">
        S
      </div>
      <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-zinc-900">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-base text-zinc-500">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Back to Home
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border border-zinc-300 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
