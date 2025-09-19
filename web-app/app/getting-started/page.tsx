import Link from "next/link";

export default function GettingStartedPage() {
  return (
    <div className="container mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-3xl font-bold">Getting Started</h1>
      <ol className="list-decimal ml-6 space-y-3">
        <li>
          <strong>Install the Desktop App.</strong> Go to <Link href="/#download" className="underline">Downloads</Link> and pick your OS.
        </li>
        <li>
          <strong>Sign in</strong> from the header. Your Supabase session enables premium features.
        </li>
        <li>
          <strong>Index your code</strong> (admins): visit <code>/admin/indexing</code> to add files for AI context.
        </li>
        <li>
          <strong>Use the Editor.</strong> Open the IDE and try completions; toggle context-aware suggestions via env flag.
        </li>
        <li>
          <strong>Try Refactor with AI.</strong> In the editor, use the “Ask AI to refactor” action to propose a patch.
        </li>
        <li>
          <strong>Tune costs.</strong> Open <Link href="/settings/ai" className="underline">Settings → AI</Link> to choose Anthropic/OpenAI and a model.
        </li>
      </ol>
      <p className="text-sm text-muted-foreground">Questions or issues? <a href="https://github.com/tempandmajor/ottokode/issues/new/choose" target="_blank" rel="noreferrer" className="underline">Open an issue</a>.</p>
    </div>
  );
}
