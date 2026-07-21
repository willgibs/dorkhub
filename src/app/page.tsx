import Link from 'next/link';

export default function Home() {
  return (
    <main className="bg-bloom flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="font-display text-2xl font-bold">
        dorkhub<span className="text-primary">_</span>
      </p>
      <h1 className="font-display max-w-2xl text-5xl font-bold tracking-tight">
        a home for the things you build for fun
      </h1>
      <p className="text-muted-foreground max-w-md">
        connect github, pick the repos you love, give each one a page. free to browse, free to fork.
      </p>
      <p className="font-mono text-muted-foreground text-sm">
        {'// under construction — '}
        <Link href="/design" className="text-link hover:underline">
          watch the design system grow
        </Link>
      </p>
    </main>
  );
}
