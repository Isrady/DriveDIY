import { redirect } from "next/navigation";

export default function AppPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  void searchParams;
  redirect("/dashboard");
}
