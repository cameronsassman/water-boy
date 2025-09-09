import { sql } from "@vercel/postgres";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!id) return res.status(400).json({ error: "id is required" });

  if (req.method === "GET") {
    const { rows } = await sql`SELECT * FROM tournaments WHERE id = ${id}`;
    return res.status(200).json(rows[0] || null);
  }

  if (req.method === "PUT") {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Tournament name is required" });

    const { rows } = await sql`
      UPDATE tournaments
      SET name = ${name}
      WHERE id = ${id}
      RETURNING *;
    `;
    return res.status(200).json(rows[0]);
  }

  if (req.method === "DELETE") {
    await sql`DELETE FROM tournaments WHERE id = ${id}`;
    return res.status(204).end();
  }

  return res.status(405).json({ error: "Method not allowed" });
}
