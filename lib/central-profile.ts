import type { GoodsDemand, WorkProfile } from "./model";

const AUTH_ORIGIN = process.env.AUTH_ORIGIN ?? "https://login.tecnosocialismo.com";

type CentralProfile = {
  city: string;
  postalCode: string;
  radiusKm: number;
  work: {
    desiredAreas: string[];
    skills: string[];
    preferredMode: WorkProfile["preferredMode"];
    desiredHours: number;
    learningGoals: string[];
  };
  contribution: {
    areas: string[];
    hoursPerWeek: number;
    availability: string;
    mobility: WorkProfile["mobility"];
    canDeliver: boolean;
    productiveActivities: string[];
    resources: string[];
  };
  updatedAt: string;
};

export async function getCentralWorkProfile(requestHeaders: Headers): Promise<WorkProfile | null> {
  const cookie = requestHeaders.get("cookie");
  if (!cookie) return null;
  try {
    const response = await fetch(`${AUTH_ORIGIN}/api/economic-profile`, { headers: { cookie }, cache: "no-store" });
    if (!response.ok) return null;
    const payload = await response.json() as { profile?: CentralProfile | null };
    if (!payload.profile) return null;
    const profile = payload.profile;
    return {
      city: profile.city,
      postalCode: profile.postalCode,
      radiusKm: profile.radiusKm,
      desiredAreas: profile.work.desiredAreas ?? [],
      skills: profile.work.skills ?? [],
      preferredMode: profile.work.preferredMode ?? "indifferente",
      desiredHours: profile.work.desiredHours ?? 20,
      learningGoals: profile.work.learningGoals ?? [],
      contributionAreas: profile.contribution.areas ?? [],
      contributionHours: profile.contribution.hoursPerWeek ?? 0,
      availability: profile.contribution.availability ?? "",
      mobility: profile.contribution.mobility ?? "nessuna",
      canDeliver: profile.contribution.canDeliver === true,
      productiveActivities: profile.contribution.productiveActivities ?? [],
      resources: profile.contribution.resources ?? [],
      updatedAt: profile.updatedAt,
    };
  } catch {
    return null;
  }
}

export async function getCentralGoodsDemand(): Promise<GoodsDemand[]> {
  try {
    const response = await fetch(`${AUTH_ORIGIN}/api/economic-profile/demand`, { cache: "no-store" });
    if (!response.ok) return [];
    const payload = await response.json() as { demand?: GoodsDemand[] };
    return (payload.demand ?? []).filter((entry) => entry.people > 0).slice(0, 200);
  } catch {
    return [];
  }
}
