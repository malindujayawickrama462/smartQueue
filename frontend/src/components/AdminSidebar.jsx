import React from 'react';

export default function AdminSidebar({ activeSection, setActiveSection }) {
  const sections = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'analytics', label: 'Platform Analytics', icon: '📈' },
    { id: 'reports', label: 'Report Generation', icon: '📑' },
    { id: 'admins', label: 'Admin Management', icon: '👨‍💼' },
    { id: 'students', label: 'Student Management', icon: '👨‍🎓' },
    { id: 'staff', label: 'Staff Management', icon: '👨‍💻' },
    { id: 'canteens', label: 'Canteen Management', icon: '🍽️' },
    { id: 'complaints', label: 'Complaints', icon: '🚨' },
  ];

  return (
    <div className="w-72 bg-slate-950/80 border-r border-slate-800/60 p-6 space-y-8 backdrop-blur-md flex flex-col min-h-screen relative shadow-[4px_0_24px_-4px_rgba(0,0,0,0.5)] z-20">
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-sky-500/5 to-transparent pointer-events-none" />
      <div className="relative z-10 w-full flex justify-center pb-2">
        <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 tracking-tight">
          SmartQueue
        </h2>
      </div>

      <nav className="space-y-2.5 flex-1 relative z-10">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`w-full text-left px-4 py-3.5 rounded-xl transition-all duration-300 flex items-center gap-4 relative overflow-hidden ${activeSection === section.id
              ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-bold shadow-lg shadow-sky-500/25 scale-[1.02]'
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 hover:scale-[1.01] border border-transparent hover:border-slate-700/50'
              }`}
          >
            {activeSection === section.id && (
              <span className="absolute left-0 top-0 bottom-0 w-1 bg-white/40 rounded-r-md"></span>
            )}
            <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${activeSection === section.id ? 'bg-white/20 shadow-inner' : 'bg-slate-800/50'} transition-colors duration-300`}>
              <span className="text-lg drop-shadow-sm">{section.icon}</span>
            </div>
            <span className="tracking-wide text-sm">{section.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto relative z-10 pt-6 border-t border-slate-800/60 flex items-center gap-3">
        <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-md border border-slate-700/50">
          AD
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-200 truncate">Administrator Portal</p>
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">System Management</p>
        </div>
      </div>
    </div>
  );
}
