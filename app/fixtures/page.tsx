import { redirect } from "next/navigation";

export default async function FixturesIndex({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const { day } = await searchParams;
  redirect(`/fixtures/${Math.min(4, Math.max(1, Number(day) || 1))}`);
}