import { createFileRoute } from "@tanstack/react-router";

const GITHUB_URL = "https://github.com/dk-man/brain-app";
const RELEASES_URL = "https://github.com/dk-man/brain-app/releases/latest";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Brain — a local-first markdown notes app" },
      {
        name: "description",
        content:
          "Brain is a minimalist, local-first markdown notes app for macOS. Your notes are plain .md files on your disk — compatible with Obsidian, Git, and any text editor.",
      },
      { property: "og:title", content: "Brain — a local-first markdown notes app" },
      {
        property: "og:description",
        content:
          "Minimalist markdown notes for macOS. Local files. Wikilinks, backlinks, checkboxes, tags. No cloud.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-16">
        <header className="flex items-center justify-between text-sm">
          <span className="font-mono tracking-tight text-muted-foreground">alexlabs.dev</span>
          <a
            href={GITHUB_URL}
            className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            GitHub
          </a>
        </header>

        <section className="mt-24">
          <h1 className="text-5xl font-semibold tracking-tight">Brain</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            A local-first markdown notes app for macOS. Your notes are plain{" "}
            <code className="font-mono text-sm">.md</code> files on your disk — compatible with
            Obsidian, Git, and any text editor.
          </p>

          <ul className="mt-8 space-y-2 text-sm text-muted-foreground">
            <li>— Wikilinks &amp; backlinks between notes</li>
            <li>— Interactive checkboxes that sync back to the file</li>
            <li>— YAML frontmatter with tags and timestamps</li>
            <li>— Two-way sync with external editors</li>
            <li>— No cloud, no account, no telemetry</li>
          </ul>

          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href={RELEASES_URL}
              className="inline-flex items-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Download for macOS
            </a>
            <a
              href={GITHUB_URL}
              className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              View source on GitHub
            </a>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Latest release · unsigned build · right-click → Open on first launch
          </p>
        </section>

        <footer className="mt-auto pt-16 text-xs text-muted-foreground">
          <span>Built with care. Documentation lives on </span>
          <a href={GITHUB_URL} className="underline-offset-4 hover:text-foreground hover:underline">
            GitHub
          </a>
          .
        </footer>
      </div>
    </main>
  );
}
