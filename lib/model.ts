export type WorkMode = "presenza" | "ibrido" | "remoto";
export type OpportunityType = "stabile" | "part-time" | "turni" | "temporaneo" | "progetto" | "contributo";
export type OrganizationModel = "capitalista" | "tecnosocialista";

export type WorkProfile = {
  city: string;
  postalCode: string;
  radiusKm: number;
  desiredAreas: string[];
  skills: string[];
  preferredMode: WorkMode | "indifferente";
  desiredHours: number;
  learningGoals: string[];
  contributionAreas: string[];
  contributionHours: number;
  availability: string;
  mobility: "nessuna" | "piedi-bici" | "mezzo-leggero" | "auto-furgone";
  canDeliver: boolean;
  productiveActivities: string[];
  resources: string[];
  updatedAt: string;
};

export type GoodsDemand = {
  key: string;
  category: string;
  item: string;
  people: number;
  totalQuantity: number;
  unit: string;
};

export type Organization = {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  model: OrganizationModel;
  sector: string;
  demandedGood?: string;
  description: string;
  city: string;
  website?: string;
  funding: "nessuno" | "richiesto";
  status: "attiva" | "verifica" | "votazione";
  verified: boolean;
  people: number;
  createdAt: string;
};

export type Opportunity = {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationModel: OrganizationModel;
  title: string;
  description: string;
  area: string;
  skills: string[];
  type: OpportunityType;
  mode: WorkMode;
  city: string;
  hoursPerWeek: number;
  marketCompensation: string;
  openings: number;
  status: "aperta" | "chiusa";
  featured?: boolean;
  createdAt: string;
};

export type WorkApplication = {
  id: string;
  applicantId: string;
  applicantName: string;
  targetType: "opportunita" | "organizzazione";
  targetId: string;
  targetName: string;
  message: string;
  availability: string;
  status: "inviata" | "in-valutazione" | "colloquio" | "accolta" | "non-accolta";
  createdAt: string;
};

export type NetworkTask = {
  id: string;
  source: "market" | "rete";
  sourceId?: string;
  kind: "consegna" | "produzione" | "cura" | "manutenzione" | "organizzazione";
  title: string;
  organizationName: string;
  description: string;
  city: string;
  estimatedMinutes: number;
  marketCompensation: number;
  socialValueLocked: true;
  status: "aperta" | "assegnata" | "completata";
  workerId?: string;
  workerName?: string;
  destinationAddress?: string;
  createdAt: string;
};

export type WorkDashboard = {
  configured: boolean;
  viewerId: string | null;
  profile: WorkProfile | null;
  demand: GoodsDemand[];
  organizations: Organization[];
  opportunities: Opportunity[];
  tasks: NetworkTask[];
  applications: WorkApplication[];
  ownOrganizations: Organization[];
};

export function safeText(value: unknown, max = 240) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function safeNumber(value: unknown, min: number, max: number, fallback = min) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

export function safeStringList(value: unknown, max = 20) {
  if (Array.isArray(value)) return value.flatMap((item) => safeText(item, 100) ? [safeText(item, 100)] : []).slice(0, max);
  if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, max);
  return [];
}
