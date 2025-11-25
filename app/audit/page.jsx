'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Calendar, Download, Filter, TrendingUp, Activity, Eye,
  FileSpreadsheet, FileText, Clock, CheckCircle, XCircle,
  AlertCircle, BarChart3, PieChart, LineChart, Maximize2,
  Users, Zap, Server, PlayCircle, StopCircle, AlertTriangle
} from 'lucide-react';
import {
  LineChart as RechartsLine, Line, BarChart as RechartsBar, Bar,
  PieChart as RechartsPie, Pie, AreaChart, Area,
  ScatterChart, Scatter, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

export default function AuditReportsPage() {
  const [dateRange, setDateRange] = useState('30days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [namespaces, setNamespaces] = useState([]);
  const [selectedNamespace, setSelectedNamespace] = useState('all');
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewMode, setViewMode] = useState('overview'); // 'overview', 'details', 'charts'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const chartsRef = useRef(null);

  const COLORS = {
    success: '#22c55e',    // Brighter green for better visibility
    failed: '#f87171',     // Softer red, easier on the eyes
    running: '#60a5fa',    // Lighter blue for better contrast
    pending: '#fbbf24',    // Brighter amber/yellow for visibility
    canceled: '#9ca3af'    // Lighter gray for better readability
  };

  useEffect(() => {
    fetchReportData();
    fetchNamespaces();
  }, [dateRange, customStartDate, customEndDate, selectedNamespace]);

  const fetchNamespaces = async () => {
    try {
      const res = await fetch('/api/namespaces');
      const data = await res.json();
      setNamespaces(data);
    } catch (error) {
      console.error('Error fetching namespaces:', error);
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/runs');
      const runs = await res.json();

      const filteredRuns = filterRunsByDateRange(runs);
      const processedData = processReportData(filteredRuns);
      setReportData(processedData);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRunsByDateRange = (runs) => {
    const now = new Date();
    let startDate;

    switch (dateRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case '7days':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case '30days':
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
      case 'monthly':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'custom':
        if (customStartDate) startDate = new Date(customStartDate);
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 30));
    }

    return runs.filter(run => {
      const runDate = new Date(run.startedAt);
      const matchesDate = !startDate || runDate >= startDate;
      const matchesEndDate = !customEndDate || runDate <= new Date(customEndDate);
      const matchesNamespace = selectedNamespace === 'all' || run.automation?.namespace === selectedNamespace;
      return matchesDate && matchesEndDate && matchesNamespace;
    });
  };

  const processReportData = (runs) => {
    const stats = {
      total: runs.length,
      success: runs.filter(r => r.status === 'success').length,
      failed: runs.filter(r => r.status === 'failed').length,
      running: runs.filter(r => r.status === 'running').length,
      pending: runs.filter(r => r.status === 'pending').length,
      canceled: runs.filter(r => r.status === 'canceled').length,
    };

    stats.successRate = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : 0;
    stats.failureRate = stats.total > 0 ? ((stats.failed / stats.total) * 100).toFixed(1) : 0;
    stats.avgDuration = runs.length > 0
      ? (runs.filter(r => r.completedAt && r.startedAt)
          .reduce((acc, r) => acc + (new Date(r.completedAt) - new Date(r.startedAt)), 0) / runs.length / 1000).toFixed(2)
      : 0;

    // Daily trend data
    const dailyData = {};
    runs.forEach(run => {
      const date = new Date(run.startedAt).toLocaleDateString();
      if (!dailyData[date]) {
        dailyData[date] = { date, total: 0, success: 0, failed: 0, running: 0, pending: 0, canceled: 0 };
      }
      dailyData[date].total++;
      dailyData[date][run.status]++;
    });

    const trendData = Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Status distribution
    const statusDistribution = [
      { name: 'Success', value: stats.success, color: COLORS.success },
      { name: 'Failed', value: stats.failed, color: COLORS.failed },
      { name: 'Running', value: stats.running, color: COLORS.running },
      { name: 'Pending', value: stats.pending, color: COLORS.pending },
      { name: 'Canceled', value: stats.canceled, color: COLORS.canceled },
    ].filter(item => item.value > 0);

    // Top automations
    const automationStats = {};
    runs.forEach(run => {
      const name = run.automation?.name || run.catalog?.name || 'Unknown';
      if (!automationStats[name]) {
        automationStats[name] = { name, total: 0, success: 0, failed: 0, durations: [] };
      }
      automationStats[name].total++;
      if (run.status === 'success') automationStats[name].success++;
      if (run.status === 'failed') automationStats[name].failed++;
      if (run.completedAt && run.startedAt) {
        automationStats[name].durations.push((new Date(run.completedAt) - new Date(run.startedAt)) / 1000);
      }
    });

    const topAutomations = Object.values(automationStats)
      .map(auto => ({
        ...auto,
        successRate: ((auto.success / auto.total) * 100).toFixed(1),
        avgDuration: auto.durations.length > 0
          ? (auto.durations.reduce((a, b) => a + b, 0) / auto.durations.length).toFixed(2)
          : 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Hourly distribution
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}`,
      count: 0,
      success: 0,
      failed: 0
    }));

    runs.forEach(run => {
      const hour = new Date(run.startedAt).getHours();
      hourlyData[hour].count++;
      if (run.status === 'success') hourlyData[hour].success++;
      if (run.status === 'failed') hourlyData[hour].failed++;
    });

    // User activity
    const userStats = {};
    runs.forEach(run => {
      const user = run.executedBy || 'System';
      if (!userStats[user]) {
        userStats[user] = { name: user, executions: 0, success: 0, failed: 0 };
      }
      userStats[user].executions++;
      if (run.status === 'success') userStats[user].success++;
      if (run.status === 'failed') userStats[user].failed++;
    });

    const userActivity = Object.values(userStats)
      .sort((a, b) => b.executions - a.executions)
      .slice(0, 10);

    // Performance scatter data
    const scatterData = runs
      .filter(r => r.completedAt && r.startedAt && r.status !== 'running')
      .map(r => ({
        name: r.automation?.name || r.catalog?.name || 'Unknown',
        duration: ((new Date(r.completedAt) - new Date(r.startedAt)) / 1000),
        status: r.status,
        timestamp: r.startedAt
      }))
      .slice(0, 100);

    return {
      stats,
      trendData,
      statusDistribution,
      topAutomations,
      hourlyData,
      userActivity,
      scatterData,
      allRuns: runs
    };
  };

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case 'today': return 'Today';
      case '7days': return 'Last 7 Days';
      case '30days': return 'Last 30 Days';
      case 'monthly': return 'Last Month';
      case 'custom': return `${customStartDate || 'Start'} to ${customEndDate || 'End'}`;
      default: return 'Last 30 Days';
    }
  };

  const exportToExcel = async () => {
    if (!reportData) return;

    const workbook = new ExcelJS.Workbook();

    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 }
    ];

    summarySheet.addRows([
      { metric: 'Report Period', value: getDateRangeLabel() },
      { metric: 'Total Executions', value: reportData.stats.total },
      { metric: 'Successful', value: reportData.stats.success },
      { metric: 'Failed', value: reportData.stats.failed },
      { metric: 'Running', value: reportData.stats.running },
      { metric: 'Canceled', value: reportData.stats.canceled },
      { metric: 'Pending', value: reportData.stats.pending },
      { metric: 'Success Rate', value: `${reportData.stats.successRate}%` },
      { metric: 'Failure Rate', value: `${reportData.stats.failureRate}%` },
      { metric: 'Average Duration (s)', value: reportData.stats.avgDuration }
    ]);

    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4C12A1' }
    };

    // Top Automations sheet
    const autoSheet = workbook.addWorksheet('Top Automations');
    autoSheet.columns = [
      { header: 'Automation', key: 'name', width: 35 },
      { header: 'Total Runs', key: 'total', width: 15 },
      { header: 'Success', key: 'success', width: 15 },
      { header: 'Failed', key: 'failed', width: 15 },
      { header: 'Success Rate', key: 'successRate', width: 15 },
      { header: 'Avg Duration (s)', key: 'avgDuration', width: 18 }
    ];

    reportData.topAutomations.forEach(auto => {
      autoSheet.addRow({
        name: auto.name,
        total: auto.total,
        success: auto.success,
        failed: auto.failed,
        successRate: `${auto.successRate}%`,
        avgDuration: auto.avgDuration
      });
    });

    autoSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    autoSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4C12A1' }
    };

    // Daily Trend sheet
    const trendSheet = workbook.addWorksheet('Daily Trends');
    trendSheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Total', key: 'total', width: 12 },
      { header: 'Success', key: 'success', width: 12 },
      { header: 'Failed', key: 'failed', width: 12 },
      { header: 'Running', key: 'running', width: 12 },
      { header: 'Canceled', key: 'canceled', width: 12 },
      { header: 'Pending', key: 'pending', width: 12 }
    ];

    reportData.trendData.forEach(day => {
      trendSheet.addRow(day);
    });

    trendSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    trendSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4C12A1' }
    };

    // Add detailed execution data sheet
    const detailSheet = workbook.addWorksheet('All Executions');
    detailSheet.columns = [
      { header: 'Execution ID', key: 'uniqueId', width: 18 },
      { header: 'Automation', key: 'automation', width: 30 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Started At', key: 'startedAt', width: 20 },
      { header: 'Completed At', key: 'completedAt', width: 20 },
      { header: 'Duration (s)', key: 'duration', width: 15 },
      { header: 'Executed By', key: 'executedBy', width: 20 },
      { header: 'AWX Job ID', key: 'awxJobId', width: 15 },
      { header: 'Error Message', key: 'errorMessage', width: 40 }
    ];

    reportData.allRuns.forEach(run => {
      detailSheet.addRow({
        uniqueId: run.uniqueId || '',
        automation: run.automation?.name || run.catalog?.name || '',
        status: run.status || '',
        startedAt: run.startedAt ? new Date(run.startedAt).toLocaleString() : '',
        completedAt: run.completedAt ? new Date(run.completedAt).toLocaleString() : '',
        duration: run.completedAt && run.startedAt
          ? ((new Date(run.completedAt) - new Date(run.startedAt)) / 1000).toFixed(2)
          : '',
        executedBy: run.executedBy || '',
        awxJobId: run.awxJobId || '',
        errorMessage: run.errorMessage || ''
      });
    });

    detailSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    detailSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4C12A1' }
    };

    // Capture charts as images and add to Excel
    try {
      if (chartsRef.current) {
        const canvas = await html2canvas(chartsRef.current, {
          backgroundColor: '#ffffff',
          scale: 2
        });
        const imageData = canvas.toDataURL('image/png');

        const chartsSheet = workbook.addWorksheet('Charts');
        const imageBuffer = Buffer.from(imageData.split(',')[1], 'base64');
        const imageId = workbook.addImage({
          buffer: imageBuffer,
          extension: 'png',
        });

        chartsSheet.addImage(imageId, {
          tl: { col: 0, row: 0 },
          ext: { width: 1200, height: 800 }
        });
      }
    } catch (error) {
      console.error('Error capturing charts:', error);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_report_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = async () => {
    if (!reportData) return;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();

    pdf.setFontSize(20);
    pdf.setTextColor(76, 18, 161);
    pdf.text('Audit Report', pageWidth / 2, 20, { align: 'center' });

    pdf.setFontSize(10);
    pdf.setTextColor(100);
    pdf.text(getDateRangeLabel(), pageWidth / 2, 28, { align: 'center' });

    pdf.setFontSize(14);
    pdf.setTextColor(0);
    pdf.text('Executive Summary', 14, 40);

    const summaryData = [
      ['Total Executions', reportData.stats.total],
      ['Successful', reportData.stats.success],
      ['Failed', reportData.stats.failed],
      ['Success Rate', `${reportData.stats.successRate}%`],
      ['Failure Rate', `${reportData.stats.failureRate}%`],
      ['Avg Duration', `${reportData.stats.avgDuration}s`]
    ];

    pdf.autoTable({
      startY: 45,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [76, 18, 161] },
      margin: { left: 14, right: 14 }
    });

    pdf.setFontSize(14);
    pdf.text('Top Automations', 14, pdf.lastAutoTable.finalY + 15);

    const autoData = reportData.topAutomations.slice(0, 5).map(auto => [
      auto.name,
      auto.total,
      auto.success,
      auto.failed,
      `${auto.successRate}%`
    ]);

    pdf.autoTable({
      startY: pdf.lastAutoTable.finalY + 20,
      head: [['Automation', 'Total', 'Success', 'Failed', 'Success Rate']],
      body: autoData,
      theme: 'grid',
      headStyles: { fillColor: [76, 18, 161] },
      margin: { left: 14, right: 14 }
    });

    if (chartsRef.current) {
      const canvas = await html2canvas(chartsRef.current, {
        backgroundColor: '#ffffff',
        scale: 1.5
      });
      const imgData = canvas.toDataURL('image/png');

      pdf.addPage();
      pdf.setFontSize(14);
      pdf.text('Charts & Visualizations', 14, 20);
      pdf.addImage(imgData, 'PNG', 10, 30, 190, 120);
    }

    pdf.save(`audit_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          padding: '12px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold', marginBottom: '8px', color: 'var(--text)' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ margin: '4px 0', color: entry.color, fontSize: '13px' }}>
              {entry.name}: <strong>{entry.value !== undefined && entry.value !== null ? entry.value : 0}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          padding: '12px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: payload[0].payload.color }}>
            {payload[0].name}
          </p>
          <p style={{ margin: '4px 0', color: 'var(--text)', fontSize: '13px' }}>
            Count: <strong>{payload[0].value}</strong>
          </p>
          <p style={{ margin: '4px 0', color: 'var(--muted)', fontSize: '12px' }}>
            {((payload[0].value / reportData.stats.total) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const viewExecutionDetails = (execution) => {
    setSelectedExecution(execution);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--primary)' }}></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
            <Activity className="inline h-8 w-8 mr-2" />
            Audit Reports & Analytics
          </h1>
          <p className="mt-1" style={{ color: 'var(--muted)' }}>
            Comprehensive execution analytics and reporting dashboard
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: 'var(--success)',
              color: 'white'
            }}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'white'
            }}
          >
            <FileText className="h-4 w-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="flex gap-2 p-1 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', width: 'fit-content' }}>
        <button
          onClick={() => setViewMode('overview')}
          className={`px-4 py-2 rounded-lg transition-all ${viewMode === 'overview' ? 'font-semibold' : ''}`}
          style={{
            backgroundColor: viewMode === 'overview' ? 'var(--primary)' : 'transparent',
            color: viewMode === 'overview' ? 'white' : 'var(--text)'
          }}
        >
          <BarChart3 className="inline h-4 w-4 mr-2" />
          Overview
        </button>
        <button
          onClick={() => setViewMode('charts')}
          className={`px-4 py-2 rounded-lg transition-all ${viewMode === 'charts' ? 'font-semibold' : ''}`}
          style={{
            backgroundColor: viewMode === 'charts' ? 'var(--primary)' : 'transparent',
            color: viewMode === 'charts' ? 'white' : 'var(--text)'
          }}
        >
          <TrendingUp className="inline h-4 w-4 mr-2" />
          Charts
        </button>
        <button
          onClick={() => setViewMode('details')}
          className={`px-4 py-2 rounded-lg transition-all ${viewMode === 'details' ? 'font-semibold' : ''}`}
          style={{
            backgroundColor: viewMode === 'details' ? 'var(--primary)' : 'transparent',
            color: viewMode === 'details' ? 'white' : 'var(--text)'
          }}
        >
          <Eye className="inline h-4 w-4 mr-2" />
          Detailed Logs
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
            <Calendar className="inline h-4 w-4 mr-1" />
            Date Range
          </label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
            style={{
              backgroundColor: 'var(--bg)',
              borderColor: 'var(--border)',
              color: 'var(--text)',
              focusRing: 'var(--primary)'
            }}
          >
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="monthly">Last Month</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {dateRange === 'custom' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                Start Date
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)'
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                End Date
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)'
                }}
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
            <Filter className="inline h-4 w-4 mr-1" />
            Namespace Filter
          </label>
          <select
            value={selectedNamespace}
            onChange={(e) => setSelectedNamespace(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
            style={{
              backgroundColor: 'var(--bg)',
              borderColor: 'var(--border)',
              color: 'var(--text)'
            }}
          >
            <option value="all">All Namespaces</option>
            {namespaces.map(ns => (
              <option key={ns.id} value={ns.name}>{ns.displayName || ns.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Overview Mode */}
      {viewMode === 'overview' && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>Total Executions</p>
                  <p className="text-3xl font-bold mt-2" style={{ color: 'var(--text)' }}>
                    {reportData?.stats.total || 0}
                  </p>
                </div>
                <BarChart3 className="h-12 w-12" style={{ color: 'var(--primary)', opacity: 0.3 }} />
              </div>
            </div>

            <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: `2px solid ${COLORS.success}` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>Successful</p>
                  <p className="text-3xl font-bold mt-2" style={{ color: COLORS.success }}>
                    {reportData?.stats.success || 0}
                  </p>
                  <p className="text-xs mt-1" style={{ color: COLORS.success }}>
                    {reportData?.stats.successRate}% Success Rate
                  </p>
                </div>
                <CheckCircle className="h-12 w-12" style={{ color: COLORS.success, opacity: 0.3 }} />
              </div>
            </div>

            <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: `2px solid ${COLORS.failed}` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>Failed</p>
                  <p className="text-3xl font-bold mt-2" style={{ color: COLORS.failed }}>
                    {reportData?.stats.failed || 0}
                  </p>
                  <p className="text-xs mt-1" style={{ color: COLORS.failed }}>
                    {reportData?.stats.failureRate}% Failure Rate
                  </p>
                </div>
                <XCircle className="h-12 w-12" style={{ color: COLORS.failed, opacity: 0.3 }} />
              </div>
            </div>

            <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: `2px solid ${COLORS.running}` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>Running</p>
                  <p className="text-3xl font-bold mt-2" style={{ color: COLORS.running }}>
                    {reportData?.stats.running || 0}
                  </p>
                </div>
                <Clock className="h-12 w-12 animate-spin" style={{ color: COLORS.running, opacity: 0.3 }} />
              </div>
            </div>

            <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: `2px solid ${COLORS.canceled}` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>Canceled</p>
                  <p className="text-3xl font-bold mt-2" style={{ color: COLORS.canceled }}>
                    {reportData?.stats.canceled || 0}
                  </p>
                </div>
                <StopCircle className="h-12 w-12" style={{ color: COLORS.canceled, opacity: 0.3 }} />
              </div>
            </div>

            <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: `2px solid ${COLORS.pending}` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>Avg Duration</p>
                  <p className="text-3xl font-bold mt-2" style={{ color: 'var(--text)' }}>
                    {reportData?.stats.avgDuration || 0}s
                  </p>
                </div>
                <Zap className="h-12 w-12" style={{ color: COLORS.pending, opacity: 0.3 }} />
              </div>
            </div>
          </div>

          {/* Quick Summary Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text)' }}>
                <PieChart className="inline h-5 w-5 mr-2" />
                Status Distribution
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={reportData?.statusDistribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reportData?.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </RechartsPie>
              </ResponsiveContainer>
            </div>

            {/* Top Automations */}
            <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text)' }}>
                <Server className="inline h-5 w-5 mr-2" />
                Top 5 Automations
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBar data={reportData?.topAutomations.slice(0, 5) || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--muted)" style={{ fontSize: '12px' }} />
                  <YAxis stroke="var(--muted)" style={{ fontSize: '12px' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" fill="var(--primary)" name="Total Runs" />
                  <Bar dataKey="success" fill={COLORS.success} name="Success" />
                  <Bar dataKey="failed" fill={COLORS.failed} name="Failed" />
                </RechartsBar>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Charts Mode */}
      {viewMode === 'charts' && (
        <div ref={chartsRef} className="space-y-6">
          {/* Trend Area Chart */}
          <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
                <TrendingUp className="inline h-5 w-5 mr-2" />
                Execution Trend Over Time
              </h2>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.success }}></div>
                  <span style={{ color: 'var(--text)' }}>Success: {reportData?.stats.success || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.failed }}></div>
                  <span style={{ color: 'var(--text)' }}>Failed: {reportData?.stats.failed || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.canceled }}></div>
                  <span style={{ color: 'var(--text)' }}>Canceled: {reportData?.stats.canceled || 0}</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={reportData?.trendData || []}>
                <defs>
                  <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.success} stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.failed} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.failed} stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorRunning" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.running} stopOpacity={0.6}/>
                    <stop offset="95%" stopColor={COLORS.running} stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="colorCanceled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.canceled} stopOpacity={0.6}/>
                    <stop offset="95%" stopColor={COLORS.canceled} stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  stroke="var(--muted)"
                  style={{ fontSize: '12px' }}
                  tick={{ fill: 'var(--muted)' }}
                />
                <YAxis
                  stroke="var(--muted)"
                  style={{ fontSize: '12px' }}
                  tick={{ fill: 'var(--muted)' }}
                  label={{ value: 'Number of Executions', angle: -90, position: 'insideLeft', style: { fill: 'var(--muted)', fontSize: '12px' } }}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: 'var(--primary)', strokeWidth: 2, strokeDasharray: '5 5' }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
                <Area
                  type="monotone"
                  dataKey="success"
                  stroke={COLORS.success}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSuccess)"
                  name="Successful"
                  dot={{ r: 4, fill: COLORS.success, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7, fill: COLORS.success, strokeWidth: 3, stroke: '#fff' }}
                />
                <Area
                  type="monotone"
                  dataKey="failed"
                  stroke={COLORS.failed}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorFailed)"
                  name="Failed"
                  dot={{ r: 4, fill: COLORS.failed, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7, fill: COLORS.failed, strokeWidth: 3, stroke: '#fff' }}
                />
                <Area
                  type="monotone"
                  dataKey="running"
                  stroke={COLORS.running}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRunning)"
                  name="Running"
                  dot={{ r: 3, fill: COLORS.running }}
                  activeDot={{ r: 6, fill: COLORS.running }}
                />
                <Area
                  type="monotone"
                  dataKey="canceled"
                  stroke={COLORS.canceled}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCanceled)"
                  name="Canceled"
                  dot={{ r: 3, fill: COLORS.canceled }}
                  activeDot={{ r: 6, fill: COLORS.canceled }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Two column charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="mb-4">
                <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
                  <PieChart className="inline h-5 w-5 mr-2" />
                  Status Distribution
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                  Overall execution status breakdown
                </p>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <RechartsPie>
                  <Pie
                    data={reportData?.statusDistribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={{
                      stroke: 'var(--muted)',
                      strokeWidth: 1
                    }}
                    label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                    outerRadius={110}
                    innerRadius={40}
                    paddingAngle={2}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {reportData?.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    formatter={(value, entry) => (
                      <span style={{ color: 'var(--text)', fontSize: '13px' }}>
                        {value}: {entry.payload.value}
                      </span>
                    )}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            </div>

            {/* Top Automations */}
            <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="mb-4">
                <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
                  <BarChart3 className="inline h-5 w-5 mr-2" />
                  Top Automations by Runs
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                  Most frequently executed automations
                </p>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <RechartsBar data={reportData?.topAutomations.slice(0, 6) || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                  <XAxis
                    dataKey="name"
                    stroke="var(--muted)"
                    style={{ fontSize: '11px' }}
                    angle={-35}
                    textAnchor="end"
                    height={120}
                    interval={0}
                    tick={{ fill: 'var(--text)' }}
                  />
                  <YAxis
                    stroke="var(--muted)"
                    style={{ fontSize: '12px' }}
                    tick={{ fill: 'var(--text)' }}
                    label={{ value: 'Number of Runs', angle: -90, position: 'insideLeft', style: { fill: 'var(--muted)', fontSize: '12px' } }}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: 'rgba(76, 18, 161, 0.1)' }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '10px' }}
                    iconType="circle"
                  />
                  <Bar dataKey="success" fill={COLORS.success} name="Success" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="failed" fill={COLORS.failed} name="Failed" radius={[4, 4, 0, 0]} />
                </RechartsBar>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Hourly Heatmap */}
          <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="mb-4">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
                <Clock className="inline h-5 w-5 mr-2" />
                Execution Heatmap by Hour
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                Hourly execution patterns - darker colors indicate higher activity
              </p>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <RechartsBar data={reportData?.hourlyData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                <XAxis
                  dataKey="hour"
                  stroke="var(--muted)"
                  style={{ fontSize: '12px' }}
                  tick={{ fill: 'var(--text)' }}
                  label={{ value: 'Hour of Day (24-hour format)', position: 'insideBottom', offset: -5, style: { fill: 'var(--muted)', fontSize: '12px' } }}
                />
                <YAxis
                  stroke="var(--muted)"
                  style={{ fontSize: '12px' }}
                  tick={{ fill: 'var(--text)' }}
                  label={{ value: 'Number of Executions', angle: -90, position: 'insideLeft', style: { fill: 'var(--muted)', fontSize: '12px' } }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const successRate = data.count > 0 ? ((data.success / data.count) * 100).toFixed(1) : 0;
                      return (
                        <div style={{
                          backgroundColor: 'var(--surface)',
                          border: '2px solid var(--primary)',
                          padding: '14px',
                          borderRadius: '10px',
                          boxShadow: '0 6px 12px rgba(0,0,0,0.15)'
                        }}>
                          <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--text)', fontSize: '14px', marginBottom: '8px' }}>
                            ⏰ Hour: {data.hour}:00
                          </p>
                          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                            <p style={{ margin: '4px 0', color: 'var(--text)', fontSize: '13px' }}>
                              📊 Total: <strong>{data.count}</strong>
                            </p>
                            <p style={{ margin: '4px 0', color: COLORS.success, fontSize: '13px' }}>
                              ✓ Success: <strong>{data.success}</strong>
                            </p>
                            <p style={{ margin: '4px 0', color: COLORS.failed, fontSize: '13px' }}>
                              ✗ Failed: <strong>{data.failed}</strong>
                            </p>
                            <p style={{ margin: '6px 0 0 0', color: 'var(--primary)', fontSize: '12px', fontWeight: 'bold' }}>
                              Success Rate: {successRate}%
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={{ fill: 'rgba(76, 18, 161, 0.1)' }}
                />
                <Bar dataKey="count" name="Executions" radius={[6, 6, 0, 0]}>
                  {reportData?.hourlyData.map((entry, index) => {
                    const maxCount = Math.max(...reportData.hourlyData.map(d => d.count));
                    const intensity = maxCount > 0 ? entry.count / maxCount : 0;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.count > 0 ? `rgba(76, 18, 161, ${0.3 + (intensity * 0.7)})` : 'var(--border)'}
                      />
                    );
                  })}
                </Bar>
              </RechartsBar>
            </ResponsiveContainer>
          </div>

          {/* User Activity */}
          <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="mb-4">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
                <Users className="inline h-5 w-5 mr-2" />
                User Activity Analysis
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                Top users by execution count with success/failure breakdown
              </p>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <RechartsBar data={reportData?.userActivity || []} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                <XAxis
                  type="number"
                  stroke="var(--muted)"
                  style={{ fontSize: '12px' }}
                  tick={{ fill: 'var(--text)' }}
                  label={{ value: 'Number of Executions', position: 'insideBottom', offset: -5, style: { fill: 'var(--muted)', fontSize: '12px' } }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="var(--muted)"
                  style={{ fontSize: '12px' }}
                  tick={{ fill: 'var(--text)' }}
                  width={100}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const successRate = data.executions > 0 ? ((data.success / data.executions) * 100).toFixed(1) : 0;
                      return (
                        <div style={{
                          backgroundColor: 'var(--surface)',
                          border: '2px solid var(--primary)',
                          padding: '14px',
                          borderRadius: '10px',
                          boxShadow: '0 6px 12px rgba(0,0,0,0.15)'
                        }}>
                          <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--text)', fontSize: '14px', marginBottom: '8px' }}>
                            👤 {data.name}
                          </p>
                          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                            <p style={{ margin: '4px 0', color: 'var(--text)', fontSize: '13px' }}>
                              Total Executions: <strong>{data.executions}</strong>
                            </p>
                            <p style={{ margin: '4px 0', color: COLORS.success, fontSize: '13px' }}>
                              ✓ Success: <strong>{data.success}</strong>
                            </p>
                            <p style={{ margin: '4px 0', color: COLORS.failed, fontSize: '13px' }}>
                              ✗ Failed: <strong>{data.failed}</strong>
                            </p>
                            <p style={{ margin: '6px 0 0 0', color: 'var(--primary)', fontSize: '12px', fontWeight: 'bold' }}>
                              Success Rate: {successRate}%
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={{ fill: 'rgba(76, 18, 161, 0.1)' }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '10px' }}
                  iconType="circle"
                />
                <Bar dataKey="success" fill={COLORS.success} name="Successful" stackId="a" radius={[0, 4, 4, 0]} />
                <Bar dataKey="failed" fill={COLORS.failed} name="Failed" stackId="a" radius={[0, 4, 4, 0]} />
              </RechartsBar>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detailed Logs Mode */}
      {viewMode === 'details' && (
        <div className="space-y-4">
          <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
                <Eye className="inline h-5 w-5 mr-2" />
                Detailed Execution Logs
              </h2>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, reportData?.allRuns.length || 0)} of {reportData?.allRuns.length || 0} executions
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th className="text-left py-3 px-4" style={{ color: 'var(--muted)', fontSize: '12px', fontWeight: '600' }}>ID</th>
                    <th className="text-left py-3 px-4" style={{ color: 'var(--muted)', fontSize: '12px', fontWeight: '600' }}>Automation</th>
                    <th className="text-left py-3 px-4" style={{ color: 'var(--muted)', fontSize: '12px', fontWeight: '600' }}>Status</th>
                    <th className="text-left py-3 px-4" style={{ color: 'var(--muted)', fontSize: '12px', fontWeight: '600' }}>Started At</th>
                    <th className="text-left py-3 px-4" style={{ color: 'var(--muted)', fontSize: '12px', fontWeight: '600' }}>Duration</th>
                    <th className="text-left py-3 px-4" style={{ color: 'var(--muted)', fontSize: '12px', fontWeight: '600' }}>Executed By</th>
                    <th className="text-left py-3 px-4" style={{ color: 'var(--muted)', fontSize: '12px', fontWeight: '600' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData?.allRuns
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((run, index) => (
                    <tr
                      key={run.id}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        backgroundColor: index % 2 === 0 ? 'transparent' : 'var(--bg)'
                      }}
                      className="hover:opacity-80 transition-opacity"
                    >
                      <td className="py-3 px-4" style={{ color: 'var(--text)', fontSize: '13px', fontFamily: 'monospace' }}>
                        {run.uniqueId || run.id?.substring(0, 8)}
                      </td>
                      <td className="py-3 px-4" style={{ color: 'var(--text)', fontSize: '13px' }}>
                        {run.automation?.name || run.catalog?.name || 'Unknown'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="px-2 py-1 rounded text-xs font-semibold"
                          style={{
                            backgroundColor: COLORS[run.status] + '20',
                            color: COLORS[run.status]
                          }}
                        >
                          {run.status}
                        </span>
                      </td>
                      <td className="py-3 px-4" style={{ color: 'var(--muted)', fontSize: '13px' }}>
                        {new Date(run.startedAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4" style={{ color: 'var(--text)', fontSize: '13px' }}>
                        {run.completedAt && run.startedAt
                          ? `${((new Date(run.completedAt) - new Date(run.startedAt)) / 1000).toFixed(2)}s`
                          : '-'}
                      </td>
                      <td className="py-3 px-4" style={{ color: 'var(--text)', fontSize: '13px' }}>
                        {run.executedBy || 'System'}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => viewExecutionDetails(run)}
                          className="flex items-center gap-1 px-3 py-1 rounded text-xs transition-colors"
                          style={{
                            backgroundColor: 'var(--primary)',
                            color: 'white'
                          }}
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {reportData && reportData.allRuns && reportData.allRuns.length > itemsPerPage && (
            <div className="flex justify-center items-center gap-2 p-4 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: currentPage === 1 ? 'var(--bg)' : 'var(--primary)',
                  color: currentPage === 1 ? 'var(--muted)' : 'white'
                }}
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: currentPage === 1 ? 'var(--bg)' : 'var(--primary)',
                  color: currentPage === 1 ? 'var(--muted)' : 'white'
                }}
              >
                Previous
              </button>
              <span className="px-4 py-2" style={{ color: 'var(--text)' }}>
                Page {currentPage} of {Math.ceil(reportData.allRuns.length / itemsPerPage)}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= Math.ceil(reportData.allRuns.length / itemsPerPage)}
                className="px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: currentPage >= Math.ceil(reportData.allRuns.length / itemsPerPage) ? 'var(--bg)' : 'var(--primary)',
                  color: currentPage >= Math.ceil(reportData.allRuns.length / itemsPerPage) ? 'var(--muted)' : 'white'
                }}
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(Math.ceil(reportData.allRuns.length / itemsPerPage))}
                disabled={currentPage >= Math.ceil(reportData.allRuns.length / itemsPerPage)}
                className="px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: currentPage >= Math.ceil(reportData.allRuns.length / itemsPerPage) ? 'var(--bg)' : 'var(--primary)',
                  color: currentPage >= Math.ceil(reportData.allRuns.length / itemsPerPage) ? 'var(--muted)' : 'white'
                }}
              >
                Last
              </button>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedExecution && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden" style={{ backgroundColor: 'var(--surface)' }}>
            <div className="p-6" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
                    Execution Details
                  </h2>
                  <p className="mt-1" style={{ color: 'var(--muted)' }}>
                    {selectedExecution.automation?.name || selectedExecution.catalog?.name}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 rounded-lg hover:bg-opacity-80 transition-colors"
                  style={{ backgroundColor: 'var(--bg)' }}
                >
                  <XCircle className="h-6 w-6" style={{ color: 'var(--muted)' }} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--muted)' }}>Execution ID</p>
                  <p className="font-mono text-sm" style={{ color: 'var(--text)' }}>
                    {selectedExecution.uniqueId || selectedExecution.id}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--muted)' }}>Status</p>
                  <span
                    className="px-3 py-1 rounded text-sm font-semibold"
                    style={{
                      backgroundColor: COLORS[selectedExecution.status] + '20',
                      color: COLORS[selectedExecution.status]
                    }}
                  >
                    {selectedExecution.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--muted)' }}>Started At</p>
                  <p className="text-sm" style={{ color: 'var(--text)' }}>
                    {new Date(selectedExecution.startedAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--muted)' }}>Completed At</p>
                  <p className="text-sm" style={{ color: 'var(--text)' }}>
                    {selectedExecution.completedAt ? new Date(selectedExecution.completedAt).toLocaleString() : 'In Progress'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--muted)' }}>Duration</p>
                  <p className="text-sm" style={{ color: 'var(--text)' }}>
                    {selectedExecution.completedAt && selectedExecution.startedAt
                      ? `${((new Date(selectedExecution.completedAt) - new Date(selectedExecution.startedAt)) / 1000).toFixed(2)} seconds`
                      : 'Running...'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--muted)' }}>Executed By</p>
                  <p className="text-sm" style={{ color: 'var(--text)' }}>
                    {selectedExecution.executedBy || 'System'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--muted)' }}>AWX Job ID</p>
                  <p className="font-mono text-sm" style={{ color: 'var(--text)' }}>
                    {selectedExecution.awxJobId || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--muted)' }}>Namespace</p>
                  <p className="text-sm" style={{ color: 'var(--text)' }}>
                    {selectedExecution.automation?.namespace || selectedExecution.catalog?.namespace || 'N/A'}
                  </p>
                </div>
              </div>

              {selectedExecution.parameters && (
                <div className="mt-6">
                  <p className="text-sm font-semibold mb-2" style={{ color: 'var(--muted)' }}>Parameters</p>
                  <pre
                    className="p-4 rounded-lg overflow-x-auto text-xs"
                    style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                  >
                    {JSON.stringify(JSON.parse(selectedExecution.parameters || '{}'), null, 2)}
                  </pre>
                </div>
              )}

              {selectedExecution.artifacts && (
                <div className="mt-6">
                  <p className="text-sm font-semibold mb-2" style={{ color: 'var(--muted)' }}>Results / Artifacts</p>
                  <pre
                    className="p-4 rounded-lg overflow-x-auto text-xs"
                    style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                  >
                    {JSON.stringify(JSON.parse(selectedExecution.artifacts || '{}'), null, 2)}
                  </pre>
                </div>
              )}

              {selectedExecution.errorMessage && (
                <div className="mt-6">
                  <p className="text-sm font-semibold mb-2" style={{ color: COLORS.failed }}>
                    <AlertTriangle className="inline h-4 w-4 mr-1" />
                    Error Message
                  </p>
                  <div
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: COLORS.failed + '10', border: `1px solid ${COLORS.failed}` }}
                  >
                    <p className="text-sm" style={{ color: 'var(--text)' }}>
                      {selectedExecution.errorMessage}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
