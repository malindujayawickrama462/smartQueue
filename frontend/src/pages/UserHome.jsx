import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Card } from '../components/Card';
import { getStudentOrders } from '../api/orderApi';
import html2pdf from 'html2pdf.js';

export default function UserHome() {
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const [activeOrder, setActiveOrder] = useState(null);
  const [arrivalStatus, setArrivalStatus] = useState({ state: 'none', message: '' });
  const tokenRef = useRef();

  const handleDownloadToken = () => {
    if(!tokenRef.current) return;
    const opt = {
        margin: 0,
        filename: `${activeOrder.orderToken || activeOrder.orderID}-Pass.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 3, useCORS: true },
        jsPDF: { unit: 'mm', format: [80, 120], orientation: 'portrait' }
    };
    html2pdf().set(opt).from(tokenRef.current).save();
  };

  useEffect(() => {
    if (user?.role === 'student' || user?.role === 'user') {
      const fetchOrder = async () => {
        try {
          const data = await getStudentOrders();
          const active = data.orders.find(o => ['Verified', 'Preparing', 'Ready'].includes(o.status));
          if (active) {
            setActiveOrder(active);
            updateArrivalStatus(active);
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchOrder();
      const interval = setInterval(fetchOrder, 15000); // Poll every 15s
      return () => clearInterval(interval);
    }
  }, [user]);

  const updateArrivalStatus = (order) => {
    if (!order.timeSlot || !order.timeSlot.startTime || !order.timeSlot.endTime) {
        setArrivalStatus({ state: 'none', message: 'Time Slot Pending' });
        return;
    }
    const now = new Date();
    const [startH, startM] = order.timeSlot.startTime.split(':').map(Number);
    const [endH, endM] = order.timeSlot.endTime.split(':').map(Number);

    const startTime = new Date();
    startTime.setHours(startH, startM, 0);

    const endTime = new Date();
    endTime.setHours(endH, endM, 0);

    if (order.status === 'Ready') {
      setArrivalStatus({ state: 'ready', message: 'Order Ready! Please collect from counter.' });
    } else if (now < startTime) {
      setArrivalStatus({ state: 'early', message: `Too Early - Please arrive at ${order.timeSlot.startTime}` });
    } else if (now >= startTime && now <= endTime) {
      setArrivalStatus({ state: 'on-time', message: 'Come Now - Pickup Window Open' });
    } else {
      setArrivalStatus({ state: 'late', message: 'Window Missed - You are in the Late Queue.' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center px-4 relative overflow-hidden py-10">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] right-[-5%] w-[35rem] h-[35rem] bg-emerald-500/10 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-sky-500/10 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-xl shadow-emerald-500/20 mb-2">
            <svg className="w-8 h-8 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 drop-shadow-sm">
            Welcome, {user?.name?.split(' ')[0] || 'User'}
          </h1>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest">{user?.role || 'user'}</span>
          </div>
        </div>

        {/* ACTIVE TOKEN SECTION */}
        {activeOrder && (
          <div className="relative group animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className={`absolute -inset-1 rounded-3xl blur-xl opacity-20 transition-all duration-500 ${arrivalStatus.state === 'ready' ? 'bg-emerald-500' :
              arrivalStatus.state === 'on-time' ? 'bg-blue-500' : 'bg-amber-500'
              }`}></div>
            <Card title={
              (activeOrder.orderToken?.startsWith('SQ-') || activeOrder.orderToken?.startsWith('POS-')) 
                ? activeOrder.orderToken 
                : activeOrder.orderID
            } subtitle={`Pickup: ${activeOrder.timeSlot?.startTime || 'TBD'} - ${activeOrder.timeSlot?.endTime || 'TBD'}`}>
              <div className="flex flex-col gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-5">
                    <div className={`w-3 h-3 rounded-full animate-pulse ${arrivalStatus.state === 'ready' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]' :
                    arrivalStatus.state === 'on-time' ? 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]' : 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.8)]'
                    }`} />
                    <div className="flex-1">
                    <p className={`text-lg font-black tracking-tight ${arrivalStatus.state === 'ready' ? 'text-emerald-400' :
                        arrivalStatus.state === 'on-time' ? 'text-blue-400' : 'text-amber-400'
                        }`}>{arrivalStatus.message}</p>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Arrival Control System</p>
                    </div>
                </div>

                {/* Progress Bar & Wait Time */}
                {['Pending', 'Verified', 'Preparing', 'Ready'].includes(activeOrder.status) && (
                    <div className="pt-4 border-t border-slate-800 mt-2">
                        <div className="flex items-end justify-between mb-3">
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Queue Status</p>
                                <p className="text-sm font-black text-slate-200">{activeOrder.status === 'Verified' ? 'Received' : activeOrder.status}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Est. Wait Time</p>
                                <p className="text-lg font-black text-emerald-400">{activeOrder.estimatedWaitTime > 0 ? `${activeOrder.estimatedWaitTime} mins` : 'Ready'}</p>
                            </div>
                        </div>

                        <div className="w-full bg-slate-900 rounded-full h-2 flex overflow-hidden">
                            <div className={`h-full transition-all duration-1000 ${
                                activeOrder.status === 'Pending' ? 'w-1/4 bg-slate-500' :
                                ['Verified', 'Received'].includes(activeOrder.status) ? 'w-2/4 bg-sky-500' : 
                                activeOrder.status === 'Preparing' ? 'w-3/4 bg-amber-500' : 
                                'w-full bg-emerald-500'
                            }`}></div>
                        </div>

                        {activeOrder.queuePosition > 0 && (
                            <p className="text-[10px] text-slate-400 text-center mt-3">You are number <span className="font-bold text-emerald-400">{activeOrder.queuePosition}</span> in the kitchen queue</p>
                        )}
                    </div>
                )}
              </div>

              {/* DOWNLOAD TICKET BUTTON */}
              {(activeOrder.orderToken?.startsWith('SQ-') || activeOrder.orderToken?.startsWith('POS-')) && (
                  <div className="mt-4 flex justify-end border-t border-slate-800/50 pt-4">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDownloadToken(); }} 
                        className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-slate-900 transition-all font-bold text-sm flex items-center gap-2"
                      >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                          Download Pass
                      </button>
                  </div>
              )}
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          <Card
            title=""
            subtitle=""
            footer={
              (user?.role !== 'student' && user?.role !== 'user') && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
                  <button
                    className="w-full sm:w-auto text-xs font-semibold text-slate-400 hover:text-sky-400 transition-colors flex items-center justify-center gap-1.5"
                    onClick={() => nav('/profile')}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    Profile
                  </button>
                  <button
                    className="w-full sm:w-auto text-xs font-semibold text-slate-400 hover:text-red-400 transition-colors flex items-center justify-center gap-1.5"
                    onClick={logout}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Sign Out
                  </button>
                </div>
              )
            }
          >
            {/* Main Action Buttons based on role */}
            <div className="space-y-4">
              {(user?.role === 'student' || user?.role === 'user') && !activeOrder && (
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 mb-6 text-center">
                    <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </div>
                    <p className="text-slate-400 font-medium text-sm mb-4">You have no active orders in the queue right now.</p>
                </div>
              )}
              
              {(user?.role === 'student' || user?.role === 'user') && (
                  <div className="grid grid-cols-2 gap-4">
                      <div onClick={() => nav('/canteens')} className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 flex flex-col items-center justify-center text-center hover:bg-emerald-500/20 transition-all cursor-pointer group">
                          <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">🍔</span>
                          <span className="text-sm font-black text-emerald-400 uppercase tracking-wider">Order Food</span>
                      </div>
                      <div onClick={() => nav('/invoices')} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center text-center hover:bg-slate-800 transition-all cursor-pointer group">
                          <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">📜</span>
                          <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">History</span>
                      </div>
                  </div>
              )}

              {user?.role === 'staff' && (
                <button
                  onClick={() => nav('/kitchen')}
                  className="w-full flex items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white hover:shadow-xl hover:shadow-sky-500/20 transition-all font-black uppercase text-sm tracking-tighter"
                >
                  <span>Kitchen Dashboard</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </button>
              )}

              {user?.role === 'admin' && (
                <button
                  onClick={() => nav('/admin')}
                  className="w-full flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-100 text-slate-950 hover:bg-white transition-all font-black uppercase text-sm tracking-tighter shadow-lg"
                >
                  <span>Admin Control Panel</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </button>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Hidden Ticket Template for PDF Engine */}
      {activeOrder && (
          <div className="absolute top-[-9999px] left-[-9999px]">
            <style dangerouslySetInnerHTML={{ __html: `
              .ticket-pdf, .ticket-pdf * {
                border-color: #e2e8f0 !important;
              }
            ` }} />
            <div ref={tokenRef} className="ticket-pdf font-sans" style={{ width: '80mm', height: '120mm', backgroundColor: '#f8fafc', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', borderTop: '12px solid #10b981', boxSizing: 'border-box' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 4px 0' }}>SmartQueue</h2>
                <p style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', margin: '0 0 32px 0', textTransform: 'uppercase', letterSpacing: '2px' }}>Digital Access Pass</p>
                
                <div style={{ width: '100%', backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', marginBottom: '32px', border: '2px dashed #cbd5e1', boxSizing: 'border-box' }}>
                    <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 12px 0' }}>Token Number</p>
                    <h1 style={{ fontSize: '36px', fontWeight: 900, color: '#059669', margin: 0, letterSpacing: '-1px' }}>
                        {(activeOrder.orderToken?.startsWith('SQ-') || activeOrder.orderToken?.startsWith('POS-')) ? activeOrder.orderToken : activeOrder.orderID}
                    </h1>
                </div>

                <div style={{ width: '100%', backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #f1f5f9', boxSizing: 'border-box', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px' }}>Status</span>
                        <span style={{ fontSize: '12px', fontWeight: 900, color: '#1e293b', textTransform: 'uppercase' }}>{activeOrder.status}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px' }}>Time Slot</span>
                        <span style={{ fontSize: '12px', fontWeight: 900, color: '#059669', letterSpacing: '1px' }}>{activeOrder.timeSlot?.startTime} - {activeOrder.timeSlot?.endTime}</span>
                    </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #e2e8f0', width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <p style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', margin: 0 }}>Show this at the counter</p>
                </div>
            </div>
          </div>
      )}
    </div>
  );
}

