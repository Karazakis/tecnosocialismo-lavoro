import { get, list, put } from "@vercel/blob";
import type { MarketOrderLike } from "./store-types";
import type { NetworkTask, Opportunity, Organization, WorkApplication } from "./model";

const PREFIX = {
  organizations: "network-v1/organizations/",
  opportunities: "network-v1/opportunities/",
  applications: "network-v1/applications/",
  tasks: "network-v1/work-tasks/",
  marketOrders: "market-v2/orders/",
};

const createdAt = "2026-07-01T09:00:00.000Z";

export const seedOrganizations: Organization[] = [
  {
    id: "seed-aurora", ownerId: "rete", ownerName: "Rete", name: "Cooperativa Aurora", model: "tecnosocialista",
    sector: "Alimentazione e logistica", description: "Filiera locale vegana, preparazione ordini e distribuzione di prossimità.",
    city: "Roma", funding: "nessuno", status: "attiva", verified: true, people: 28, createdAt,
  },
  {
    id: "seed-officina", ownerId: "rete", ownerName: "Rete", name: "Officina Comune", model: "tecnosocialista",
    sector: "Riparazione e tecnologia", description: "Riparazione, rigenerazione e condivisione di strumenti e dispositivi.",
    city: "Milano", funding: "nessuno", status: "attiva", verified: true, people: 17, createdAt,
  },
  {
    id: "seed-cura", ownerId: "rete", ownerName: "Rete", name: "Rete Cura di Quartiere", model: "tecnosocialista",
    sector: "Cura e servizi", description: "Supporto quotidiano, accompagnamento e servizi territoriali organizzati tra pari.",
    city: "Bologna", funding: "nessuno", status: "attiva", verified: true, people: 34, createdAt,
  },
  {
    id: "seed-circuiti", ownerId: "rete", ownerName: "Rete", name: "Circuiti Aperti", model: "capitalista",
    sector: "Sviluppo software", demandedGood: "Servizi digitali", description: "Impresa software ammessa perché produce capacità digitali richieste dalla rete.",
    city: "Remoto", funding: "nessuno", status: "attiva", verified: true, people: 11, createdAt,
  },
];

export const seedOpportunities: Opportunity[] = [
  {
    id: "seed-op-1", organizationId: "seed-aurora", organizationName: "Cooperativa Aurora", organizationModel: "tecnosocialista",
    title: "Coordinamento distribuzione locale", description: "Organizza turni, percorsi e passaggi di consegna tra Market e rete territoriale.",
    area: "Logistica", skills: ["organizzazione", "logistica", "comunicazione"], type: "part-time", mode: "ibrido", city: "Roma",
    hoursPerWeek: 24, marketCompensation: "€1.250–1.450 lordi/mese", openings: 2, status: "aperta", featured: true, createdAt,
  },
  {
    id: "seed-op-2", organizationId: "seed-officina", organizationName: "Officina Comune", organizationModel: "tecnosocialista",
    title: "Tecnica/o di riparazione", description: "Diagnosi e riparazione di piccoli elettrodomestici e dispositivi, con affiancamento iniziale.",
    area: "Tecnica e manutenzione", skills: ["elettronica", "manualità", "riparazione"], type: "stabile", mode: "presenza", city: "Milano",
    hoursPerWeek: 32, marketCompensation: "€1.500–1.750 lordi/mese", openings: 3, status: "aperta", featured: true, createdAt,
  },
  {
    id: "seed-op-3", organizationId: "seed-cura", organizationName: "Rete Cura di Quartiere", organizationModel: "tecnosocialista",
    title: "Facilitatrice/ore territoriale", description: "Connette bisogni di quartiere, disponibilità delle persone e servizi di cura attivi.",
    area: "Cura", skills: ["ascolto", "mediazione", "organizzazione"], type: "progetto", mode: "ibrido", city: "Bologna",
    hoursPerWeek: 20, marketCompensation: "€18–22 lordi/ora", openings: 4, status: "aperta", createdAt,
  },
  {
    id: "seed-op-4", organizationId: "seed-circuiti", organizationName: "Circuiti Aperti", organizationModel: "capitalista",
    title: "Frontend developer", description: "Sviluppo di interfacce accessibili per strumenti civici e piattaforme della rete.",
    area: "Tecnologia", skills: ["typescript", "react", "accessibilità"], type: "stabile", mode: "remoto", city: "Remoto",
    hoursPerWeek: 36, marketCompensation: "€32.000–38.000 RAL", openings: 1, status: "aperta", featured: true, createdAt,
  },
  {
    id: "seed-op-5", organizationId: "seed-aurora", organizationName: "Cooperativa Aurora", organizationModel: "tecnosocialista",
    title: "Preparazione spesa e ordini", description: "Composizione ordini, controllo qualità e preparazione delle cassette per la consegna.",
    area: "Alimentazione", skills: ["precisione", "magazzino", "alimentazione"], type: "turni", mode: "presenza", city: "Roma",
    hoursPerWeek: 18, marketCompensation: "€10–12 lordi/ora", openings: 6, status: "aperta", createdAt,
  },
];

export async function loadWorkNetwork(userId?: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      organizations: seedOrganizations,
      opportunities: seedOpportunities,
      tasks: [] as NetworkTask[], applications: [] as WorkApplication[], ownOrganizations: [] as Organization[],
    };
  }
  const [savedOrganizations, savedOpportunities, applications, savedTasks, marketOrders] = await Promise.all([
    listRecords<Organization>(PREFIX.organizations),
    listRecords<Opportunity>(PREFIX.opportunities),
    listRecords<WorkApplication>(PREFIX.applications),
    listRecords<NetworkTask>(PREFIX.tasks),
    listRecords<MarketOrderLike>(PREFIX.marketOrders),
  ]);
  const organizations = uniqueById([...savedOrganizations, ...seedOrganizations]);
  const opportunities = uniqueById([...savedOpportunities, ...seedOpportunities]);
  const taskBySource = new Map(savedTasks.map((task) => [task.sourceId || task.id, task]));
  const derived: NetworkTask[] = [];
  for (const order of marketOrders) {
    if (order.fulfillment !== "consegna-interna" && order.fulfillment !== "express") continue;
    if (order.status === "consegnato" || order.status === "annullato") continue;
    const task = taskBySource.get(order.id) ?? taskFromMarketOrder(order);
    if (task.workerId === userId) derived.push({ ...task, destinationAddress: order.address });
    else {
      const { destinationAddress: _privateAddress, ...publicTask } = task;
      void _privateAddress;
      derived.push(publicTask);
    }
  }
  const standalone = savedTasks.filter((task) => task.source !== "market" || !marketOrders.some((order) => order.id === task.sourceId));
  return {
    organizations: sortNewest(organizations),
    opportunities: sortNewest(opportunities),
    tasks: sortNewest([...derived, ...standalone]).filter((task) => task.status === "aperta" || task.workerId === userId),
    applications: userId ? sortNewest(applications.filter((application) => application.applicantId === userId)) : [],
    ownOrganizations: userId ? organizations.filter((organization) => organization.ownerId === userId) : [],
  };
}

export async function saveOrganization(organization: Organization) {
  return writeJson(`${PREFIX.organizations}${organization.id}.json`, organization, false);
}

export async function saveOpportunity(opportunity: Opportunity) {
  return writeJson(`${PREFIX.opportunities}${opportunity.id}.json`, opportunity, false);
}

export async function saveApplication(application: WorkApplication) {
  return writeJson(`${PREFIX.applications}${application.id}.json`, application, false);
}

export async function findOrganization(id: string) {
  const seeded = seedOrganizations.find((item) => item.id === id);
  if (seeded) return seeded;
  return validId(id) ? readJson<Organization>(`${PREFIX.organizations}${id}.json`) : null;
}

export async function findOpportunity(id: string) {
  const seeded = seedOpportunities.find((item) => item.id === id);
  if (seeded) return seeded;
  return validId(id) ? readJson<Opportunity>(`${PREFIX.opportunities}${id}.json`) : null;
}

export async function claimTask(id: string, user: { id: string; name: string }) {
  if (!validId(id)) return null;
  let task = await readJson<NetworkTask>(`${PREFIX.tasks}${id}.json`);
  if (!task) {
    const order = await readJson<MarketOrderLike>(`${PREFIX.marketOrders}${id}.json`);
    if (!order || (order.fulfillment !== "consegna-interna" && order.fulfillment !== "express")) return null;
    task = taskFromMarketOrder(order);
  }
  if (task.status !== "aperta") return false;
  const claimed: NetworkTask = { ...task, status: "assegnata", workerId: user.id, workerName: user.name };
  await writeJson(`${PREFIX.tasks}${task.id}.json`, claimed, true);
  return claimed;
}

function taskFromMarketOrder(order: MarketOrderLike): NetworkTask {
  return {
    id: order.id, source: "market", sourceId: order.id, kind: "consegna",
    title: `Consegna da ${order.storeName || order.sellerName}`,
    organizationName: order.storeName || order.sellerName,
    description: `${order.lines.length} ${order.lines.length === 1 ? "prodotto" : "prodotti"} · ${order.deliverySlot || "Prima disponibilità"}`,
    city: safeArea(order.address), estimatedMinutes: order.fulfillment === "express" ? 45 : 90,
    marketCompensation: Math.max(0, Number(order.deliveryFee) || 0), socialValueLocked: true,
    status: "aperta", createdAt: order.createdAt,
  };
}

function safeArea(address: string) {
  const parts = String(address || "").split(",").map((item) => item.trim()).filter(Boolean);
  return parts.length > 1 ? parts.at(-1)! : "Zona locale";
}

async function listRecords<T>(prefix: string) {
  try {
    const result = await list({ prefix, limit: 1000 });
    const records = await Promise.all(result.blobs.map((blob) => readJson<T>(blob.url)));
    return records.flatMap((record) => record === null ? [] : [record]);
  } catch {
    return [];
  }
}

async function writeJson(pathname: string, value: unknown, allowOverwrite: boolean) {
  await put(pathname, JSON.stringify(value), {
    access: "private", addRandomSuffix: false, allowOverwrite,
    contentType: "application/json; charset=utf-8", cacheControlMaxAge: 0,
  });
  return value;
}

async function readJson<T>(urlOrPathname: string): Promise<T | null> {
  try {
    const result = await get(urlOrPathname, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200) return null;
    return JSON.parse(await new Response(result.stream).text()) as T;
  } catch {
    return null;
  }
}

function sortNewest<T extends { createdAt: string }>(records: T[]) {
  return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 500);
}

function uniqueById<T extends { id: string }>(records: T[]) {
  return [...new Map(records.map((item) => [item.id, item])).values()];
}

function validId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
