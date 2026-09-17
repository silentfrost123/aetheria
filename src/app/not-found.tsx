import Link from "next/link";

export const metadata = {
  title: "Page not found — Chatworld",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-accent to-accent-pink flex items-center justify-center shadow-glow mb-6">
          <span className="text-3xl font-bold text-white">404</span>
        </div>
        <h1 className="font-display text-2xl font-bold mb-2">This page wandered off the map</h1>
        <p className="text-text-dim mb-8">
          The story you&apos;re looking for doesn&apos;t exist — or was moved to another branch of
          the world.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/" className="btn-primary">
            Back to Home
          </Link>
          <Link href="/discover" className="btn-ghost">
            Discover characters
          </Link>
        </div>
      </div>
    </div>
  );
}
