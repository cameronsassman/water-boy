import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const matches = await prisma.match.findMany();
  return NextResponse.json(matches);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const match = await prisma.match.create({ data });
  return NextResponse.json(match);
}
