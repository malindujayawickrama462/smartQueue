import React from 'react';

export default function AdminSidebar({ activeSection, setActiveSection }) {
  const sections = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'admins', label: 'Admin Management', icon: '👨‍💼' },
    { id: 'students', label: 'Student Management', icon: '👨‍🎓' },
    { id: 'staff', label: 'Staff Management', icon: '👨‍💻' },
    { id: 'canteens', label: 'Canteen Management', icon: '🍽️' },
  ];

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 p-6 space-y-8">
      <div>
        <h2 className="text-lg font-bold text-slate-100 mb-6">Admin Panel</h2>
      </div>

      <nav className="space-y-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`w-full text-left px-4 py-3 rounded-lg transition flex items-center gap-3 ${
              activeSection === section.id
                ? 'bg-sky-500 text-slate-950 font-semibold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="text-lg">{section.icon}</span>
            <span>{section.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
