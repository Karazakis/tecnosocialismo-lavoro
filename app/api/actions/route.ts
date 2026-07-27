import { getSuiteUser } from "@/lib/auth";
import { getCentralGoodsDemand, getCentralWorkProfile } from "@/lib/central-profile";
import type { Opportunity, Organization, WorkApplication } from "@/lib/model";
import { safeNumber, safeStringList, safeText } from "@/lib/model";
import { claimTask, findOpportunity, findOrganization, saveApplication, saveOpportunity, saveOrganization } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getSuiteUser(request.headers);
  if (!user) return fail("Accedi con il tuo account Tecnosocialismo.", 401);
  if (!process.env.BLOB_READ_WRITE_TOKEN) return fail("Archivio non configurato.", 503);
  const profile = await getCentralWorkProfile(request.headers);
  if (!profile) return fail("Completa prima il profilo generale di bisogni, capacità e disponibilità.", 409);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const action = safeText(body?.action, 60);

  if (action === "create-organization") {
    const model = body?.model === "capitalista" ? "capitalista" : "tecnosocialista";
    const funding = body?.funding === "richiesto" ? "richiesto" : "nessuno";
    const name = safeText(body?.name, 120);
    const sector = safeText(body?.sector, 120);
    const city = safeText(body?.city, 80);
    const description = safeText(body?.description, 900);
    const demandedGood = safeText(body?.demandedGood, 180);
    if (!name || !sector || !city || !description) return fail("Completa nome, settore, territorio e descrizione.");
    if (model === "capitalista") {
      const demand = await getCentralGoodsDemand();
      if (!demandedGood || !demand.some((entry) => entry.key === demandedGood)) {
        return fail("Un'impresa capitalista può entrare nella rete solo se produce un bene già richiesto.", 403);
      }
    }
    const organization: Organization = {
      id: crypto.randomUUID(), ownerId: user.id, ownerName: user.name, name, model, sector,
      demandedGood: model === "capitalista" ? demandedGood : undefined,
      description, city, website: safeText(body?.website, 200) || undefined, funding,
      status: model === "tecnosocialista" && funding === "richiesto" ? "votazione" : "attiva",
      verified: model === "tecnosocialista" && funding === "nessuno", people: 1, createdAt: new Date().toISOString(),
    };
    await saveOrganization(organization);
    return Response.json({ organization }, { status: 201 });
  }

  if (action === "create-opportunity") {
    const organization = await findOrganization(safeText(body?.organizationId, 80));
    if (!organization) return fail("Organizzazione non trovata.", 404);
    if (organization.ownerId !== user.id) return fail("Puoi pubblicare soltanto per una tua organizzazione.", 403);
    if (organization.status !== "attiva") return fail("L'organizzazione deve essere attiva prima di pubblicare.", 409);
    const title = safeText(body?.title, 140);
    const description = safeText(body?.description, 1200);
    const area = safeText(body?.area, 100);
    const city = safeText(body?.city, 80) || organization.city;
    const marketCompensation = safeText(body?.marketCompensation, 120);
    if (!title || !description || !area || !city || !marketCompensation) return fail("Completa tutti i dati principali dell'opportunità.");
    const opportunity: Opportunity = {
      id: crypto.randomUUID(), organizationId: organization.id, organizationName: organization.name,
      organizationModel: organization.model, title, description, area,
      skills: safeStringList(body?.skills, 16),
      type: body?.type === "part-time" || body?.type === "turni" || body?.type === "temporaneo" || body?.type === "progetto" || body?.type === "contributo" ? body.type : "stabile",
      mode: body?.mode === "remoto" || body?.mode === "ibrido" ? body.mode : "presenza",
      city, hoursPerWeek: safeNumber(body?.hoursPerWeek, 1, 60, 20), marketCompensation,
      openings: safeNumber(body?.openings, 1, 100, 1), status: "aperta", createdAt: new Date().toISOString(),
    };
    await saveOpportunity(opportunity);
    return Response.json({ opportunity }, { status: 201 });
  }

  if (action === "apply-opportunity" || action === "apply-organization") {
    const targetType = action === "apply-opportunity" ? "opportunita" : "organizzazione";
    const targetId = safeText(body?.targetId, 80);
    const target = targetType === "opportunita" ? await findOpportunity(targetId) : await findOrganization(targetId);
    if (!target) return fail("Destinazione non trovata.", 404);
    const message = safeText(body?.message, 1000);
    if (!message) return fail("Scrivi una breve presentazione.");
    const application: WorkApplication = {
      id: crypto.randomUUID(), applicantId: user.id, applicantName: user.name, targetType, targetId,
      targetName: "title" in target ? target.title : target.name,
      message, availability: safeText(body?.availability, 300) || profile.availability,
      status: "inviata", createdAt: new Date().toISOString(),
    };
    await saveApplication(application);
    return Response.json({ application }, { status: 201 });
  }

  if (action === "claim-task") {
    const result = await claimTask(safeText(body?.id, 80), user);
    if (result === false) return fail("Questa attività è già stata assegnata.", 409);
    if (!result) return fail("Attività non trovata.", 404);
    return Response.json({ task: result });
  }

  return fail("Azione non riconosciuta.", 400);
}

function fail(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
