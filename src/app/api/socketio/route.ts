import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  return new Response('Socket.IO endpoint', { status: 200 })
}

export async function POST(request: NextRequest) {
  return new Response('Socket.IO endpoint', { status: 200 })
}
