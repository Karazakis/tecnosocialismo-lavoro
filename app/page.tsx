import { headers } from "next/headers";
import { getSuiteUser } from "@/lib/auth";
import { WorkApp } from "./work-app";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await getSuiteUser(await headers());
  return <WorkApp user={user} />;
}
