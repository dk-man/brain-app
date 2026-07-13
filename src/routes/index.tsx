import { createFileRoute } from "@tanstack/react-router";
import brainScreenshot from "../assets/Brain_v0.3.png.asset.json";

const GITHUB_URL = "https://github.com/dk-man/brain-app";
const RELEASES_URL = "https://github.com/dk-man/brain-app/releases/latest";
const DOWNLOAD_URL =
  "https://github.com/dk-man/brain-app/releases/download/v0.3.0/Brain-darwin-arm64.zip";
const BASE_URL = "https://alexlabs.dev";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Brain — Local-first markdown notes app for macOS" },
      {
        name: "description",
        content:
          "Brain is a local-first markdown notes app for macOS. Your notes are plain .md files on your disk. Wikilinks, backlinks, GFM tables, quick capture, global search, and two-way Obsidian sync. No cloud, no account, no telemetry.",
      },
      {
        property: "og:title",
        content: "Brain — Local-first markdown notes app for macOS",
      },
      {
        property: "og:description",
        content:
          "Brain is a local-first markdown notes app for macOS. Your notes are plain .md files on your disk. Wikilinks, backlinks, GFM tables, quick capture, global search, and two-way Obsidian sync. No cloud, no account, no telemetry.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: BASE_URL },
      { property: "og:site_name", content: "Brain" },
      { name: "twitter:card", content: "summary" },
      {
        name: "twitter:title",
        content: "Brain — Local-first markdown notes app for macOS",
      },
      {
        name: "twitter:description",
        content:
          "Brain is a local-first markdown notes app for macOS. Your notes are plain .md files on your disk. Wikilinks, backlinks, GFM tables, quick capture, global search, and two-way Obsidian sync. No cloud, no account, no telemetry.",
      },
    ],
    links: [{ rel: "canonical", href: BASE_URL }],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-16">
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
            A local-first markdown notes app for macOS. Your notes stay as plain{" "}
            <code className="font-mono text-sm">.md</code> files on your disk — compatible with
            Obsidian, Git, and any text editor.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href={DOWNLOAD_URL}
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
            v0.3.0 · Apple Silicon · unsigned build ·{" "}
            <a
              href={RELEASES_URL}
              className="underline-offset-4 hover:text-foreground hover:underline"
            >
              all releases
            </a>
          </p>
        </section>

        <section className="mt-20">
          <img
            src={brainScreenshot.url}
            alt="Brain app window showing a note with wikilinks, categories, and the quick-capture help note"
            className="w-full rounded-lg border border-border bg-background shadow-sm"
            loading="lazy"
            width={1440}
            height={900}
          />
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Brain 0.3.0 — local Markdown notes, categories, wikilinks, and a dedicated Inbox.
          </p>
        </section>

        <section className="mt-20">
          <h2 className="text-2xl font-semibold tracking-tight">What makes Brain different</h2>
          <p className="mt-4 text-muted-foreground">
            Most note apps lock your thoughts inside a database or a cloud account. Brain does not.
            Your vault is just a folder of Markdown files on your Mac. You can open it in Brain,
            edit it in Obsidian, sync it with Git, or back it up with Time Machine. The app is
            designed to stay out of the way while giving you the structure you need to think
            clearly.
          </p>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight">Features</h2>
          <div className="mt-6 grid gap-8 sm:grid-cols-2">
            <Feature
              title="Plain Markdown files"
              description="Every note is a .md file on your disk. No import, no export, no proprietary format. You already own your notes."
            />
            <Feature
              title="Wikilinks & backlinks"
              description="Type [[Another Note]] to link between notes. Each note shows a Linked mentions section listing every note that points back to it."
            />
            <Feature
              title="Edit / Read mode"
              description="Toggle between raw Markdown and a rendered, read-only view with ⌘⇧R. Edit mode is for fast writing; Read mode is for focused reading."
            />
            <Feature
              title="Interactive checkboxes"
              description="Click any - [ ] task in Read mode to mark it done. The underlying Markdown file updates instantly."
            />
            <Feature
              title="Rich paste → Markdown"
              description="Paste formatted text from a browser, ChatGPT, or Google Docs and Brain converts it to Markdown before inserting it. Tables, headings, lists, code blocks, and links are preserved."
            />
            <Feature
              title="GFM tables"
              description="Tables render correctly in both Edit and Read mode, with per-column alignment preserved. Copy a table from ChatGPT and it just works."
            />
            <Feature
              title="Global ⌘K search"
              description="Open the command palette anywhere in the app and search across every note. Fuzzy matching covers titles and bodies, so you can find notes by the words inside them."
            />
            <Feature
              title="Quick capture hotkey"
              description="Press ⌘⇧C from any app to open a small, always-on-top capture window. Type a thought, press ⌘⏎, and it is appended to your Inbox note without switching contexts."
            />
            <Feature
              title="Reorderable categories"
              description="Drag categories in the sidebar into the order that matches how you think. Order is saved in app config, not folder names, so your vault stays Obsidian-compatible."
            />
            <Feature
              title="Native spellcheck"
              description="Misspelled words are underlined in red. Right-click one for suggestions, Add to Dictionary, and the standard macOS text editing actions."
            />
            <Feature
              title="YAML frontmatter"
              description="Each note can include a frontmatter block for title, tags, created, and modified timestamps."
            />
            <Feature
              title="Two-way disk sync"
              description="Edit a note in another app and Brain reflects the change. Edit it in Brain and the file on disk updates. No manual sync needed."
            />
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight">Getting started</h2>
          <ol className="mt-6 list-decimal space-y-3 pl-5 text-muted-foreground">
            <li>
              Download <code className="font-mono text-sm">Brain-darwin-arm64.zip</code> and unzip
              it.
            </li>
            <li>
              Drag <code className="font-mono text-sm">Brain.app</code> to your Applications folder.
            </li>
            <li>
              Open Brain. On first launch it will ask you to choose a vault folder — this is where
              your notes live.
            </li>
            <li>
              Start writing. Every .md file in that folder becomes a note, and every subfolder
              becomes a category.
            </li>
          </ol>
          <p className="mt-4 text-sm text-muted-foreground">
            Because the app is not code-signed yet, macOS may warn you on first launch. If you see
            "Brain.app is damaged," open Terminal and run:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-md bg-muted px-4 py-3 font-mono text-sm text-foreground">
            xattr -cr /Applications/Brain.app
          </pre>
          <p className="mt-3 text-sm text-muted-foreground">
            Then open the app normally. You only need to do this once.
          </p>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight">Keyboard shortcuts</h2>
          <div className="mt-6 grid gap-3 text-sm">
            <Shortcut keys="⌘K" action="Open global search" />
            <Shortcut keys="⌘⇧C" action="Open quick capture window" />
            <Shortcut keys="⌘⇧R" action="Toggle Edit / Read mode" />
            <Shortcut keys="⌘⏎" action="Save quick capture to Inbox" />
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight">FAQ</h2>
          <div className="mt-6 space-y-5">
            <FaqItem
              question="Where are my notes stored?"
              answer="In a folder you choose on your Mac. Every note is a .md file, and every subfolder is a category. You can open the same folder in Obsidian, VS Code, or any Markdown editor."
            />
            <FaqItem
              question="Do I need an account?"
              answer="No. There is no login, no cloud, and no telemetry. Your notes are entirely on your machine."
            />
            <FaqItem
              question="Can I sync my notes between devices?"
              answer="Yes, by syncing the vault folder yourself — for example with iCloud Drive, Dropbox, Git, or Syncthing. Brain reads the files directly, so any sync method works."
            />
            <FaqItem
              question="Is it free?"
              answer="Yes, Brain is open source and free. The source code is available on GitHub under the MIT license."
            />
            <FaqItem
              question="Is there a Windows or Intel Mac version?"
              answer="Not yet. The current release is for Apple Silicon Macs. Intel and Windows builds may follow."
            />
          </div>
        </section>

        <section className="mt-20 rounded-lg border border-border bg-muted/30 p-6">
          <h2 className="text-xl font-semibold tracking-tight">Download Brain 0.3.0</h2>
          <p className="mt-2 text-muted-foreground">Apple Silicon · macOS · unsigned build</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={DOWNLOAD_URL}
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
        </section>

        <footer className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-16 text-xs text-muted-foreground">
          <span>
            Built with{" "}
            <a
              href="https://lovable.dev/invite/25JXGRN"
              className="underline-offset-4 hover:text-foreground hover:underline"
            >
              Lovable
            </a>
            .
          </span>
          <span aria-hidden="true">·</span>
          <a
            href="https://www.linkedin.com/pulse/local-first-markdown-notes-app-macos-alexander-tereshchenko-flr0f/"
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            Read the story on LinkedIn
          </a>
          <span aria-hidden="true">·</span>
          <a href={GITHUB_URL} className="underline-offset-4 hover:text-foreground hover:underline">
            GitHub
          </a>
        </footer>
      </div>
    </main>
  );
}

function Feature({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function Shortcut({ keys, action }: { keys: string; action: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{action}</span>
      <kbd className="rounded-md border border-border bg-muted px-2 py-1 font-mono text-xs">
        {keys}
      </kbd>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div>
      <h3 className="font-medium">{question}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{answer}</p>
    </div>
  );
}
