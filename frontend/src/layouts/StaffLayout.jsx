import React from 'react';
import { Outlet } from 'react-router-dom';
import StaffSidebar from '../components/StaffSidebar';

export default function StaffLayout() {
    return (
        <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
            <StaffSidebar />
            <div className="flex-1 overflow-y-auto">
                <Outlet />
            </div>
        </div>
    );
}
