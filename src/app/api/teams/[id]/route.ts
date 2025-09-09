import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.pathname.split('/').slice(-1)[0];
  const team = await prisma.team.findUnique({
    where: { id },
    include: { players: true }
  });
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  return NextResponse.json(team);
}

export async function PUT(req: NextRequest) {
  const id = req.nextUrl.pathname.split('/').slice(-1)[0];
  const data = await req.json();

  const updatedTeam = await prisma.team.update({
    where: { id },
    data: {
      schoolName: data.schoolName,
      coachName: data.coachName,
      managerName: data.managerName
    }
  });

  return NextResponse.json(updatedTeam);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.pathname.split('/').slice(-1)[0];
  // Optionally check matches before delete
  await prisma.team.delete({ where: { id } });
  return NextResponse.json({ message: 'Team deleted' });
}
