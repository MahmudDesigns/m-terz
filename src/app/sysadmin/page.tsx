import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin";
import AdminClient from "./admin-client";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  return <AdminClient me={admin.callSign} />;
}