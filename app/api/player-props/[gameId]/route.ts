import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    const { generateMockPlayerProps } = await import('@/server-utils/routes');
    const mockProps = generateMockPlayerProps(gameId);
    return NextResponse.json(mockProps);
  } catch (error) {
    console.error("Failed to fetch player props:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch player props",
        message: (error as Error).message 
      },
      { status: 500 }
    );
  }
}
