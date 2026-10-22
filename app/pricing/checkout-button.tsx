import Link from "next/link"

export function CheckoutButton({ label = "Join the Waitlist" }: { plan?: string; label?: string }) {
  return (
    <Link
      href="/waitlist"
      className="mt-8 block w-full rounded-lg bg-indigo-600 px-6 py-3.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
    >
      {label}
    </Link>
  )
}
