import Link from "next/link";
import { docs, type DocKey } from "./content";

const order: DocKey[] = ["architecture", "db", "ui", "api", "protocol"];

export default function DocsPage({
  searchParams,
}: {
  searchParams: { tab?: DocKey };
}) {
  const tab = (searchParams.tab ?? "architecture") as DocKey;
  const current = docs[tab] ?? docs.architecture;

  return (
    <main className="min-h-screen px-6 py-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-sm text-[color:var(--muted)]">Mission Control</div>
          <h1 className="text-2xl font-semibold tracking-tight">Specs & Contracts</h1>
        </div>
        <Link href="/" className="link">
          ← Back to dashboard
        </Link>
      </header>

      <div className="panel overflow-hidden">
        <div className="panelHeader flex flex-wrap items-center gap-2">
          {order.map((k) => (
            <Link
              key={k}
              href={`/docs?tab=${k}`}
              className={
                "badge " +
                (k === tab
                  ? "!text-[color:var(--amber)] !border-[rgba(255,176,32,0.35)]"
                  : "")
              }
            >
              {docs[k].title}
            </Link>
          ))}
        </div>
        <div className="panelBody">
          <h2 className="text-lg font-semibold mb-2">{current.title}</h2>
          <pre className="whitespace-pre-wrap text-sm leading-6 text-[color:rgba(245,246,250,0.82)]">
            {current.md}
          </pre>
        </div>
      </div>
    </main>
  );
}
