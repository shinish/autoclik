import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    AWX_BASE_URL: process.env.AWX_BASE_URL || 'NOT SET',
    AWX_TOKEN: process.env.AWX_TOKEN ? 'SET (masked)' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('AWX')),
  });
}
