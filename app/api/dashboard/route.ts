import { getSuiteUser } from "@/lib/auth";
import { getCentralGoodsDemand, getCentralWorkProfile } from "@/lib/central-profile";
import { loadWorkNetwork } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getSuiteUser(request.headers);
  const [profile, demand, network] = await Promise.all([
    user ? getCentralWorkProfile(request.headers) : Promise.resolve(null),
    getCentralGoodsDemand(),
    loadWorkNetwork(user?.id),
  ]);
  return Response.json({
    configured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    viewerId: user?.id ?? null,
    profile,
    demand,
    ...network,
  }, { headers: { "Cache-Control": "private, no-store" } });
}
