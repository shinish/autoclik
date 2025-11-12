'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle, TrendingUp, TrendingDown, Download, ChevronDown, ChevronUp, Activity, FileText, FileSpreadsheet, Search, Filter, X, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function AuditPage() {
  const [timeRange, setTimeRange] = useState('30days'); // 30days, daily, weekly, monthly, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    failed: 0,
    running: 0,
    pending: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleStatuses, setVisibleStatuses] = useState({
    success: true,
    failed: true,
    running: true,
    pending: true,
  });
  const [topAutomations, setTopAutomations] = useState([]);
  const [recentRuns, setRecentRuns] = useState([]);
  const [expandedView, setExpandedView] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);
  const [statusDateFilter, setStatusDateFilter] = useState('all'); // all, today, 7days, 30days, 90days
  const [statusNamespaceFilter, setStatusNamespaceFilter] = useState('all');
  const [executionDateFilter, setExecutionDateFilter] = useState('all');
  const [executionNamespaceFilter, setExecutionNamespaceFilter] = useState('all');
  const [namespaces, setNamespaces] = useState([]);
  const [allRuns, setAllRuns] = useState([]); // Store all runs for filtering
  const [automations, setAutomations] = useState([]); // Store automations for namespace mapping

  // Detailed view with pagination and search
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    status: 'all',
    namespace: 'all',
    dateFrom: '',
    dateTo: '',
    executedBy: '',
    automationName: ''
  });

  const toggleStatus = (status) => {
    setVisibleStatuses(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  useEffect(() => {
    fetchAuditData();
    fetchNamespaces();
  }, [timeRange, customStartDate, customEndDate]);

  // Auto-update every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAuditData();
    }, 3000); // 3 seconds

    return () => clearInterval(interval);
  }, [timeRange, customStartDate, customEndDate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNamespaces = async () => {
    try {
      const res = await fetch('/api/namespaces');
      const data = await res.json();
      setNamespaces(data);
    } catch (error) {
      console.error('Error fetching namespaces:', error);
    }
  };

  const fetchAuditData = async () => {
    try {
      // Build API URL with custom date params if needed
      // Add timestamp to prevent caching and ensure live data
      const timestamp = new Date().getTime();
      let auditUrl = `/api/audit?range=${timeRange}&_t=${timestamp}`;
      if (timeRange === 'custom' && customStartDate && customEndDate) {
        auditUrl += `&startDate=${customStartDate}&endDate=${customEndDate}`;
      }

      const [auditRes, automationsRes, runsRes, allRunsRes] = await Promise.all([
        fetch(auditUrl, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        }),
        fetch(`/api/automations?_t=${timestamp}`, {
          cache: 'no-store'
        }),
        fetch(`/api/runs?limit=10&_t=${timestamp}`, {
          cache: 'no-store'
        }),
        fetch(`/api/runs?limit=10000&_t=${timestamp}`, {
          cache: 'no-store'
        })
      ]);

      const auditData = await auditRes.json();
      const automationsData = await automationsRes.json();
      const runsData = await runsRes.json();
      const allRunsData = await allRunsRes.json();

      setStats(auditData.stats);
      setChartData(auditData.chartData);
      setAutomations(automationsData);
      setAllRuns(Array.isArray(allRunsData) ? allRunsData : []);

      // Calculate top automations by execution count
      const sorted = [...automationsData]
        .sort((a, b) => (b.runs || 0) - (a.runs || 0))
        .slice(0, 5);
      setTopAutomations(sorted);

      setRecentRuns(Array.isArray(runsData) ? runsData : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching audit data:', error);
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const csvData = [
      ['Date', 'Total', 'Success', 'Failed', 'Running', 'Pending'],
      ...chartData.map(d => [d.label, d.total, d.success, d.failed, d.running, d.pending])
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-report-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    setShowExportMenu(false);
  };

  const exportToExcel = () => {
    // Create workbook with multiple sheets
    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary Stats
    const summaryData = [
      ['Audit Report Summary'],
      ['Generated:', new Date().toLocaleDateString()],
      ['Time Range:', timeRange.charAt(0).toUpperCase() + timeRange.slice(1)],
      [],
      ['Metric', 'Value'],
      ['Total Executions', stats.total],
      ['Successful', stats.success],
      ['Failed', stats.failed],
      ['Running', stats.running],
      ['Pending', stats.pending],
      ['Success Rate', `${calculateSuccessRate()}%`],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    // Sheet 2: Execution History
    const historyData = [
      ['Date', 'Total', 'Success', 'Failed', 'Running', 'Pending'],
      ...chartData.map(d => [d.label, d.total, d.success, d.failed, d.running, d.pending])
    ];
    const historySheet = XLSX.utils.aoa_to_sheet(historyData);
    XLSX.utils.book_append_sheet(wb, historySheet, 'Execution History');

    // Sheet 3: Top Automations
    const topAutomationsData = [
      ['Rank', 'Automation Name', 'Namespace', 'Total Runs'],
      ...topAutomations.map((auto, idx) => [idx + 1, auto.name, auto.namespace, auto.runs || 0])
    ];
    const topSheet = XLSX.utils.aoa_to_sheet(topAutomationsData);
    XLSX.utils.book_append_sheet(wb, topSheet, 'Top Automations');

    // Download
    XLSX.writeFile(wb, `audit-report-${timeRange}-${new Date().toISOString().split('T')[0]}.xlsx`);
    setShowExportMenu(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(76, 18, 161); // Purple color
    doc.text('Audit Report', pageWidth / 2, 20, { align: 'center' });

    // Metadata
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Time Range: ${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}`, 14, 36);

    // Summary Stats
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Summary Statistics', 14, 48);

    doc.autoTable({
      startY: 52,
      head: [['Metric', 'Value']],
      body: [
        ['Total Executions', stats.total.toString()],
        ['Successful', stats.success.toString()],
        ['Failed', stats.failed.toString()],
        ['Running', stats.running.toString()],
        ['Pending', stats.pending.toString()],
        ['Success Rate', `${calculateSuccessRate()}%`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [76, 18, 161] },
    });

    // Execution History
    const historyStartY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Execution History', 14, historyStartY);

    doc.autoTable({
      startY: historyStartY + 4,
      head: [['Date', 'Total', 'Success', 'Failed', 'Running', 'Pending']],
      body: chartData.map(d => [d.label, d.total, d.success, d.failed, d.running, d.pending]),
      theme: 'grid',
      headStyles: { fillColor: [76, 18, 161] },
      styles: { fontSize: 8 },
    });

    // Top Automations (if fits on page)
    const topStartY = doc.lastAutoTable.finalY + 10;
    if (topStartY < 250) {
      doc.setFontSize(14);
      doc.text('Top Automations', 14, topStartY);

      doc.autoTable({
        startY: topStartY + 4,
        head: [['Rank', 'Automation Name', 'Namespace', 'Total Runs']],
        body: topAutomations.slice(0, 10).map((auto, idx) => [
          (idx + 1).toString(),
          auto.name,
          auto.namespace,
          (auto.runs || 0).toString()
        ]),
        theme: 'grid',
        headStyles: { fillColor: [76, 18, 161] },
        styles: { fontSize: 8 },
      });
    }

    // Download
    doc.save(`audit-report-${timeRange}-${new Date().toISOString().split('T')[0]}.pdf`);
    setShowExportMenu(false);
  };

  const calculateSuccessRate = () => {
    if (stats.total === 0) return 0;
    return ((stats.success / stats.total) * 100).toFixed(1);
  };

  const getMaxValue = () => {
    if (chartData.length === 0) return 100;
    return Math.max(...chartData.map(d => d.total), 10);
  };

  const getBarHeight = (value) => {
    const max = getMaxValue();
    return Math.max((value / max) * 100, 2); // Minimum 2% height for visibility
  };

  // Calculate pie chart segments
  const getPieSegments = (statsData) => {
    const total = statsData.total || 1;
    const segments = [
      { label: 'Success', value: statsData.success, color: '#22c55e', percentage: (statsData.success / total) * 100 },
      { label: 'Failed', value: statsData.failed, color: '#ef4444', percentage: (statsData.failed / total) * 100 },
      { label: 'Running', value: statsData.running, color: '#3b82f6', percentage: (statsData.running / total) * 100 },
      { label: 'Pending', value: statsData.pending, color: '#f59e0b', percentage: (statsData.pending / total) * 100 },
    ].filter(s => s.value > 0);

    let currentAngle = -90; // Start from top
    return segments.map(segment => {
      const angle = (segment.percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      return {
        ...segment,
        startAngle,
        endAngle,
        path: createArc(100, 100, 80, startAngle, endAngle),
      };
    });
  };

  const createArc = (cx, cy, radius, startAngle, endAngle) => {
    const start = polarToCartesian(cx, cy, radius, endAngle);
    const end = polarToCartesian(cx, cy, radius, startAngle);
    const largeArc = endAngle - startAngle <= 180 ? 0 : 1;

    return [
      'M', cx, cy,
      'L', start.x, start.y,
      'A', radius, radius, 0, largeArc, 0, end.x, end.y,
      'Z'
    ].join(' ');
  };

  const polarToCartesian = (cx, cy, radius, angle) => {
    const radians = (angle * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(radians),
      y: cy + radius * Math.sin(radians),
    };
  };

  // Filter runs based on dropdown selections
  const filterRunsByDate = (runs, dateFilter) => {
    if (dateFilter === 'all') return runs;

    const now = new Date();
    let cutoffDate = new Date(now);

    if (dateFilter === 'today') {
      cutoffDate.setHours(0, 0, 0, 0);
    } else if (dateFilter === '7days') {
      cutoffDate.setDate(cutoffDate.getDate() - 7);
      cutoffDate.setHours(0, 0, 0, 0);
    } else if (dateFilter === '30days') {
      cutoffDate.setDate(cutoffDate.getDate() - 30);
      cutoffDate.setHours(0, 0, 0, 0);
    } else if (dateFilter === '90days') {
      cutoffDate.setDate(cutoffDate.getDate() - 90);
      cutoffDate.setHours(0, 0, 0, 0);
    }

    return runs.filter(run => new Date(run.startedAt) >= cutoffDate);
  };

  const filterRunsByNamespace = (runs, namespaceFilter) => {
    if (namespaceFilter === 'all') return runs;

    return runs.filter(run => {
      const automation = automations.find(a => a.id === run.automationId);
      return automation && automation.namespace === namespaceFilter;
    });
  };

  // Calculate filtered stats for Status Distribution chart
  const getFilteredStatusStats = () => {
    let filteredRuns = [...allRuns];
    filteredRuns = filterRunsByDate(filteredRuns, statusDateFilter);
    filteredRuns = filterRunsByNamespace(filteredRuns, statusNamespaceFilter);

    return {
      total: filteredRuns.length,
      success: filteredRuns.filter(r => r.status === 'success').length,
      failed: filteredRuns.filter(r => r.status === 'failed').length,
      running: filteredRuns.filter(r => r.status === 'running').length,
      pending: filteredRuns.filter(r => r.status === 'pending').length,
    };
  };

  // Calculate filtered chart data for Execution Trend chart
  const getFilteredChartData = () => {
    let filteredRuns = [...allRuns];
    filteredRuns = filterRunsByDate(filteredRuns, executionDateFilter);
    filteredRuns = filterRunsByNamespace(filteredRuns, executionNamespaceFilter);

    // Regenerate chart data from filtered runs
    return chartData.map(dataPoint => {
      const pointDate = new Date(dataPoint.date);
      const nextDate = new Date(pointDate);
      nextDate.setDate(nextDate.getDate() + 1);

      const pointRuns = filteredRuns.filter(run => {
        const runDate = new Date(run.startedAt);
        return runDate >= pointDate && runDate < nextDate;
      });

      return {
        ...dataPoint,
        total: pointRuns.length,
        success: pointRuns.filter(r => r.status === 'success').length,
        failed: pointRuns.filter(r => r.status === 'failed').length,
        running: pointRuns.filter(r => r.status === 'running').length,
        pending: pointRuns.filter(r => r.status === 'pending').length,
      };
    });
  };

  // Use filtered data for charts - memoized for performance
  const filteredStatusStats = useMemo(() => getFilteredStatusStats(), [allRuns, statusDateFilter, statusNamespaceFilter, automations]);
  const filteredChartData = useMemo(() => getFilteredChartData(), [chartData, allRuns, executionDateFilter, executionNamespaceFilter, automations]);

  const pieSegments = useMemo(() => getPieSegments(filteredStatusStats), [filteredStatusStats]);

  // Filter runs for detailed view
  const getDetailedViewRuns = () => {
    let filtered = [...allRuns];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(run => {
        const automation = automations.find(a => a.id === run.automationId);
        return (
          run.uniqueId?.toLowerCase().includes(query) ||
          run.status?.toLowerCase().includes(query) ||
          run.executedBy?.toLowerCase().includes(query) ||
          run.awxJobId?.toString().includes(query) ||
          automation?.name?.toLowerCase().includes(query) ||
          automation?.namespace?.toLowerCase().includes(query)
        );
      });
    }

    // Apply advanced filters
    if (advancedFilters.status !== 'all') {
      filtered = filtered.filter(run => run.status === advancedFilters.status);
    }

    if (advancedFilters.namespace !== 'all') {
      filtered = filtered.filter(run => {
        const automation = automations.find(a => a.id === run.automationId);
        return automation && automation.namespace === advancedFilters.namespace;
      });
    }

    if (advancedFilters.dateFrom) {
      const fromDate = new Date(advancedFilters.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(run => new Date(run.startedAt) >= fromDate);
    }

    if (advancedFilters.dateTo) {
      const toDate = new Date(advancedFilters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(run => new Date(run.startedAt) <= toDate);
    }

    if (advancedFilters.executedBy.trim()) {
      const query = advancedFilters.executedBy.toLowerCase();
      filtered = filtered.filter(run => run.executedBy?.toLowerCase().includes(query));
    }

    if (advancedFilters.automationName.trim()) {
      const query = advancedFilters.automationName.toLowerCase();
      filtered = filtered.filter(run => {
        const automation = automations.find(a => a.id === run.automationId);
        return automation && automation.name.toLowerCase().includes(query);
      });
    }

    return filtered;
  };

  const filteredDetailedRuns = getDetailedViewRuns();
  const totalPages = Math.ceil(filteredDetailedRuns.length / pageSize);
  const paginatedRuns = filteredDetailedRuns.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, advancedFilters, pageSize]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setAdvancedFilters({
      status: 'all',
      namespace: 'all',
      dateFrom: '',
      dateTo: '',
      executedBy: '',
      automationName: ''
    });
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-light" style={{ color: 'var(--text)' }}>Audit Report</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            Track automation execution trends and statistics
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Time Range Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--muted)' }} />
            {['30days', 'daily', 'weekly', 'monthly', 'custom'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize hover:opacity-80"
                style={{
                  backgroundColor: timeRange === range ? '#4C12A1' : 'var(--surface)',
                  color: timeRange === range ? 'white' : 'var(--text)',
                  border: `1px solid ${timeRange === range ? '#4C12A1' : 'var(--border)'}`
                }}
              >
                {range === '30days' ? '30 Days' : range}
              </button>
            ))}
          </div>

          {/* Export Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 hover:opacity-80"
              style={{
                backgroundColor: 'var(--surface)',
                color: 'var(--text)',
                border: '1px solid var(--border)'
              }}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>

            {showExportMenu && (
              <div
                className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-50 overflow-hidden"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <button
                  onClick={exportToCSV}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-3"
                  style={{ color: 'var(--text)' }}
                >
                  <FileText className="h-4 w-4" />
                  Export as CSV
                </button>
                <button
                  onClick={exportToExcel}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-3"
                  style={{ color: 'var(--text)' }}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Export as Excel
                </button>
                <button
                  onClick={exportToPDF}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-3"
                  style={{ color: 'var(--text)' }}
                >
                  <FileText className="h-4 w-4" />
                  Export as PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Date Range Inputs */}
      {timeRange === 'custom' && (
        <div className="rounded-lg p-4 flex items-center gap-4 flex-wrap" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              Start Date:
            </label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-sm border transition-colors"
              style={{
                backgroundColor: 'var(--bg)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              End Date:
            </label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-sm border transition-colors"
              style={{
                backgroundColor: 'var(--bg)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            />
          </div>

          {customStartDate && customEndDate && (
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Showing data from {new Date(customStartDate).toLocaleDateString()} to {new Date(customEndDate).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Compact Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        <CompactStatCard
          label="Total"
          value={stats.total}
          icon={Calendar}
          color="#4C12A1"
        />
        <CompactStatCard
          label="Success"
          value={stats.success}
          icon={CheckCircle}
          color="#22c55e"
        />
        <CompactStatCard
          label="Failed"
          value={stats.failed}
          icon={XCircle}
          color="#ef4444"
        />
        <CompactStatCard
          label="Running"
          value={stats.running}
          icon={Clock}
          color="#3b82f6"
        />
        <CompactStatCard
          label="Pending"
          value={stats.pending}
          icon={AlertCircle}
          color="#f59e0b"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie Chart */}
        <div className="rounded-lg p-4" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-base font-light" style={{ color: 'var(--text)' }}>
              Status Distribution
            </h2>
            <div className="flex items-center gap-2">
              {/* Date Filter */}
              <select
                value={statusDateFilter}
                onChange={(e) => setStatusDateFilter(e.target.value)}
                className="px-2 py-1 rounded text-xs border appearance-none"
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                  paddingRight: '1.5rem',
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.25rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1em 1em'
                }}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
              </select>
              {/* Namespace Filter */}
              <select
                value={statusNamespaceFilter}
                onChange={(e) => setStatusNamespaceFilter(e.target.value)}
                className="px-2 py-1 rounded text-xs border appearance-none"
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                  paddingRight: '1.5rem',
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.25rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1em 1em'
                }}
              >
                <option value="all">All Categories</option>
                {namespaces.map((ns) => (
                  <option key={ns.id} value={ns.name}>{ns.displayName}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p style={{ color: 'var(--muted)' }}>Loading...</p>
            </div>
          ) : filteredStatusStats.total === 0 ? (
            <div className="text-center py-8">
              <p style={{ color: 'var(--muted)' }}>No data available</p>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <div className="relative">
                {/* SVG Pie Chart */}
                <svg width="200" height="200" viewBox="0 0 200 200">
                  {pieSegments.map((segment, index) => (
                    <g key={index}>
                      <path
                        d={segment.path}
                        fill={segment.color}
                        className="transition-opacity hover:opacity-80 cursor-pointer"
                      />
                    </g>
                  ))}
                  {/* Center circle for donut effect */}
                  <circle cx="100" cy="100" r="50" fill="var(--surface)" />
                  <text
                    x="100"
                    y="95"
                    textAnchor="middle"
                    className="text-2xl font-bold"
                    fill="var(--text)"
                  >
                    {filteredStatusStats.total}
                  </text>
                  <text
                    x="100"
                    y="110"
                    textAnchor="middle"
                    className="text-xs"
                    fill="var(--muted)"
                  >
                    Total Runs
                  </text>
                </svg>

                {/* Legend */}
                <div className="mt-6 space-y-2">
                  {pieSegments.map((segment, index) => (
                    <div key={index} className="flex items-center justify-between gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: segment.color }}
                        />
                        <span style={{ color: 'var(--text)' }}>{segment.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold" style={{ color: 'var(--text)' }}>
                          {segment.value}
                        </span>
                        <span style={{ color: 'var(--muted)' }}>
                          ({segment.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Area Chart */}
        <div className="rounded-lg p-4" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-base font-light" style={{ color: 'var(--text)' }}>
              Execution Trend ({timeRange.charAt(0).toUpperCase() + timeRange.slice(1)})
            </h2>
            <div className="flex items-center gap-2">
              {/* Date Filter */}
              <select
                value={executionDateFilter}
                onChange={(e) => setExecutionDateFilter(e.target.value)}
                className="px-2 py-1 rounded text-xs border appearance-none"
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                  paddingRight: '1.5rem',
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.25rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1em 1em'
                }}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
              </select>
              {/* Namespace Filter */}
              <select
                value={executionNamespaceFilter}
                onChange={(e) => setExecutionNamespaceFilter(e.target.value)}
                className="px-2 py-1 rounded text-xs border appearance-none"
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                  paddingRight: '1.5rem',
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.25rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1em 1em'
                }}
              >
                <option value="all">All Categories</option>
                {namespaces.map((ns) => (
                  <option key={ns.id} value={ns.name}>{ns.displayName}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p style={{ color: 'var(--muted)' }}>Loading...</p>
            </div>
          ) : filteredChartData.length === 0 ? (
            <div className="text-center py-8">
              <p style={{ color: 'var(--muted)' }}>No data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Area Chart */}
              <div className="overflow-x-auto">
                <svg className="w-full min-w-[500px]" height="220" viewBox="0 0 800 220">
                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map((percent) => (
                    <line
                      key={percent}
                      x1="40"
                      y1={180 - (percent * 1.6)}
                      x2="780"
                      y2={180 - (percent * 1.6)}
                      stroke="var(--border)"
                      strokeWidth="1"
                      strokeDasharray="4"
                      opacity="0.3"
                    />
                  ))}

                  {/* Area paths for each status */}
                  {(() => {
                    const width = 740;
                    const height = 160;
                    const padding = 40;
                    const step = width / (filteredChartData.length - 1 || 1);
                    const maxValue = getMaxValue();

                    const createAreaPath = (dataKey) => {
                      const points = filteredChartData.map((item, index) => ({
                        x: padding + (index * step),
                        y: 20 + (height - ((item[dataKey] / maxValue) * height))
                      }));

                      const pathD = `
                        M ${points[0].x} ${height + 20}
                        L ${points[0].x} ${points[0].y}
                        ${points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')}
                        L ${points[points.length - 1].x} ${height + 20}
                        Z
                      `;

                      const lineD = points.map((p, i) =>
                        i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
                      ).join(' ');

                      return { pathD, lineD, points };
                    };

                    return (
                      <>
                        {/* Success Area */}
                        {visibleStatuses.success && (() => {
                          const { pathD, lineD, points } = createAreaPath('success');
                          return (
                            <g key="success">
                              <path d={pathD} fill="#22c55e" fillOpacity="0.2" />
                              <path d={lineD} stroke="#22c55e" strokeWidth="2" fill="none" />
                              {points.map((point, i) => (
                                <circle
                                  key={i}
                                  cx={point.x}
                                  cy={point.y}
                                  r="4"
                                  fill="#22c55e"
                                  className="hover:r-6 transition-all cursor-pointer"
                                >
                                  <title>Success: {filteredChartData[i].success}</title>
                                </circle>
                              ))}
                            </g>
                          );
                        })()}

                        {/* Failed Area */}
                        {visibleStatuses.failed && (() => {
                          const { pathD, lineD, points } = createAreaPath('failed');
                          return (
                            <g key="failed">
                              <path d={pathD} fill="#ef4444" fillOpacity="0.2" />
                              <path d={lineD} stroke="#ef4444" strokeWidth="2" fill="none" />
                              {points.map((point, i) => (
                                <circle
                                  key={i}
                                  cx={point.x}
                                  cy={point.y}
                                  r="4"
                                  fill="#ef4444"
                                  className="hover:r-6 transition-all cursor-pointer"
                                >
                                  <title>Failed: {filteredChartData[i].failed}</title>
                                </circle>
                              ))}
                            </g>
                          );
                        })()}

                        {/* Running Area */}
                        {visibleStatuses.running && (() => {
                          const { pathD, lineD, points } = createAreaPath('running');
                          return (
                            <g key="running">
                              <path d={pathD} fill="#3b82f6" fillOpacity="0.2" />
                              <path d={lineD} stroke="#3b82f6" strokeWidth="2" fill="none" />
                              {points.map((point, i) => (
                                <circle
                                  key={i}
                                  cx={point.x}
                                  cy={point.y}
                                  r="4"
                                  fill="#3b82f6"
                                  className="hover:r-6 transition-all cursor-pointer"
                                >
                                  <title>Running: {filteredChartData[i].running}</title>
                                </circle>
                              ))}
                            </g>
                          );
                        })()}

                        {/* Pending Area */}
                        {visibleStatuses.pending && (() => {
                          const { pathD, lineD, points } = createAreaPath('pending');
                          return (
                            <g key="pending">
                              <path d={pathD} fill="#f59e0b" fillOpacity="0.2" />
                              <path d={lineD} stroke="#f59e0b" strokeWidth="2" fill="none" />
                              {points.map((point, i) => (
                                <circle
                                  key={i}
                                  cx={point.x}
                                  cy={point.y}
                                  r="4"
                                  fill="#f59e0b"
                                  className="hover:r-6 transition-all cursor-pointer"
                                >
                                  <title>Pending: {filteredChartData[i].pending}</title>
                                </circle>
                              ))}
                            </g>
                          );
                        })()}

                        {/* X-axis labels */}
                        {filteredChartData.map((item, index) => (
                          <text
                            key={index}
                            x={padding + (index * step)}
                            y="200"
                            textAnchor="middle"
                            fontSize="10"
                            fill="var(--muted)"
                          >
                            {item.label.split(' ').slice(0, 2).join(' ')}
                          </text>
                        ))}

                        {/* Y-axis labels */}
                        {[0, 25, 50, 75, 100].map((percent) => (
                          <text
                            key={percent}
                            x="10"
                            y={185 - (percent * 1.6)}
                            textAnchor="start"
                            fontSize="10"
                            fill="var(--muted)"
                          >
                            {Math.round((maxValue * percent) / 100)}
                          </text>
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </div>

              {/* Interactive Legend */}
              <div className="flex items-center justify-center gap-4 pt-2 flex-wrap">
                <button
                  onClick={() => toggleStatus('success')}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all hover:opacity-80"
                  style={{
                    backgroundColor: visibleStatuses.success ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                    border: `1px solid ${visibleStatuses.success ? '#22c55e' : 'var(--border)'}`,
                    opacity: visibleStatuses.success ? 1 : 0.5
                  }}
                >
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#22c55e' }}></div>
                  <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>Success</span>
                </button>
                <button
                  onClick={() => toggleStatus('failed')}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all hover:opacity-80"
                  style={{
                    backgroundColor: visibleStatuses.failed ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                    border: `1px solid ${visibleStatuses.failed ? '#ef4444' : 'var(--border)'}`,
                    opacity: visibleStatuses.failed ? 1 : 0.5
                  }}
                >
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ef4444' }}></div>
                  <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>Failed</span>
                </button>
                <button
                  onClick={() => toggleStatus('running')}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all hover:opacity-80"
                  style={{
                    backgroundColor: visibleStatuses.running ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    border: `1px solid ${visibleStatuses.running ? '#3b82f6' : 'var(--border)'}`,
                    opacity: visibleStatuses.running ? 1 : 0.5
                  }}
                >
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
                  <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>Running</span>
                </button>
                <button
                  onClick={() => toggleStatus('pending')}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all hover:opacity-80"
                  style={{
                    backgroundColor: visibleStatuses.pending ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                    border: `1px solid ${visibleStatuses.pending ? '#f59e0b' : 'var(--border)'}`,
                    opacity: visibleStatuses.pending ? 1 : 0.5
                  }}
                >
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
                  <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>Pending</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Success Rate & Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg p-6" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase" style={{ color: 'var(--muted)' }}>Success Rate</h3>
            <Activity className="h-4 w-4" style={{ color: '#22c55e' }} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold" style={{ color: '#22c55e' }}>{calculateSuccessRate()}%</span>
            <span className="text-sm" style={{ color: 'var(--muted)' }}>of {stats.total} runs</span>
          </div>
          <div className="mt-4 h-2 rounded-full" style={{ backgroundColor: 'var(--bg)' }}>
            <div
              className="h-2 rounded-full transition-all"
              style={{
                backgroundColor: '#22c55e',
                width: `${calculateSuccessRate()}%`
              }}
            />
          </div>
        </div>

        <div className="rounded-lg p-6" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase" style={{ color: 'var(--muted)' }}>Failure Rate</h3>
            <TrendingDown className="h-4 w-4" style={{ color: '#ef4444' }} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold" style={{ color: '#ef4444' }}>
              {stats.total > 0 ? ((stats.failed / stats.total) * 100).toFixed(1) : 0}%
            </span>
            <span className="text-sm" style={{ color: 'var(--muted)' }}>{stats.failed} failed</span>
          </div>
          <div className="mt-4 h-2 rounded-full" style={{ backgroundColor: 'var(--bg)' }}>
            <div
              className="h-2 rounded-full transition-all"
              style={{
                backgroundColor: '#ef4444',
                width: `${stats.total > 0 ? ((stats.failed / stats.total) * 100) : 0}%`
              }}
            />
          </div>
        </div>

        <div className="rounded-lg p-6" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase" style={{ color: 'var(--muted)' }}>Active & Pending</h3>
            <Clock className="h-4 w-4" style={{ color: '#3b82f6' }} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold" style={{ color: '#3b82f6' }}>
              {stats.running + stats.pending}
            </span>
            <span className="text-sm" style={{ color: 'var(--muted)' }}>in progress</span>
          </div>
          <div className="mt-4 flex gap-2 text-xs">
            <span style={{ color: '#3b82f6' }}>▪ Running: {stats.running}</span>
            <span style={{ color: '#f59e0b' }}>▪ Pending: {stats.pending}</span>
          </div>
        </div>
      </div>

      {/* Top Automations & Recent Runs - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Automations */}
        <div className="rounded-lg p-4" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-light" style={{ color: 'var(--text)' }}>
              Top Automations by Execution Count
            </h2>
            <TrendingUp className="h-4 w-4" style={{ color: 'var(--muted)' }} />
          </div>

          {loading ? (
            <div className="text-center py-6">
              <p style={{ color: 'var(--muted)' }}>Loading...</p>
            </div>
          ) : topAutomations.length === 0 ? (
            <div className="text-center py-6">
              <p style={{ color: 'var(--muted)' }}>No automation data available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topAutomations.map((automation, index) => (
                <div
                  key={automation.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: 'var(--bg)' }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold"
                    style={{
                      backgroundColor: index === 0 ? '#22c55e15' : 'var(--surface)',
                      color: index === 0 ? '#22c55e' : 'var(--text)'
                    }}
                  >
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" style={{ color: 'var(--text)' }}>
                      {automation.name}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>
                      {automation.namespace}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold" style={{ color: '#4C12A1' }}>
                      {automation.runs || 0}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>runs</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Runs - Expandable */}
        <div className="rounded-lg p-4" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-light" style={{ color: 'var(--text)' }}>
            Recent Execution History
          </h2>
          <button
            onClick={() => setExpandedView(!expandedView)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm font-medium"
            style={{
              backgroundColor: 'var(--bg)',
              color: 'var(--text)'
            }}
          >
            {expandedView ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Expand
              </>
            )}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-6">
            <p style={{ color: 'var(--muted)' }}>Loading...</p>
          </div>
        ) : recentRuns.length === 0 ? (
          <div className="text-center py-6">
            <p style={{ color: 'var(--muted)' }}>No recent runs</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>
                    Automation
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>
                    Started
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>
                    Duration
                  </th>
                  {expandedView && (
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>
                      AWX Job ID
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {recentRuns.slice(0, expandedView ? 20 : 5).map((run) => {
                  const statusConfig = {
                    success: { color: '#22c55e', bg: '#22c55e15', icon: CheckCircle },
                    failed: { color: '#ef4444', bg: '#ef444415', icon: XCircle },
                    running: { color: '#3b82f6', bg: '#3b82f615', icon: Clock },
                    pending: { color: '#f59e0b', bg: '#f59e0b15', icon: AlertCircle },
                  };

                  const config = statusConfig[run.status] || statusConfig.pending;
                  const StatusIcon = config.icon;

                  const duration = run.completedAt
                    ? ((new Date(run.completedAt) - new Date(run.startedAt)) / 1000 / 60).toFixed(1)
                    : null;

                  return (
                    <tr
                      key={run.id}
                      className="hover:opacity-80 transition-opacity"
                      style={{ borderBottom: '1px solid var(--border)' }}
                    >
                      <td className="px-4 py-3">
                        <div
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
                          style={{ backgroundColor: config.bg, color: config.color }}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {run.status}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                          {run.automation?.name || 'Unknown'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>
                          {new Date(run.startedAt).toLocaleString()}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-mono" style={{ color: 'var(--text)' }}>
                          {duration ? `${duration} min` : '-'}
                        </p>
                      </td>
                      {expandedView && (
                        <td className="px-4 py-3">
                          <p className="text-sm font-mono" style={{ color: 'var(--muted)' }}>
                            {run.awxJobId || '-'}
                          </p>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>

      {/* Detailed Records View with Pagination and Search */}
      <div className="rounded-lg p-6" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-light" style={{ color: 'var(--text)' }}>Detailed Execution Records</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              {filteredDetailedRuns.length} records found
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--muted)' }} />
              <input
                type="text"
                placeholder="Search runs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-lg text-sm transition-all w-64"
                style={{
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--muted)' }}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Advanced Search Toggle */}
            <button
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
              style={{
                backgroundColor: showAdvancedSearch ? '#4C12A1' : 'var(--bg)',
                color: showAdvancedSearch ? 'white' : 'var(--text)',
                border: `1px solid ${showAdvancedSearch ? '#4C12A1' : 'var(--border)'}`
              }}
            >
              <Filter className="h-4 w-4" />
              Advanced Filters
              {Object.values(advancedFilters).some(v => v && v !== 'all') && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}>
                  Active
                </span>
              )}
            </button>

            {/* Clear Filters */}
            {(searchQuery || Object.values(advancedFilters).some(v => v && v !== 'all')) && (
              <button
                onClick={clearAllFilters}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
                style={{
                  backgroundColor: 'var(--bg)',
                  color: '#ef4444',
                  border: '1px solid var(--border)'
                }}
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Advanced Search Panel */}
        {showAdvancedSearch && (
          <div className="mb-6 p-4 rounded-lg space-y-4" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                  Status
                </label>
                <select
                  value={advancedFilters.status}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="running">Running</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {/* Namespace Filter */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                  Category
                </label>
                <select
                  value={advancedFilters.namespace}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, namespace: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <option value="all">All Categories</option>
                  {namespaces.map((ns) => (
                    <option key={ns.id} value={ns.name}>{ns.displayName}</option>
                  ))}
                </select>
              </div>

              {/* Date From */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                  Date From
                </label>
                <input
                  type="date"
                  value={advancedFilters.dateFrom}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, dateFrom: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)'
                  }}
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                  Date To
                </label>
                <input
                  type="date"
                  value={advancedFilters.dateTo}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, dateTo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)'
                  }}
                />
              </div>

              {/* Automation Name */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                  Automation Name
                </label>
                <input
                  type="text"
                  placeholder="Filter by name..."
                  value={advancedFilters.automationName}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, automationName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)'
                  }}
                />
              </div>

              {/* Executed By */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                  Executed By
                </label>
                <input
                  type="text"
                  placeholder="Filter by user..."
                  value={advancedFilters.executedBy}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, executedBy: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)'
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Results Table */}
        {loading ? (
          <div className="text-center py-12">
            <p style={{ color: 'var(--muted)' }}>Loading records...</p>
          </div>
        ) : paginatedRuns.length === 0 ? (
          <div className="text-center py-12">
            <Eye className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--muted)', opacity: 0.5 }} />
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No records found matching your criteria</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>
                      Run ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>
                      Automation
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>
                      Executed By
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>
                      Started At
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>
                      Duration
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>
                      AWX Job
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRuns.map((run) => {
                    const automation = automations.find(a => a.id === run.automationId);
                    const statusConfig = {
                      success: { color: '#22c55e', bg: '#22c55e15', icon: CheckCircle },
                      failed: { color: '#ef4444', bg: '#ef444415', icon: XCircle },
                      running: { color: '#3b82f6', bg: '#3b82f615', icon: Clock },
                      pending: { color: '#f59e0b', bg: '#f59e0b15', icon: AlertCircle },
                    };

                    const config = statusConfig[run.status] || statusConfig.pending;
                    const StatusIcon = config.icon;

                    const duration = run.completedAt
                      ? ((new Date(run.completedAt) - new Date(run.startedAt)) / 1000 / 60).toFixed(1)
                      : null;

                    return (
                      <tr
                        key={run.id}
                        className="hover:opacity-80 transition-opacity"
                        style={{ borderBottom: '1px solid var(--border)' }}
                      >
                        <td className="px-4 py-3">
                          <code className="text-xs font-mono" style={{ color: '#4C12A1' }}>
                            {run.uniqueId || run.id.substring(0, 8)}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
                            style={{ backgroundColor: config.bg, color: config.color }}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {run.status}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium truncate max-w-xs" style={{ color: 'var(--text)' }}>
                            {automation?.name || 'Unknown'}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm" style={{ color: 'var(--muted)' }}>
                            {automation?.namespace || '-'}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm" style={{ color: 'var(--text)' }}>
                            {run.executedBy || '-'}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm" style={{ color: 'var(--muted)' }}>
                            {new Date(run.startedAt).toLocaleString()}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-mono" style={{ color: 'var(--text)' }}>
                            {duration ? `${duration} min` : '-'}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
                            {run.awxJobId || '-'}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
              {/* Page Size Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: 'var(--muted)' }}>Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-lg text-sm"
                  style={{
                    backgroundColor: 'var(--bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <span className="text-sm" style={{ color: 'var(--muted)' }}>
                  entries per page
                </span>
              </div>

              {/* Pagination Info and Navigation */}
              <div className="flex items-center gap-4">
                <span className="text-sm" style={{ color: 'var(--muted)' }}>
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredDetailedRuns.length)} of {filteredDetailedRuns.length} records
                </span>

                <div className="flex items-center gap-2">
                  {/* First Page */}
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: 'var(--bg)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    First
                  </button>

                  {/* Previous Page */}
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: 'var(--bg)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                          style={{
                            backgroundColor: currentPage === pageNum ? '#4C12A1' : 'var(--bg)',
                            color: currentPage === pageNum ? 'white' : 'var(--text)',
                            border: `1px solid ${currentPage === pageNum ? '#4C12A1' : 'var(--border)'}`
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next Page */}
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: 'var(--bg)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  {/* Last Page */}
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: 'var(--bg)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CompactStatCard({ label, value, icon: Icon, color }) {
  return (
    <div
      className="rounded-lg p-3 flex items-center gap-3"
      style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}
    >
      <div
        className="p-2 rounded-lg flex-shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate" style={{ color: 'var(--muted)' }}>
          {label}
        </p>
        <p className="text-xl font-bold truncate" style={{ color }}>
          {value}
        </p>
      </div>
    </div>
  );
}
