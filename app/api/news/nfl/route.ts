import { NextResponse } from 'next/server';

// Import the existing service from server
// Note: You may need to adjust these imports based on your server structure
export async function GET() {
  try {
    // Import dynamically to avoid bundling server code
    const { getNflNews } = await import('@/server-utils/services/newsService');
    const news = await getNflNews();
    return NextResponse.json(news);
  } catch (error) {
    console.error("Failed to fetch NFL news:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch NFL news",
        message: (error as Error).message 
      },
      { status: 500 }
    );
  }
}
