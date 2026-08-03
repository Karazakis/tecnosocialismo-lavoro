"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import type { SuiteUser } from "@/lib/auth";
import type { GoodsDemand, NetworkTask, Opportunity, Organization, WorkApplication, WorkDashboard } from "@/lib/model";

const emptyDashboard: WorkDashboard = {
  configured: true, viewerId: null, profile: null, demand: [], organizations: [], opportunities: [], tasks: [], applications: [], ownOrganizations: [],
};

const suiteLinks = [
  ["Home", "https://tecnosocialismo.com", "TS"], ["Rizoma", "https://rizoma.tecnosocialismo.com", "RZ"],
  ["Iskra", "https://iskra.tecnosocialismo.com", "IK"], ["Cloud", "https://cloud.tecnosocialismo.com", "CL"],
  ["Mail", "https://mail.tecnosocialismo.com", "ML"], ["Video", "https://video.tecnosocialismo.com", "VD"],
  ["Musica", "https://musica.tecnosocialismo.com", "MU"], ["Social", "https://social.tecnosocialismo.com", "SO"],
  ["Messaggi", "https://messaggi.tecnosocialismo.com", "MS"], ["Sport", "https://sport.tecnosocialismo.com", "FT"],
  ["Market", "https://market.tecnosocialismo.com", "MK"], ["Lavoro", "https://lavoro.tecnosocialismo.com", "LW"],
  ["Azienda", "https://azienda.tecnosocialismo.com", "AZ"],
  ["Servizi", "https://servizi.tecnosocialismo.com", "SV"],
  ["Salute", "https://salute.tecnosocialismo.com", "SA"],
  ["Educazione", "https://educazione.tecnosocialismo.com", "ED"],
  ["Legge", "https://legge.tecnosocialismo.com", "LE"],
  ["Burocrazia", "https://burocrazia.tecnosocialismo.com", "BU"],
  ["Propaganda", "https://propaganda.tecnosocialismo.com", "PR"],
  ["Biblioteca", "https://biblioteca.tecnosocialismo.com", "BI"],
  ["Militant", "https://militant.tecnosocialismo.com", "MT"],
  ["Account", "https://login.tecnosocialismo.com", "AC"],
] as const;

type View = "per-te" | "tutte" | "remoto" | "territorio" | "task" | "organizzazioni";
type Panel = "application" | "organization-application" | "organization" | "opportunity" | "applications" | "tasks" | null;

export function WorkApp({ user }: { user: SuiteUser | null }) {
  const [data, setData] = useState<WorkDashboard>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("per-te");
  const [panel, setPanel] = useState<Panel>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [menu, setMenu] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const returnTo = "https://lavoro.tecnosocialismo.com";
  const loginUrl = `https://login.tecnosocialismo.com?returnTo=${encodeURIComponent(returnTo)}`;
  const profileUrl = `https://login.tecnosocialismo.com?setup=economy&returnTo=${encodeURIComponent(returnTo)}`;

  async function refresh() {
    const response = await fetch("/api/dashboard", { cache: "no-store" }).catch(() => null);
    if (response?.ok) setData(await response.json() as WorkDashboard);
    setLoading(false);
  }

  useEffect(() => {
    // La vista iniziale viene sincronizzata con profilo e archivio condivisi.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, []);

  const scored = useMemo(() => data.opportunities.map((opportunity) => ({ opportunity, score: matchScore(opportunity, data.profile) })), [data.opportunities, data.profile]);
  const visible = useMemo(() => {
    const needle = normalize(query);
    return scored.filter(({ opportunity, score }) => {
      const found = !needle || normalize([opportunity.title, opportunity.organizationName, opportunity.description, opportunity.area, opportunity.skills.join(" "), opportunity.city].join(" ")).includes(needle);
      if (!found) return false;
      if (view === "per-te") return !data.profile || score >= 35;
      if (view === "remoto") return opportunity.mode === "remoto";
      if (view === "territorio") return opportunity.mode !== "remoto" && (!data.profile?.city || normalize(opportunity.city).includes(normalize(data.profile.city)));
      return view === "tutte";
    }).sort((a, b) => b.score - a.score);
  }, [data.profile, query, scored, view]);

  function toast(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 3600);
  }

  function requireProfile(action: () => void) {
    if (!user) return window.location.assign(loginUrl);
    if (!data.profile) return window.location.assign(profileUrl);
    action();
  }

  async function act(body: Record<string, unknown>, success: string) {
    setBusy(true);
    const response = await fetch("/api/actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    const payload = response ? await response.json().catch(() => ({})) as { error?: string } : {};
    setBusy(false);
    if (!response?.ok) {
      toast(payload.error || "Operazione non riuscita.");
      if (response?.status === 409 && payload.error?.includes("profilo generale")) window.setTimeout(() => window.location.assign(profileUrl), 700);
      return false;
    }
    await refresh();
    toast(success);
    return true;
  }

  function openApplication(opportunity: Opportunity) {
    requireProfile(() => { setSelectedOpportunity(opportunity); setPanel("application"); });
  }

  function navigate(next: View) {
    setView(next);
    document.getElementById(next === "task" ? "rete" : next === "organizzazioni" ? "organizzazioni" : "opportunita")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="work-shell">
      <header className="topbar">
        <a className="ts-brand" href="https://tecnosocialismo.com"><i /><span>TECNO<br />SOCIALISMO</span></a>
        <Link className="work-brand" href="/"><b>LW</b><span>Lavoro<small>CAPACITÀ · OPPORTUNITÀ · RETE</small></span></Link>
        <label className="top-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca ruolo, capacità, organizzazione o territorio" />{query && <button type="button" onClick={() => setQuery("")}>×</button>}</label>
        <nav className="top-actions">
          <button type="button" className="top-link" onClick={() => requireProfile(() => setPanel("applications"))}>Candidature <i>{data.applications.length}</i></button>
          <button type="button" className="top-link" onClick={() => requireProfile(() => setPanel("tasks"))}>Attività <i>{data.tasks.filter((task) => task.workerId === data.viewerId).length}</i></button>
          <button className="suite-trigger" type="button" onClick={() => setMenu((value) => !value)}>Servizi <span>⌄</span></button>
          <a className={user ? "account-pill signed" : "account-pill"} href={loginUrl}>{user ? initials(user.name) : "Accedi"}</a>
        </nav>
        {menu && <div className="suite-menu"><header><span>ECOSISTEMA</span><button type="button" onClick={() => setMenu(false)}>×</button></header><div>{suiteLinks.map(([name, href, mark]) => <a href={href} key={name}><i>{mark}</i><span>{name}</span><b>↗</b></a>)}</div></div>}
      </header>

      <aside className="sidebar">
        <section className="side-intro"><span>LAVORO / LIVE</span><p>Le capacità delle persone incontrano il lavoro necessario alla rete.</p></section>
        <nav className="side-nav">
          {([[
            "per-te", "Per te", "01"], ["tutte", "Tutte le opportunità", "02"], ["remoto", "Da remoto", "03"], ["territorio", "Nel tuo territorio", "04"], ["task", "Lavoro della rete", "05"], ["organizzazioni", "Organizzazioni", "06"]] as [View, string, string][]).map(([id, label, mark]) => <button type="button" className={view === id ? "active" : ""} onClick={() => navigate(id)} key={id}><i>{mark}</i><span>{label}</span><b>→</b></button>)}
        </nav>
        <section className="profile-card">
          <header><span>IL TUO PROFILO</span><i className={data.profile ? "ready" : ""} /></header>
          {data.profile ? <><strong>{data.profile.skills.length + data.profile.productiveActivities.length}</strong><small>capacità indicate</small><div><span>{data.profile.city}</span><span>{data.profile.desiredHours} h/settimana</span></div><button type="button" onClick={() => window.location.assign(profileUrl)}>Aggiorna disponibilità →</button></> : <><strong>—</strong><small>profilo da completare</small><button type="button" onClick={() => window.location.assign(user ? profileUrl : loginUrl)}>Configura il profilo →</button></>}
        </section>
        <section className="organization-cta"><i>＋</i><b>Rappresenti un’organizzazione?</b><p>Registrala oppure pubblica una nuova opportunità.</p><button type="button" onClick={() => requireProfile(() => setPanel(data.ownOrganizations.length ? "opportunity" : "organization"))}>{data.ownOrganizations.length ? "Pubblica lavoro" : "Registra profilo"}</button></section>
      </aside>

      <main className="main-content">
        <section className="hero">
          <div className="hero-copy">
            <p>RETE DEL LAVORO <i /></p>
            <h1>Il lavoro incontra<span>ciò che serve.</span></h1>
            <p className="hero-lead">Opportunità stabili, progetti e attività concrete. Il sistema mette in relazione competenze, disponibilità e bisogni reali.</p>
            <div className="hero-actions"><button type="button" onClick={() => navigate("per-te")}>Trova il tuo lavoro <b>→</b></button><button type="button" onClick={() => requireProfile(() => setPanel("organization"))}>Registra un’organizzazione</button></div>
            {user && !data.profile && <div className="profile-needed"><i>!</i><span><b>Manca il tuo profilo di lavoro</b><small>Indica capacità, disponibilità e ciò che vuoi fare per ricevere abbinamenti utili.</small></span><button type="button" onClick={() => window.location.assign(profileUrl)}>Completa →</button></div>}
          </div>
          <div className="network-viz" aria-hidden="true">
            <div className="network-core"><i>LW</i><b>{data.opportunities.filter((item) => item.status === "aperta").length}</b><small>OPPORTUNITÀ</small></div>
            <div className="orbit orbit-a"><i /><span>CAPACITÀ</span></div><div className="orbit orbit-b"><i /><span>BISOGNI</span></div><div className="orbit orbit-c"><i /><span>TERRITORI</span></div>
            <div className="metric metric-a"><span>RETE ATTIVA</span><b>{data.organizations.length}</b><small>organizzazioni</small></div>
            <div className="metric metric-b"><span>MATCH MEDIO</span><b>{data.profile ? averageTopScore(scored) : "—"}{data.profile ? "%" : ""}</b><small>prime opportunità</small></div>
          </div>
        </section>

        <section className="pulse-row">
          <article><i>01</i><span><b>{data.opportunities.filter((item) => item.status === "aperta").length}</b><small>posizioni aperte</small></span><em>LIVE</em></article>
          <article><i>02</i><span><b>{data.opportunities.reduce((sum, item) => sum + item.openings, 0)}</b><small>persone cercate</small></span><em>ORA</em></article>
          <article><i>03</i><span><b>{data.tasks.filter((item) => item.status === "aperta").length}</b><small>attività della rete</small></span><em>RETE</em></article>
          <article><i>04</i><span><b>{data.organizations.filter((item) => item.model === "tecnosocialista").length}</b><small>realtà tecnosocialiste</small></span><em>COOP</em></article>
        </section>

        <section className="opportunity-section" id="opportunita">
          <SectionHeader eyebrow={view === "per-te" ? "MATCH PERSONALE" : "OPPORTUNITÀ APERTE"} title={viewTitle(view, data.profile?.city)} copy={data.profile ? "L'ordine tiene conto di competenze, area, modalità e territorio indicati nel tuo profilo." : "Accedi e completa il profilo per ordinare le opportunità in base a capacità e disponibilità."} action="Pubblica opportunità" onAction={() => requireProfile(() => setPanel(data.ownOrganizations.length ? "opportunity" : "organization"))} />
          <div className="filter-strip"><button className={view === "per-te" ? "active" : ""} onClick={() => setView("per-te")}>Miglior match</button><button className={view === "tutte" ? "active" : ""} onClick={() => setView("tutte")}>Tutte</button><button className={view === "remoto" ? "active" : ""} onClick={() => setView("remoto")}>Remoto</button><button className={view === "territorio" ? "active" : ""} onClick={() => setView("territorio")}>Vicino a te</button><span>{visible.length} risultati</span></div>
          {loading ? <div className="loading-grid"><i /><i /><i /></div> : visible.length ? <div className="opportunity-grid">{visible.map(({ opportunity, score }) => <OpportunityCard opportunity={opportunity} score={score} personalized={Boolean(data.profile)} onApply={() => openApplication(opportunity)} key={opportunity.id} />)}</div> : <Empty title="Nessuna opportunità con questi criteri" copy="Allarga i filtri oppure completa meglio il profilo generale." action="Vedi tutte" onAction={() => setView("tutte")} />}
        </section>

        <section className="network-work" id="rete">
          <SectionHeader eyebrow="LAVORO GENERATO DALLA RETE" title="Attività concrete, quando servono" copy="Consegne del Market e attività operative confluiscono qui. L'indirizzo completo è visibile solo dopo l'assegnazione." />
          <div className="task-grid">
            {data.tasks.filter((task) => task.status === "aperta").slice(0, 6).map((task) => <TaskCard task={task} onClaim={() => requireProfile(() => void act({ action: "claim-task", id: task.id }, "Attività assegnata. Ora la trovi tra le tue attività."))} key={task.id} />)}
            {!data.tasks.some((task) => task.status === "aperta") && <Empty title="La rete è in equilibrio" copy="Le nuove consegne del Market e le attività locali appariranno qui automaticamente." action="Vai al Market" onAction={() => window.location.assign("https://market.tecnosocialismo.com")} />}
          </div>
        </section>

        <section className="organizations-section" id="organizzazioni">
          <SectionHeader eyebrow="ORGANIZZAZIONI" title="Lavora con chi sta costruendo" copy="Cooperative, realtà tecnosocialiste e imprese ammesse perché producono beni già richiesti." action="Registra organizzazione" onAction={() => requireProfile(() => setPanel("organization"))} />
          <div className="organization-grid">{data.organizations.map((organization) => <OrganizationCard organization={organization} onApply={() => requireProfile(() => { setSelectedOrganization(organization); setPanel("organization-application"); })} key={organization.id} />)}</div>
        </section>

        <section className="manager-band"><div><span>GESTIONE SEPARATA, RETE UNICA</span><h2>Hai già un’organizzazione attiva?</h2><p>Pubblica qui le opportunità. Regole interne, turni, votazioni, obiettivi e struttura si gestiscono nel portale Azienda.</p></div><a href="https://azienda.tecnosocialismo.com">Apri Azienda <b>↗</b></a></section>
      </main>

      <footer><a className="ts-brand" href="https://tecnosocialismo.com"><i /><span>TECNOSOCIALISMO</span></a><p>Una rete del lavoro costruita a partire dalle capacità e dai bisogni reali.</p><div><a href={profileUrl}>Profilo</a><a href="https://azienda.tecnosocialismo.com">Azienda</a><a href="https://tecnosocialismo.com/manifesto">Manifesto</a><a href="https://messaggi.tecnosocialismo.com">Assistenza</a></div></footer>

      {panel === "application" && selectedOpportunity && <ApplicationModal target={selectedOpportunity.title} availability={data.profile?.availability ?? ""} busy={busy} onClose={() => setPanel(null)} onSave={async (values) => { if (await act({ action: "apply-opportunity", targetId: selectedOpportunity.id, ...values }, "Candidatura inviata.")) setPanel(null); }} />}
      {panel === "organization-application" && selectedOrganization && <ApplicationModal target={selectedOrganization.name} availability={data.profile?.availability ?? ""} busy={busy} spontaneous onClose={() => setPanel(null)} onSave={async (values) => { if (await act({ action: "apply-organization", targetId: selectedOrganization.id, ...values }, "Richiesta spontanea inviata.")) setPanel(null); }} />}
      {panel === "organization" && <OrganizationModal demand={data.demand} profileCity={data.profile?.city ?? ""} busy={busy} onClose={() => setPanel(null)} onSave={async (values) => { if (await act({ action: "create-organization", ...values }, "Organizzazione registrata.")) setPanel(null); }} />}
      {panel === "opportunity" && <OpportunityModal organizations={data.ownOrganizations.filter((item) => item.status === "attiva")} busy={busy} onClose={() => setPanel(null)} onSave={async (values) => { if (await act({ action: "create-opportunity", ...values }, "Opportunità pubblicata.")) setPanel(null); }} />}
      {panel === "applications" && <ListPanel title="Le tue candidature" eyebrow="CANDIDATURE" onClose={() => setPanel(null)}>{data.applications.length ? data.applications.map((application) => <ApplicationRow application={application} key={application.id} />) : <Empty title="Nessuna candidatura" copy="Quando trovi un'opportunità giusta, potrai seguirla da qui." />}</ListPanel>}
      {panel === "tasks" && <ListPanel title="Le tue attività" eyebrow="LAVORO DELLA RETE" onClose={() => setPanel(null)}>{data.tasks.filter((task) => task.workerId === data.viewerId).length ? data.tasks.filter((task) => task.workerId === data.viewerId).map((task) => <TaskCard task={task} own key={task.id} />) : <Empty title="Nessuna attività assegnata" copy="Prendi in carico una consegna o un'attività operativa della rete." />}</ListPanel>}
      {notice && <div className="toast"><i /><span>{notice}</span></div>}
    </div>
  );
}

function SectionHeader({ eyebrow, title, copy, action, onAction }: { eyebrow: string; title: string; copy: string; action?: string; onAction?: () => void }) {
  return <header className="section-header"><div><span>{eyebrow}</span><h2>{title}</h2><p>{copy}</p></div>{action && <button type="button" onClick={onAction}>{action} <b>＋</b></button>}</header>;
}

function OpportunityCard({ opportunity, score, personalized, onApply }: { opportunity: Opportunity; score: number; personalized: boolean; onApply: () => void }) {
  return <article className={opportunity.featured ? "opportunity-card featured" : "opportunity-card"}>
    <header><i>{initials(opportunity.organizationName)}</i><div><b>{opportunity.organizationName}</b><span>{opportunity.organizationModel === "tecnosocialista" ? "TECNOSOCIALISTA" : "IMPRESA AMMESSA"}</span></div>{personalized && <em style={{ "--score": `${score}%` } as React.CSSProperties}>{score}%<small>match</small></em>}</header>
    <div className="opportunity-copy"><span>{opportunity.area}</span><h3>{opportunity.title}</h3><p>{opportunity.description}</p></div>
    <div className="tags"><span>{modeName(opportunity.mode)}</span><span>{typeName(opportunity.type)}</span><span>{opportunity.hoursPerWeek} h/settimana</span></div>
    <div className="skill-list">{opportunity.skills.slice(0, 4).map((skill) => <span key={skill}>#{skill}</span>)}</div>
    <div className="pay"><span>RIFERIMENTO DI MERCATO</span><b>{opportunity.marketCompensation}</b><small>Valore sociale · non ancora attivo</small></div>
    <footer><span>⌖ {opportunity.city}</span><span>{opportunity.openings} {opportunity.openings === 1 ? "posto" : "posti"}</span><button type="button" onClick={onApply}>Candidati →</button></footer>
  </article>;
}

function TaskCard({ task, own, onClaim }: { task: NetworkTask; own?: boolean; onClaim?: () => void }) {
  return <article className="task-card"><header><i>{task.kind === "consegna" ? "↗" : "◆"}</i><span>{task.source === "market" ? "DAL MARKET" : "DALLA RETE"}</span><em>{task.status}</em></header><h3>{task.title}</h3><p>{task.description}</p><div><span>⌖ {task.city}</span><span>◷ {task.estimatedMinutes} min</span></div><footer><span><small>RIF. MERCATO</small><b>{task.marketCompensation ? `€${task.marketCompensation.toFixed(2)}` : "Da definire"}</b></span>{own ? <em>{task.destinationAddress || "Dettagli in aggiornamento"}</em> : <button type="button" onClick={onClaim}>Prendi in carico →</button>}</footer></article>;
}

function OrganizationCard({ organization, onApply }: { organization: Organization; onApply: () => void }) {
  return <article className="organization-card"><header><i>{initials(organization.name)}</i><span>{organization.verified ? "VERIFICATA" : organization.status.toUpperCase()}</span></header><h3>{organization.name}</h3><p>{organization.description}</p><div><span>{organization.model === "tecnosocialista" ? "TECNOSOCIALISTA" : "CAPITALISTA AMMESSA"}</span><span>⌖ {organization.city}</span></div><footer><small>{organization.people} persone · {organization.sector}</small><button type="button" onClick={onApply}>Candidatura spontanea →</button></footer></article>;
}

function ApplicationModal({ target, availability, spontaneous, busy, onClose, onSave }: { target: string; availability: string; spontaneous?: boolean; busy: boolean; onClose: () => void; onSave: (values: Record<string, unknown>) => void }) {
  return <Modal eyebrow={spontaneous ? "CANDIDATURA SPONTANEA" : "CANDIDATURA"} title={target} onClose={onClose}><form onSubmit={(event) => submitForm(event, onSave)}><label className="full"><span>Presentazione</span><textarea name="message" required rows={6} defaultValue={spontaneous ? "Vorrei mettere le mie capacità a disposizione della vostra organizzazione perché…" : "Sono interessata/o a questa opportunità perché…"} /></label><label className="full"><span>Disponibilità</span><textarea name="availability" rows={3} defaultValue={availability} placeholder="Giorni, orari e data da cui sei disponibile" /></label><FormActions busy={busy} onClose={onClose} label="Invia candidatura" /></form></Modal>;
}

function OrganizationModal({ demand, profileCity, busy, onClose, onSave }: { demand: GoodsDemand[]; profileCity: string; busy: boolean; onClose: () => void; onSave: (values: Record<string, unknown>) => void }) {
  const [model, setModel] = useState("tecnosocialista");
  const [funding, setFunding] = useState("nessuno");
  return <Modal eyebrow="NUOVO PROFILO" title="Registra un’organizzazione" onClose={onClose} wide><form onSubmit={(event) => submitForm(event, onSave)}><div className="model-picker full"><button type="button" className={model === "tecnosocialista" ? "active" : ""} onClick={() => setModel("tecnosocialista")}><i>TS</i><b>Tecnosocialista</b><small>Cooperativa, orizzontale o con delega</small></button><button type="button" className={model === "capitalista" ? "active" : ""} onClick={() => setModel("capitalista")}><i>CA</i><b>Capitalista</b><small>Ammessa solo per beni già richiesti</small></button></div><input type="hidden" name="model" value={model} /><label><span>Nome</span><input name="name" required placeholder="Nome dell'organizzazione" /></label><label><span>Settore</span><input name="sector" required placeholder="Es. Alimentazione, tecnologia, cura" /></label><label><span>Territorio</span><input name="city" required defaultValue={profileCity} placeholder="Città o remoto" /></label><label><span>Sito o riferimento</span><input name="website" type="url" placeholder="https://" /></label>{model === "capitalista" && <label className="full"><span>Bene richiesto prodotto</span><select name="demandedGood" required defaultValue=""><option value="" disabled>Seleziona dalla domanda collettiva</option>{demand.map((item) => <option value={item.key} key={item.key}>{item.item} · {item.people} persone</option>)}</select></label>}<label className="full"><span>Descrizione</span><textarea name="description" required rows={5} placeholder="Cosa produce, come opera e quale bisogno soddisfa" /></label>{model === "tecnosocialista" && <div className="funding-picker full"><span>Stato del progetto</span><label><input type="radio" name="funding" value="nessuno" checked={funding === "nessuno"} onChange={() => setFunding("nessuno")} /><b>Già attiva, non richiede finanziamenti</b><small>Il profilo può essere attivato subito.</small></label><label><input type="radio" name="funding" value="richiesto" checked={funding === "richiesto"} onChange={() => setFunding("richiesto")} /><b>Richiede finanziamento</b><small>Passa da verifica e votazione sociale.</small></label></div>}<FormActions busy={busy} onClose={onClose} label="Registra organizzazione" /></form></Modal>;
}

function OpportunityModal({ organizations, busy, onClose, onSave }: { organizations: Organization[]; busy: boolean; onClose: () => void; onSave: (values: Record<string, unknown>) => void }) {
  return <Modal eyebrow="NUOVA OPPORTUNITÀ" title="Pubblica lavoro" onClose={onClose} wide>{organizations.length ? <form onSubmit={(event) => submitForm(event, onSave)}><label className="full"><span>Organizzazione</span><select name="organizationId" required>{organizations.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label><span>Ruolo</span><input name="title" required placeholder="Es. Coordinamento logistico" /></label><label><span>Area</span><input name="area" required placeholder="Es. Logistica" /></label><label><span>Modalità</span><select name="mode"><option value="presenza">In presenza</option><option value="ibrido">Ibrido</option><option value="remoto">Da remoto</option></select></label><label><span>Tipo</span><select name="type"><option value="stabile">Stabile</option><option value="part-time">Part-time</option><option value="turni">A turni</option><option value="temporaneo">Temporaneo</option><option value="progetto">A progetto</option><option value="contributo">Contributo alla rete</option></select></label><label><span>Territorio</span><input name="city" required placeholder="Città o Remoto" /></label><label><span>Ore settimanali</span><input name="hoursPerWeek" type="number" min="1" max="60" defaultValue="20" /></label><label><span>Posti</span><input name="openings" type="number" min="1" max="100" defaultValue="1" /></label><label><span>Compenso di mercato</span><input name="marketCompensation" required placeholder="Es. €1.500–1.700 lordi/mese" /></label><label className="full"><span>Competenze</span><input name="skills" placeholder="Separale con virgole" /></label><label className="full"><span>Descrizione</span><textarea name="description" required rows={5} placeholder="Attività, obiettivi e contesto" /></label><FormActions busy={busy} onClose={onClose} label="Pubblica opportunità" /></form> : <Empty title="Prima registra un'organizzazione attiva" copy="Le opportunità devono avere un'organizzazione responsabile." action="Chiudi" onAction={onClose} />}</Modal>;
}

function Modal({ eyebrow, title, wide, children, onClose }: { eyebrow: string; title: string; wide?: boolean; children: ReactNode; onClose: () => void }) {
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className={wide ? "modal wide" : "modal"}><header><div><span>{eyebrow}</span><h2>{title}</h2></div><button type="button" onClick={onClose}>×</button></header>{children}</section></div>;
}

function ListPanel({ eyebrow, title, children, onClose }: { eyebrow: string; title: string; children: ReactNode; onClose: () => void }) {
  return <div className="drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><aside className="drawer"><header><div><span>{eyebrow}</span><h2>{title}</h2></div><button type="button" onClick={onClose}>×</button></header><div className="drawer-body">{children}</div></aside></div>;
}

function ApplicationRow({ application }: { application: WorkApplication }) {
  return <article className="application-row"><i>{application.targetType === "opportunita" ? "OP" : "OR"}</i><div><span>{application.targetType === "opportunita" ? "OPPORTUNITÀ" : "ORGANIZZAZIONE"}</span><b>{application.targetName}</b><small>Inviata il {new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(application.createdAt))}</small></div><em>{application.status.replace("-", " ")}</em></article>;
}

function FormActions({ busy, label, onClose }: { busy: boolean; label: string; onClose: () => void }) {
  return <div className="form-actions full"><button type="button" onClick={onClose}>Annulla</button><button type="submit" disabled={busy}>{busy ? "Salvataggio…" : `${label} →`}</button></div>;
}

function Empty({ title, copy, action, onAction }: { title: string; copy: string; action?: string; onAction?: () => void }) {
  return <div className="empty"><i>LW</i><div><h3>{title}</h3><p>{copy}</p></div>{action && <button type="button" onClick={onAction}>{action} →</button>}</div>;
}

function submitForm(event: FormEvent<HTMLFormElement>, onSave: (values: Record<string, unknown>) => void) {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.currentTarget).entries());
  onSave(values);
}

function matchScore(opportunity: Opportunity, profile: WorkDashboard["profile"]) {
  if (!profile) return opportunity.featured ? 70 : 50;
  const haystack = normalize([opportunity.area, ...opportunity.skills, opportunity.description].join(" "));
  const interests = [...profile.desiredAreas, ...profile.skills, ...profile.productiveActivities, ...profile.contributionAreas];
  const skillHits = interests.filter((item) => haystack.includes(normalize(item)) || normalize(item).includes(normalize(opportunity.area))).length;
  let score = Math.min(55, skillHits * 14);
  if (profile.preferredMode === "indifferente" || profile.preferredMode === opportunity.mode) score += 18;
  if (opportunity.mode === "remoto" || normalize(opportunity.city).includes(normalize(profile.city))) score += 17;
  if (Math.abs(opportunity.hoursPerWeek - profile.desiredHours) <= 8) score += 10;
  return Math.max(28, Math.min(98, score));
}

function averageTopScore(items: { score: number }[]) {
  const top = items.map((item) => item.score).sort((a, b) => b - a).slice(0, 3);
  return top.length ? Math.round(top.reduce((sum, score) => sum + score, 0) / top.length) : 0;
}

function viewTitle(view: View, city?: string) {
  if (view === "remoto") return "Lavora da ovunque";
  if (view === "territorio") return city ? `Opportunità a ${city}` : "Opportunità nel territorio";
  if (view === "tutte") return "Tutte le opportunità";
  return "Il lavoro più vicino a te";
}

function normalize(value: string) { return value.toLocaleLowerCase("it").normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
function initials(value: string) { return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
function modeName(value: Opportunity["mode"]) { return value === "remoto" ? "Da remoto" : value === "ibrido" ? "Ibrido" : "In presenza"; }
function typeName(value: Opportunity["type"]) { return ({ stabile: "Stabile", "part-time": "Part-time", turni: "A turni", temporaneo: "Temporaneo", progetto: "A progetto", contributo: "Contributo" } as const)[value]; }
