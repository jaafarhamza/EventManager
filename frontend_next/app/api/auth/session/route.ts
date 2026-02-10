import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();
  
  const accessToken = cookieStore.get('accessToken')?.value;
  const refreshToken = cookieStore.get('refreshToken')?.value;

  if (!accessToken || !refreshToken) {
    return NextResponse.json(
      { error: 'No tokens found' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    accessToken,
    refreshToken,
  });
}
