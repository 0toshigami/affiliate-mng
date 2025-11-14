import { NextRequest, NextResponse } from 'next/server';

/**
 * Referral link short URL handler
 *
 * This route acts as a short link proxy that redirects to the backend
 * tracking endpoint. It preserves the user experience while allowing
 * the backend to properly track clicks and handle redirects.
 *
 * Flow:
 * 1. User clicks: http://localhost:4000/r/{code}
 * 2. This route redirects to: http://localhost:8000/api/v1/referrals/track/{code}
 * 3. Backend tracks the click and redirects to the target URL
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  // Get the backend API URL from environment
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Build the backend tracking URL
  const trackingUrl = `${apiUrl}/api/v1/referrals/track/${code}`;

  // Preserve any query parameters from the original request
  const searchParams = request.nextUrl.searchParams;
  const queryString = searchParams.toString();
  const fullTrackingUrl = queryString ? `${trackingUrl}?${queryString}` : trackingUrl;

  // Redirect to the backend tracking endpoint
  // The backend will handle the click tracking and redirect to the target URL
  return NextResponse.redirect(fullTrackingUrl, 302);
}
