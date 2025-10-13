// app/api/teams/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 600; // 10 minutes cache for teams

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      select: {
        id: true,
        schoolName: true,
        coachName: true,
        managerName: true,
        poolAllocation: true,
        teamLogo: true,
        players: {
          select: {
            id: true,
            name: true,
            capNumber: true
            // Don't select stats unless specifically needed
          },
          orderBy: { capNumber: 'asc' }
        }
      },
      orderBy: { schoolName: 'asc' }
    });

    return NextResponse.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST remains the same