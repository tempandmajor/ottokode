export default function WhatsNewPage() {
  return (
    <div className="container mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-3xl font-bold">Whats New</h1>
      <p className="text-muted-foreground">
        Highlights in v1.0.1:
      </p>
      <ul className="list-disc ml-6 space-y-2">
        <li><strong>Desktop + Web parity</strong> across macOS, Windows, and Linux with dynamic release links.</li>
        <li><strong>AI context-aware suggestions</strong> powered by your repository embeddings.</li>
        <li><strong>Admin indexing</strong> at <code>/admin/indexing</code> to curate embeddings.</li>
        <li><strong>Propose Diff (server)</strong> for safe AI refactors via Edge Function.</li>
        <li><strong>Security</strong>: hardened CSP, frame protection, and MIME sniffing protection.</li>
      </ul>
      <p className="text-sm text-muted-foreground">Tip: Use Settings 	&rarr; AI to choose provider/model (Anthropic/OpenAI) based on cost/perf.</p>
    </div>
  );
}
