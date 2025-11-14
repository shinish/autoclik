import { NextResponse } from 'next/server';
import { getLogFilePath, clearLogs } from '@/lib/logger';
import fs from 'fs';

// GET /api/logs - Get recent logs
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const level = searchParams.get('level'); // 'ERROR', 'WARN', 'INFO', or null for all

    const logFilePath = getLogFilePath();

    // Check if log file exists
    if (!fs.existsSync(logFilePath)) {
      return NextResponse.json({
        logs: [],
        message: 'No logs found'
      });
    }

    // Read log file
    const logContent = fs.readFileSync(logFilePath, 'utf8');

    // Split by separator and parse entries
    const entries = logContent
      .split('='.repeat(80))
      .filter(entry => entry.trim())
      .map(entry => {
        const lines = entry.trim().split('\n');
        if (lines.length === 0) return null;

        const firstLine = lines[0];
        const match = firstLine.match(/\[(.*?)\] \[(.*?)\] (.*)/);

        if (!match) return null;

        const [, timestamp, logLevel, message] = match;
        const dataLines = lines.slice(1).join('\n');
        let data = null;

        if (dataLines.trim()) {
          try {
            data = JSON.parse(dataLines);
          } catch (e) {
            // If not valid JSON, keep as string
            data = dataLines.trim();
          }
        }

        return {
          timestamp,
          level: logLevel,
          message,
          data,
        };
      })
      .filter(entry => entry !== null);

    // Filter by level if specified
    let filteredEntries = entries;
    if (level) {
      filteredEntries = entries.filter(entry => entry.level === level.toUpperCase());
    }

    // Get most recent entries (reverse and limit)
    const recentEntries = filteredEntries.reverse().slice(0, limit);

    return NextResponse.json({
      logs: recentEntries,
      total: filteredEntries.length,
      limit,
      level: level || 'all',
    });
  } catch (error) {
    console.error('Error reading logs:', error);
    return NextResponse.json(
      { error: 'Failed to read logs', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/logs - Clear logs
export async function DELETE(request) {
  try {
    clearLogs();
    return NextResponse.json({ success: true, message: 'Logs cleared successfully' });
  } catch (error) {
    console.error('Error clearing logs:', error);
    return NextResponse.json(
      { error: 'Failed to clear logs', details: error.message },
      { status: 500 }
    );
  }
}
