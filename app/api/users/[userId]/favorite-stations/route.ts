/**
 * Favorite Stations API
 * Returns user's most frequent gas stations
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserFavoriteStations, getSuggestionsNearLocation } from '@/lib/favorite-stations'

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params
    const body = await request.json()
    const { latitude, longitude, limit = 5 } = body

    // If location provided, get suggestions near that location
    if (latitude && longitude) {
      const suggestions = await getSuggestionsNearLocation(
        userId,
        latitude,
        longitude,
        25 // 25 miles radius
      )

      return NextResponse.json({
        success: true,
        favorites: suggestions,
      })
    }

    // Otherwise, just return top favorites
    const favorites = await getUserFavoriteStations(userId, limit)

    return NextResponse.json({
      success: true,
      favorites,
    })
  } catch (error) {
    console.error('Error fetching favorite stations:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch favorite stations',
      },
      { status: 500 }
    )
  }
}
