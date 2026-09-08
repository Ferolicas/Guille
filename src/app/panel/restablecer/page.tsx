import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PanelResetForm } from "@/components/PanelResetForm";

export const metadata: Metadata = {
  title: "Restablecer contraseña",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token;
  if (!token) redirect("/panel");
  return <PanelResetForm token={token} />;
}
