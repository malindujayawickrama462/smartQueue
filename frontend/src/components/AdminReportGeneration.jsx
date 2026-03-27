import React, { useState, useEffect, useRef } from 'react';
import { Card } from './Card';
import html2pdf from 'html2pdf.js';
import { generateAdminReport } from '../api/orderApi';
import { getAllCanteens } from '../api/canteenApi';

const REPORT_TYPES = [
  { id: 'orders', label: '1️⃣ 📦 Order Reports' },
  { id: 'time_slots', label: '2️⃣ ⏰ Time-Slot Report' },
  { id: 'food_items', label: '3️⃣ 🍽️ Food Item Report' },
  { id: 'sales', label: '4️⃣ 💰 Sales Report' },
  { id: 'kitchen', label: '5️⃣ 👨‍🍳 Kitchen Performance Report' },
  { id: 'crowd', label: '6️⃣ 🚶 Crowd Management Report' },
  { id: 'late_orders', label: '7️⃣ ⏳ Late Orders Report' }
];

export default function AdminReportGeneration() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCanteen, setSelectedCanteen] = useState('all');
  const [reportType, setReportType] = useState('orders');
  const [canteens, setCanteens] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState(null);

  const reportRef = useRef();

  useEffect(() => {
    const fetchCanteens = async () => {
      try {
        const res = await getAllCanteens();
        if (res.canteens) setCanteens(res.canteens);
      } catch (err) {
        console.error("Failed to load canteens", err);
      }
    };
    fetchCanteens();
  }, []);

  const handlePreview = async () => {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      setReportData(null);
      const res = await generateAdminReport({
        startDate,
        endDate,
        canteenID: selectedCanteen,
        reportType
      });
      setReportData(res);
    } catch (err) {
      setError(err.message || 'Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!reportData || !reportRef.current) return;
    const element = reportRef.current;
    const opt = {
      margin: 0.5,
      filename: `SmartQueue_${reportType}_Report_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  // Helper to get formatted canteen name
  const getCanteenName = () => {
    if (selectedCanteen === 'all') return 'All Canteens (Global Segment)';
    const c = canteens.find(x => x._id === selectedCanteen);
    return c ? c.name : 'Unknown Canteen';
  };

  const renderOrderListTable = (orders, title) => (
    <div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>{title} ({orders.length} Records)</h3>
      {orders.length > 0 ? (
        <table style={{ width: '100%', textAlign: 'left', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', color: '#475569', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>Order ID</th>
              <th style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>Date</th>
              <th style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>Student</th>
              <th style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>Items</th>
              <th style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Total</th>
              <th style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.5rem' }}>{o.orderID}</td>
                <td style={{ padding: '0.5rem' }}>{new Date(o.createdAt).toLocaleString()}</td>
                <td style={{ padding: '0.5rem' }}>{o.student?.name}</td>
                <td style={{ padding: '0.5rem' }}>{o.items.map(it => `${it.quantity}x ${it.name}`).join(', ')}</td>
                <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold' }}>Rs. {o.totalPrice}</td>
                <td style={{ padding: '0.5rem', textAlign: 'right' }}>{o.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : <p style={{ color: '#64748b', fontStyle: 'italic' }}>No records found for the selected period.</p>}
    </div>
  );

  const renderReportContent = () => {
    if (!reportData || !reportData.data) return null;
    const { reportType: type, data } = reportData;

    switch (type) {
      case 'orders':
        return renderOrderListTable(data, "All Processed Orders");
      
      case 'late_orders':
        return renderOrderListTable(data, "Late / Missed Arrival Orders");

      case 'time_slots':
        return (
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Time-Slot Usage Analytics</h3>
            {data.length > 0 ? (
              <table style={{ width: '100%', textAlign: 'left', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', color: '#475569', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Time Slot Range</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Total Orders Processed</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((slot, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{slot._id || 'Unknown slot'}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: '#4338ca' }}>{slot.totalOrders} Orders</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p style={{ color: '#64748b', fontStyle: 'italic' }}>No time slot data found.</p>}
          </div>
        );

      case 'food_items':
        return (
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Food Item Performance Metrics</h3>
            {data.length > 0 ? (
              <table style={{ width: '100%', textAlign: 'left', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', color: '#475569', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Rank</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Food Name</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Units Sold</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Total Revenue Generated</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem', color: '#64748b' }}>#{i + 1}</td>
                      <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{item._id}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>{item.totalSold}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: '#059669' }}>Rs. {item.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p style={{ color: '#64748b', fontStyle: 'italic' }}>No food items sold during this period.</p>}
          </div>
        );

      case 'sales':
        return (
          <div>
            <div style={{ padding: '2rem', backgroundColor: '#eef2ff', borderRadius: '0.5rem', border: '1px solid #c7d2fe', marginBottom: '2rem', textAlign: 'center' }}>
                <p style={{ fontSize: '1rem', fontWeight: 'bold', color: '#4f46e5', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total System Revenue</p>
                <p style={{ fontSize: '3rem', fontWeight: '900', color: '#312e81', margin: 0 }}>Rs. {data.totalRevenue?.toLocaleString()}</p>
            </div>
            
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Revenue by Payment Method</h3>
            {data.paymentSplits?.length > 0 ? (
              <table style={{ width: '100%', textAlign: 'left', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', color: '#475569', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Payment Mode</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Transactions</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Revenue Captured</th>
                  </tr>
                </thead>
                <tbody>
                  {data.paymentSplits.map((method, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{method._id}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>{method.orders}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: '#059669' }}>Rs. {method.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p style={{ color: '#64748b', fontStyle: 'italic' }}>No payment data recorded.</p>}
          </div>
        );

      case 'kitchen':
        return (
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Kitchen Efficiency & Pipeline</h3>
            {data.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {data.map((stat, i) => (
                  <div key={i} style={{ padding: '1.5rem', backgroundColor: stat._id === 'Late' ? '#fef2f2' : '#f0fdf4', borderRadius: '0.5rem', border: `1px solid ${stat._id === 'Late' ? '#fecaca' : '#bbf7d0'}` }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 'bold', color: stat._id === 'Late' ? '#ef4444' : '#16a34a', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Orders Status: {stat._id}</p>
                      <p style={{ fontSize: '2.5rem', fontWeight: '900', color: stat._id === 'Late' ? '#991b1b' : '#14532d', margin: 0 }}>{stat.count}</p>
                  </div>
                ))}
              </div>
            ) : <p style={{ color: '#64748b', fontStyle: 'italic' }}>No kitchen workflow data generated.</p>}
          </div>
        );

      case 'crowd':
        return (
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Crowd Management & Student Flow</h3>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>Analysis indicates the number of unique students present during specific time allocations.</p>
            {data.length > 0 ? (
              <table style={{ width: '100%', textAlign: 'left', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', color: '#475569', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Campus Time Slot</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Unique Student Headcount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((slot, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{slot._id || 'Unknown slot'}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: '#f59e0b' }}>{slot.studentCount} Students</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p style={{ color: '#64748b', fontStyle: 'italic' }}>No student presence data resolved.</p>}
          </div>
        );
      default:
        return <p style={{ color: '#ef4444' }}>Unknown report structure returned from servers.</p>;
    }
  };

  return (
    <div className="space-y-6 relative max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">
            Advanced Reports Engine
          </h1>
          <p className="text-slate-400 text-sm mt-1">Generate deep situational insights customized to your criteria.</p>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          
          {/* Report Type Choice */}
          <div className="space-y-1.5 md:col-span-4 lg:col-span-1">
            <label className="block text-xs font-bold tracking-wider text-indigo-400 uppercase">1. Reporting Matrix</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full rounded-xl border border-indigo-500/50 bg-indigo-900/20 px-4 py-2.5 text-sm font-bold text-indigo-100 outline-none focus:border-indigo-400 focus:bg-indigo-900/40 shadow-inner appearance-none transition-all"
            >
              {REPORT_TYPES.map(type => (
                <option key={type.id} value={type.id} className="bg-slate-900">{type.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold tracking-wider text-slate-400 uppercase">2. From Date</label>
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-slate-500 shadow-inner [color-scheme:dark]"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-xs font-bold tracking-wider text-slate-400 uppercase">3. To Date</label>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-slate-500 shadow-inner [color-scheme:dark]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold tracking-wider text-slate-400 uppercase">4. Source Origin</label>
            <select
              value={selectedCanteen}
              onChange={(e) => setSelectedCanteen(e.target.value)}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-slate-500 shadow-inner appearance-none custom-select"
            >
              <option value="all">🌍 Global Platform Segments</option>
              {canteens.map(c => (
                <option key={c._id} value={c._id}>🏪 {c.name}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap gap-4 items-center justify-end">
          {error && (
            <div className="flex-1 min-w-0 mr-4 p-3 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium border border-red-500/20">
              {error}
            </div>
          )}
          
          <button
            onClick={handlePreview}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-8 py-3 text-sm font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-all hover:-translate-y-0.5"
          >
            {loading ? "Aggregating Data Matrix..." : "Execute & Preview Report"}
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={loading || !reportData}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export to PDF
          </button>
        </div>
      </Card>

      {/* Actual Report Document Container */}
      {reportData && (
        <div className="mt-8 bg-white text-slate-900 p-8 rounded-xl shadow-xl overflow-x-auto max-w-[900px] mx-auto min-h-[600px] relative">
          
          {/* reportRef Wrapper for html2pdf */}
          <div ref={reportRef} style={{ backgroundColor: '#ffffff', padding: '2.5rem', fontFamily: 'sans-serif', color: '#1e293b' }}>
            
            {/* Standardized Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e2e8f0', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: '900', color: '#4338ca', margin: 0, letterSpacing: '-0.025em' }}>SmartQueue Sys</h1>
                <p style={{ fontSize: '0.875rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.25rem' }}>
                  {REPORT_TYPES.find(t => t.id === reportData.reportType)?.label.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')}
                </p>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#64748b', lineHeight: '1.6' }}>
                <p><span style={{ fontWeight: '700', color: '#334155' }}>Generated:</span> {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
                <p><span style={{ fontWeight: '700', color: '#334155' }}>Date Bracket:</span> {startDate ? startDate : "All Time"} to {endDate ? endDate : "Present"}</p>
                <p><span style={{ fontWeight: '700', color: '#334155' }}>Facility:</span> {getCanteenName()}</p>
              </div>
            </div>

            {/* Dynamic Body Content */}
            <div style={{ minHeight: '400px' }}>
              {renderReportContent()}
            </div>

            {/* Standardized Footer */}
            <div style={{ marginTop: '4rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>** End of Generated Report **</p>
              <p style={{ fontSize: '0.625rem', color: '#cbd5e1', marginTop: '0.25rem' }}>Powered by SmartQueue Analytics Engine.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
