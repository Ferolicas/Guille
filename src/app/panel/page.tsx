import type { Metadata } from "next";
import { cookies } from "next/headers";
import { desc, inArray } from "drizzle-orm";
import { PanelDashboard, type PanelLead } from "@/components/PanelDashboard";
import { PanelLogin } from "@/components/PanelLogin";
import { leadFiles, leads } from "@/db/schema";
import { db } from "@/lib/db";
import { getGalleryItems } from "@/lib/gallery";
import { PANEL_COOKIE, validPanelSession } from "@/lib/panel-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Panel privado",
  robots: { index: false, follow: false },
};

async function recentLeads(): Promise<PanelLead[]> {
  const rows = await db.select().from(leads).orderBy(desc(leads.createdAt)).limit(30);
  const ids = rows.map((lead) => lead.id);
  const files = ids.length ? await db.select().from(leadFiles).where(inArray(leadFiles.leadId, ids)) : [];
  return rows.map((lead) => ({
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email || "—",
    city: lead.city || "—",
    service: lead.service,
    message: lead.message,
    createdAt: lead.createdAt.toISOString(),
    files: files.filter((file) => file.leadId === lead.id).map((file) => ({
      id: file.id,
      name: file.originalName,
      kind: file.kind,
      size: file.size,
    })),
  }));
}

export default async function PanelPage() {
  const cookieStore = await cookies();
  if (!validPanelSession(cookieStore.get(PANEL_COOKIE)?.value)) return <PanelLogin />;
  const [gallery, leadRows] = await Promise.all([getGalleryItems(), recentLeads()]);
  return <PanelDashboard initialGallery={gallery} leads={leadRows} />;
}
