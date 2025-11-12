import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

// Encryption configuration (in production, use environment variables)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key!!'; // Must be 32 characters
const ALGORITHM = 'aes-256-cbc';

// Encrypt sensitive data
function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32));
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Decrypt sensitive data
function decrypt(text) {
  if (!text) return null;
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').substring(0, 32));
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// GET /api/credentials - List all credentials (without sensitive data)
export async function GET() {
  try {
    const credentials = await prisma.credential.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        credentialType: true,
        username: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
        // Exclude encrypted fields from list view
        password: false,
        sshPrivateKey: false,
        vaultPassword: false,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(credentials);
  } catch (error) {
    console.error('Error fetching credentials:', error);
    return NextResponse.json({ error: 'Failed to fetch credentials' }, { status: 500 });
  }
}

// POST /api/credentials - Create a new credential
export async function POST(request) {
  try {
    const body = await request.json();

    // Encrypt sensitive fields
    const credential = await prisma.credential.create({
      data: {
        name: body.name,
        description: body.description || '',
        credentialType: body.credentialType,
        username: body.username || null,
        password: body.password ? encrypt(body.password) : null,
        sshPrivateKey: body.sshPrivateKey ? encrypt(body.sshPrivateKey) : null,
        vaultPassword: body.vaultPassword ? encrypt(body.vaultPassword) : null,
        createdBy: body.createdBy || 'admin@example.com',
      },
      select: {
        id: true,
        name: true,
        description: true,
        credentialType: true,
        username: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
        // Don't return encrypted fields
        password: false,
        sshPrivateKey: false,
        vaultPassword: false,
      },
    });

    return NextResponse.json(credential, { status: 201 });
  } catch (error) {
    console.error('Error creating credential:', error);
    return NextResponse.json({ error: 'Failed to create credential' }, { status: 500 });
  }
}
