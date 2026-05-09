import { Database, ShieldAlert } from "lucide-react";
import { curatorEntries } from "../data/mockProducts";

function levelClass(level) {
  if (level === "Danger") return "bg-red-500 text-white";
  if (level === "Caution") return "bg-guardian-yellow text-guardian-navy";
  return "bg-slate-200 text-guardian-navy";
}

export default function CuratorDatabase() {
  return (
    <main className="min-h-[calc(100svh-92px)] bg-guardian-navy px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl" aria-labelledby="curator-title">
        <div className="flex flex-col gap-4 border-b border-white/15 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3 text-guardian-yellow">
              <Database aria-hidden="true" size={32} />
              <p className="text-sm font-black uppercase tracking-[0.2em]">Researcher data</p>
            </div>
            <h1 id="curator-title" className="mt-2 text-3xl font-black text-white sm:text-5xl">
              Safety Curator Database
            </h1>
          </div>
          <p className="max-w-2xl text-lg leading-relaxed text-slate-200">
            Dangerous look-alike products that can be expanded later by safety researchers, caregivers, and product teams.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:hidden">
          {curatorEntries.map((entry) => (
            <article key={`${entry.productType}-${entry.looksSimilarTo}`} className="rounded-2xl border border-white/15 bg-guardian-panel p-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-black text-white">{entry.productType}</h2>
                <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${levelClass(entry.dangerLevel)}`}>
                  {entry.dangerLevel}
                </span>
              </div>
              <dl className="mt-4 space-y-3 text-base">
                <div>
                  <dt className="font-bold text-slate-300">Looks similar to</dt>
                  <dd className="mt-1 text-white">{entry.looksSimilarTo}</dd>
                </div>
                <div>
                  <dt className="font-bold text-slate-300">Main risk</dt>
                  <dd className="mt-1 text-white">{entry.mainRisk}</dd>
                </div>
                <div>
                  <dt className="font-bold text-slate-300">First warning to speak</dt>
                  <dd className="mt-1 font-semibold text-guardian-yellow">{entry.firstWarning}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>

        <div className="mt-6 hidden overflow-hidden rounded-3xl border border-white/15 bg-guardian-panel md:block">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Dangerous look-alike household products</caption>
            <thead className="bg-slate-950 text-sm uppercase tracking-[0.16em] text-slate-300">
              <tr>
                <th scope="col" className="px-5 py-4">Product type</th>
                <th scope="col" className="px-5 py-4">Looks similar to</th>
                <th scope="col" className="px-5 py-4">Main risk</th>
                <th scope="col" className="px-5 py-4">First warning</th>
                <th scope="col" className="px-5 py-4">Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {curatorEntries.map((entry) => (
                <tr key={`${entry.productType}-${entry.looksSimilarTo}`} className="align-top transition hover:bg-white/5">
                  <th scope="row" className="px-5 py-4 text-base font-black text-white">
                    <span className="inline-flex items-center gap-2">
                      <ShieldAlert aria-hidden="true" className="text-guardian-yellow" size={20} />
                      {entry.productType}
                    </span>
                  </th>
                  <td className="px-5 py-4 text-slate-100">{entry.looksSimilarTo}</td>
                  <td className="px-5 py-4 text-slate-100">{entry.mainRisk}</td>
                  <td className="px-5 py-4 font-semibold text-guardian-yellow">{entry.firstWarning}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${levelClass(entry.dangerLevel)}`}>
                      {entry.dangerLevel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
