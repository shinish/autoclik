'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Play, ArrowLeft, Terminal, CheckCircle, XCircle, Clock, Loader,
  AlertCircle, Download, FileJson, FileSpreadsheet, FileCode, Network
} from 'lucide-react';
import Button from '@/components/Button';
import ExcelJS from 'exceljs';

export default function ConnectivityCheckPage() {
  const router = useRouter();

  // Form state
  const [executionNodeGroup, setExecutionNodeGroup] = useState('');  // Queue Name / source_system
  const [destinationIPs, setDestinationIPs] = useState('');          // destn_ip separated by ";"
  const [portNumbers, setPortNumbers] = useState('');                 // ports_input separated by ","
  const [instanceGroupId, setInstanceGroupId] = useState('298');     // Instance group ID with default

  // Execution state
  const [executing, setExecuting] = useState(false);
  const [execution, setExecution] = useState(null);
  const [consoleOutput, setConsoleOutput] = useState('');
  const [results, setResults] = useState(null);

  const consoleRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  // Auto-scroll console to bottom
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleOutput]);

  const handleExecute = async (e) => {
    e.preventDefault();

    // Validate inputs
    if (!executionNodeGroup.trim()) {
      alert('Please enter an Execution Node Group (Queue Name)');
      return;
    }
    if (!destinationIPs.trim()) {
      alert('Please enter at least one destination IP');
      return;
    }
    if (!portNumbers.trim()) {
      alert('Please enter at least one port number');
      return;
    }

    try {
      setExecuting(true);
      setResults(null);
      setConsoleOutput('Initializing connectivity check...\n');

      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

      // Parse inputs
      const ips = destinationIPs.split(';').map(ip => ip.trim()).filter(ip => ip);
      const ports = portNumbers.split(',').map(port => port.trim()).filter(port => port);

      setConsoleOutput(prev => prev + `\nExecution Node Group (Queue): ${executionNodeGroup}\n`);
      setConsoleOutput(prev => prev + `Destination IPs: ${ips.join('; ')}\n`);
      setConsoleOutput(prev => prev + `Ports: ${ports.join(', ')}\n`);
      if (instanceGroupId) {
        setConsoleOutput(prev => prev + `Instance Group ID: ${instanceGroupId}\n`);
      } else {
        setConsoleOutput(prev => prev + `Instance Group ID: 298 (default)\n`);
      }
      setConsoleOutput(prev => prev + '\n');

      const res = await fetch('/api/connectivity-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          executionNodeGroup,  // Maps to source_system in AWX
          destinationIPs: ips, // Maps to destn_ip (joined by ";")
          ports,               // Maps to ports_input (joined by ",")
          instanceGroupId: instanceGroupId || undefined,  // Optional instance group override
          executedBy: currentUser.email || 'system',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to execute connectivity check');
      }

      setExecution(data.execution);
      setConsoleOutput(prev => prev + `Job launched successfully!\nAWX Job ID: ${data.awxJob?.id || 'N/A'}\n\nWaiting for job to start...\n`);

      // Start polling for updates
      if (data.execution?.id) {
        startPolling(data.execution.id);
      } else {
        // Demo mode - show results immediately
        setResults(data.results);
        setConsoleOutput(prev => prev + '\n' + formatResultsForConsole(data.results));
        setExecuting(false);
      }
    } catch (error) {
      console.error('Error executing connectivity check:', error);
      setConsoleOutput(prev => prev + `\nERROR: ${error.message}\n`);
      setExecuting(false);
    }
  };

  const startPolling = (executionId) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/connectivity-check/${executionId}`);

        if (res.ok) {
          const data = await res.json();
          setExecution(data);

          if (data.consoleOutput) {
            setConsoleOutput(data.consoleOutput);
          }

          if (data.results) {
            setResults(data.results);
          }

          if (data.status === 'success' || data.status === 'failed' || data.status === 'canceled') {
            clearInterval(interval);
            pollingIntervalRef.current = null;
            setExecuting(false);

            if (data.status === 'success') {
              setConsoleOutput(prev => prev + '\n\n' + formatResultsForConsole(data.results));
            }
          }
        }
      } catch (error) {
        console.error('Error polling execution status:', error);
      }
    }, 3000);

    pollingIntervalRef.current = interval;
  };

  const formatResultsForConsole = (results) => {
    if (!results || !Array.isArray(results)) return '';

    let output = '═══════════════════════════════════════════════════════════════\n';
    output += '                    CONNECTIVITY CHECK RESULTS                    \n';
    output += '═══════════════════════════════════════════════════════════════\n\n';

    results.forEach((result, index) => {
      const statusIcon = result.status === 'Success' ? '[OK]' : '[FAIL]';
      output += `${index + 1}. ${result.destination}:${result.port}\n`;
      output += `   Status: ${statusIcon} ${result.status}\n`;
      output += `   Response Time: ${result.responseTime || 'N/A'}\n`;
      if (result.error) {
        output += `   Error: ${result.error}\n`;
      }
      output += '\n';
    });

    const successful = results.filter(r => r.status === 'Success').length;
    const failed = results.filter(r => r.status !== 'Success').length;

    output += '───────────────────────────────────────────────────────────────\n';
    output += `Summary: ${successful} successful, ${failed} failed out of ${results.length} total\n`;
    output += '═══════════════════════════════════════════════════════════════\n';

    return output;
  };

  const handleCancel = async () => {
    if (!execution || !confirm('Are you sure you want to cancel this execution?')) return;

    try {
      const res = await fetch(`/api/connectivity-check/${execution.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setConsoleOutput(prev => prev + '\n\nCanceling job...');
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setExecuting(false);
      }
    } catch (error) {
      console.error('Error canceling execution:', error);
    }
  };

  // Export functions
  const exportToJSON = () => {
    if (!results) return;

    const exportData = {
      timestamp: new Date().toISOString(),
      executionNodeGroup,
      destinationIPs: destinationIPs.split(';').map(ip => ip.trim()).filter(ip => ip),
      ports: portNumbers.split(',').map(port => port.trim()).filter(port => port),
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.status === 'Success').length,
        failed: results.filter(r => r.status !== 'Success').length,
      }
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `connectivity-check-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToExcel = async () => {
    if (!results) return;

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Automation Platform';
    workbook.created = new Date();

    // Add Results sheet
    const resultsSheet = workbook.addWorksheet('Results');

    // Define columns
    resultsSheet.columns = [
      { header: '#', key: 'index', width: 8 },
      { header: 'Source', key: 'source', width: 25 },
      { header: 'Destination IP', key: 'destination', width: 20 },
      { header: 'Port', key: 'port', width: 10 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Response Time', key: 'responseTime', width: 15 },
      { header: 'Error', key: 'error', width: 35 },
      { header: 'Timestamp', key: 'timestamp', width: 22 },
    ];

    // Style header row
    resultsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    resultsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1B1B6F' }
    };
    resultsSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Add data rows
    results.forEach((result, index) => {
      const row = resultsSheet.addRow({
        index: index + 1,
        source: executionNodeGroup,
        destination: result.destination,
        port: result.port,
        status: result.status,
        responseTime: result.responseTime || 'N/A',
        error: result.error || '',
        timestamp: new Date().toISOString(),
      });

      // Color status cell based on result
      const statusCell = row.getCell('status');
      if (result.status === 'Success') {
        statusCell.font = { color: { argb: 'FF00A859' }, bold: true };
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE8F5E9' }
        };
      } else {
        statusCell.font = { color: { argb: 'FFEF4444' }, bold: true };
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFEBEE' }
        };
      }

      // Alternate row colors
      if (index % 2 === 0) {
        row.eachCell((cell, colNumber) => {
          if (colNumber !== 5) { // Skip status cell
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8F9FA' }
            };
          }
        });
      }
    });

    // Add borders to all cells
    resultsSheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        };
      });
    });

    // Add Summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 25 },
      { header: 'Value', key: 'value', width: 35 },
    ];

    // Style header
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1B1B6F' }
    };

    // Add summary data
    const summaryData = [
      { metric: 'Execution Node Group', value: executionNodeGroup },
      { metric: 'Destination IPs', value: destinationIPs },
      { metric: 'Ports', value: portNumbers },
      { metric: 'Total Checks', value: results.length },
      { metric: 'Successful', value: results.filter(r => r.status === 'Success').length },
      { metric: 'Failed', value: results.filter(r => r.status !== 'Success').length },
      { metric: 'Success Rate', value: `${((results.filter(r => r.status === 'Success').length / results.length) * 100).toFixed(1)}%` },
      { metric: 'Generated At', value: new Date().toLocaleString() },
    ];

    summaryData.forEach(item => {
      summarySheet.addRow(item);
    });

    // Add borders to summary
    summarySheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        };
      });
    });

    // Generate buffer and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `connectivity-check-${new Date().toISOString().slice(0, 10)}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToHTML = () => {
    if (!results) return;

    const successful = results.filter(r => r.status === 'Success').length;
    const failed = results.filter(r => r.status !== 'Success').length;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connectivity Check Report - ${new Date().toLocaleDateString()}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1B1B6F 0%, #4C12A1 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .header h1 { font-size: 24px; margin-bottom: 10px; }
    .header p { opacity: 0.9; font-size: 14px; }
    .summary { display: flex; gap: 20px; padding: 20px; background: #f8f9fa; border-bottom: 1px solid #eee; }
    .summary-card { flex: 1; padding: 15px; background: white; border-radius: 8px; text-align: center; border: 1px solid #eee; }
    .summary-card h3 { font-size: 28px; color: #1B1B6F; }
    .summary-card p { font-size: 12px; color: #666; margin-top: 5px; }
    .summary-card.success h3 { color: #00A859; }
    .summary-card.failed h3 { color: #dc3545; }
    .info { padding: 20px; background: #fff; border-bottom: 1px solid #eee; }
    .info-row { display: flex; margin-bottom: 10px; }
    .info-label { font-weight: 600; width: 150px; color: #555; }
    .info-value { color: #333; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1B1B6F; color: white; padding: 12px; text-align: left; font-weight: 500; }
    td { padding: 12px; border-bottom: 1px solid #eee; }
    tr:hover { background: #f8f9fa; }
    .status-success { color: #00A859; font-weight: 600; }
    .status-failed { color: #dc3545; font-weight: 600; }
    .footer { padding: 20px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #eee; }
    @media print { body { background: white; } .container { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Connectivity Check Report</h1>
      <p>Generated on ${new Date().toLocaleString()}</p>
    </div>

    <div class="summary">
      <div class="summary-card">
        <h3>${results.length}</h3>
        <p>Total Checks</p>
      </div>
      <div class="summary-card success">
        <h3>${successful}</h3>
        <p>Successful</p>
      </div>
      <div class="summary-card failed">
        <h3>${failed}</h3>
        <p>Failed</p>
      </div>
    </div>

    <div class="info">
      <div class="info-row">
        <span class="info-label">Execution Node Group:</span>
        <span class="info-value">${executionNodeGroup}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Destination IPs:</span>
        <span class="info-value">${destinationIPs}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Ports:</span>
        <span class="info-value">${portNumbers}</span>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Destination IP</th>
          <th>Port</th>
          <th>Status</th>
          <th>Response Time</th>
          <th>Error</th>
        </tr>
      </thead>
      <tbody>
        ${results.map((result, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${result.destination}</td>
            <td>${result.port}</td>
            <td class="${result.status === 'Success' ? 'status-success' : 'status-failed'}">${result.status}</td>
            <td>${result.responseTime || 'N/A'}</td>
            <td>${result.error || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="footer">
      <p>Automation Platform - Connectivity Check Report</p>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `connectivity-check-${new Date().toISOString().slice(0, 10)}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <Loader className="h-5 w-5 animate-spin" style={{ color: 'var(--primary)' }} />;
      case 'canceled':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      default:
        return <Clock className="h-5 w-5" style={{ color: 'var(--muted)' }} />;
    }
  };

  return (
    <div className="space-y-6">
      <style jsx>{`
        .console-output::-webkit-scrollbar {
          width: 8px;
        }
        .console-output::-webkit-scrollbar-track {
          background: #2a2a2a;
          border-radius: 4px;
        }
        .console-output::-webkit-scrollbar-thumb {
          background: #00ff00;
          border-radius: 4px;
        }
        .console-output::-webkit-scrollbar-thumb:hover {
          background: #00cc00;
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          icon={ArrowLeft}
          onClick={() => router.push('/catalog')}
        >
          Back to Catalog
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Network className="h-8 w-8" style={{ color: 'var(--primary)' }} />
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Connectivity Check</h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
                Test network connectivity from source nodes to destination IPs and ports
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Execution Form */}
        <div className="rounded-lg p-6" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
            Check Parameters
          </h2>

          <form onSubmit={handleExecute} className="space-y-4">
            {/* Execution Node Group (Queue Name) */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                Execution Node Group (Queue Name) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={executionNodeGroup}
                onChange={(e) => setExecutionNodeGroup(e.target.value)}
                placeholder="e.g., VRT-PDC, APP-SERVER-01"
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                }}
              />
              <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                The execution node group or queue name to run the connectivity check from
              </p>
            </div>

            {/* Destination IPs */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                Destination IPs <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={destinationIPs}
                onChange={(e) => setDestinationIPs(e.target.value)}
                placeholder="e.g., 192.168.1.1; 10.0.0.1; google.com; example.com"
                rows={4}
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 resize-none"
                style={{
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                }}
              />
              <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                Enter IP addresses or hostnames separated by semicolon (;)
              </p>
            </div>

            {/* Port Numbers */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                Port Numbers <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={portNumbers}
                onChange={(e) => setPortNumbers(e.target.value)}
                placeholder="e.g., 22, 80, 443, 3306"
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                }}
              />
              <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                Enter port numbers separated by comma (,)
              </p>
            </div>

            {/* Instance Group */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                Instance Group ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={instanceGroupId}
                onChange={(e) => setInstanceGroupId(e.target.value)}
                placeholder="e.g., 298"
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                }}
              />
              <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                Enter the AWX Instance Group ID to run the connectivity check (default: 298)
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                icon={executing ? Loader : Play}
                disabled={executing}
                className="flex-1"
              >
                {executing ? 'Checking...' : 'Run Connectivity Check'}
              </Button>
              {execution && execution.status === 'running' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>

          {/* Execution Status */}
          {execution && (
            <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
              <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text)' }}>
                Execution Status
              </h3>
              <div className="flex items-center gap-3">
                {getStatusIcon(execution.status)}
                <div className="flex-1">
                  <p className="text-sm font-medium capitalize" style={{
                    color: execution.status === 'success' ? '#00A859' :
                           execution.status === 'failed' ? '#ef4444' : 'var(--primary)'
                  }}>
                    {execution.status}
                  </p>
                  {execution.startedAt && (
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      Started: {new Date(execution.startedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Console Output */}
        <div className="rounded-lg p-6" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="h-5 w-5" style={{ color: 'var(--text)' }} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
              Console Output
            </h2>
          </div>

          <div
            ref={consoleRef}
            className="console-output rounded-lg p-4 font-mono text-xs overflow-y-auto"
            style={{
              backgroundColor: '#1a1a2e',
              color: '#00ff00',
              height: '500px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              overflowY: 'scroll',
            }}
          >
            {consoleOutput || 'Ready to run connectivity check. Fill in the parameters and click "Run Connectivity Check".'}
          </div>
        </div>
      </div>

      {/* Results Table with Export Options */}
      {results && results.length > 0 && (
        <div className="rounded-lg p-6" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" style={{ color: '#00A859' }} />
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                Results
              </h2>
              <span className="text-xs px-2 py-1 rounded ml-2" style={{
                backgroundColor: '#00A85920',
                color: '#00A859'
              }}>
                {results.filter(r => r.status === 'Success').length} / {results.length} Successful
              </span>
            </div>

            {/* Export Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                icon={FileCode}
                onClick={exportToHTML}
                size="sm"
              >
                Export HTML
              </Button>
              <Button
                variant="outline"
                icon={FileSpreadsheet}
                onClick={exportToExcel}
                size="sm"
              >
                Export Excel
              </Button>
              <Button
                variant="outline"
                icon={FileJson}
                onClick={exportToJSON}
                size="sm"
              >
                Export JSON
              </Button>
            </div>
          </div>

          {/* Results Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--bg)' }}>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text)' }}>#</th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text)' }}>Destination</th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text)' }}>Port</th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text)' }}>Status</th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text)' }}>Response Time</th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text)' }}>Error</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr
                    key={index}
                    style={{ borderBottom: '1px solid var(--border)' }}
                    className="hover:opacity-80"
                  >
                    <td className="px-4 py-3" style={{ color: 'var(--muted)' }}>{index + 1}</td>
                    <td className="px-4 py-3 font-mono" style={{ color: 'var(--text)' }}>{result.destination}</td>
                    <td className="px-4 py-3 font-mono" style={{ color: 'var(--text)' }}>{result.port}</td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{
                          backgroundColor: result.status === 'Success' ? '#00A85920' : '#ef444420',
                          color: result.status === 'Success' ? '#00A859' : '#ef4444',
                        }}
                      >
                        {result.status}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--muted)' }}>{result.responseTime || 'N/A'}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#ef4444' }}>{result.error || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
