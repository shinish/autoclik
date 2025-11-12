import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// DELETE /api/credentials/[id] - Delete a credential
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    await prisma.credential.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Credential deleted successfully' });
  } catch (error) {
    console.error('Error deleting credential:', error);
    return NextResponse.json({ error: 'Failed to delete credential' }, { status: 500 });
  }
}
