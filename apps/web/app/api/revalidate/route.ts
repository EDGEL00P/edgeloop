import { NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-revalidate-secret')
  if (secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const { tags } = (await req.json()) as { tags: string[] }
    if (!Array.isArray(tags)) {
      return Response.json({ error: 'tags must be an array' }, { status: 400 })
    }

    for (const tag of new Set(tags)) {
      revalidateTag(tag)
    }

    return Response.json({ ok: true, tags })
  } catch (error) {
    console.error('Revalidation error:', error)
    return Response.json({ error: 'Failed to revalidate' }, { status: 500 })
  }
}
