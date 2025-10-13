import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { schoolName, coachName, managerName, poolAllocation, teamLogo, players } = body;

    console.log('Received team data:', { schoolName, coachName, managerName, poolAllocation, teamLogo, players });

    // Check if team already exists
    const existingTeam = await prisma.team.findUnique({
      where: { schoolName }
    });

    if (existingTeam) {
      return NextResponse.json(
        { error: 'Team with this school name already exists' },
        { status: 400 }
      );
    }

    // Create team with players
    const team = await prisma.team.create({
      data: {
        schoolName,
        coachName,
        managerName,
        poolAllocation, // Now matches Prisma schema
        teamLogo,       // Now matches Prisma schema
        players: {
          create: players.map((player: any) => ({
            name: player.name,
            capNumber: player.capNumber
          }))
        }
      },
      include: {
        players: true
      }
    });

    console.log('Team created successfully:', team.id);
    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      include: {
        players: {
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