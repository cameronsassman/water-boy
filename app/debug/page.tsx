"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DebugPage() {
  const [teams,  setTeams]  = useState<any[]>([]);
  const [error,  setError]  = useState<string>("");
  const [url,    setUrl]    = useState<string>("");

  useEffect(() => {
    setUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "NOT SET");
    supabase.from("teams").select("*").limit(5)
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setTeams(data ?? []);
      });
  }, []);

  return (
    <div style={{ padding: 32, fontFamily: "monospace" }}>
      <h1>Supabase Debug</h1>
      <p><strong>URL:</strong> {url}</p>
      <p><strong>Error:</strong> {error || "none"}</p>
      <p><strong>Teams found:</strong> {teams.length}</p>
      <pre>{JSON.stringify(teams, null, 2)}</pre>
    </div>
  );
}