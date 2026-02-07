import { NextRequest, NextResponse } from 'next/server';
import singersData from '@/lib/data/singers-data.json';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const songId = searchParams.get('songId');

  if (!songId) {
    return NextResponse.json({ error: 'songId is required' }, { status: 400 });
  }

  // Get singers from pre-generated data
  const singers = singersData[songId as keyof typeof singersData] || [];

  return NextResponse.json({ singers });
}
