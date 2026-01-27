import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://edgeloop.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/predictions`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/edges`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/backtesting`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/alerts`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.6,
    },
  ]

  // NFL Teams - static list for SEO
  const nflTeams = [
    'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE',
    'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC',
    'LAC', 'LAR', 'LV', 'MIA', 'MIN', 'NE', 'NO', 'NYG',
    'NYJ', 'PHI', 'PIT', 'SEA', 'SF', 'TB', 'TEN', 'WAS',
  ]

  const teamPages: MetadataRoute.Sitemap = nflTeams.map((code) => ({
    url: `${BASE_URL}/teams/${code.toLowerCase()}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...teamPages]
}
