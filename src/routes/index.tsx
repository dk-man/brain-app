import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hello World" },
      { name: "description", content: "A minimal Hello World app." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <h1 className="text-6xl font-semibold tracking-tight text-foreground">
          Hello, World <span aria-hidden>👋</span>
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          Your standalone Mac app is up and running.
        </p>
      </div>
    </main>
  );
}
