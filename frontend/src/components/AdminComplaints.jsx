import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { getAllComplaints, updateComplaintStatus } from '../api/complaintApi';

export default function AdminComplaints() {
    const [complaints, setComplaints] = useState([]);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');

    const fetchComplaints = async () => {
        try { const data = await getAllComplaints(); setComplaints(data.complaints || []); } catch (err) {}
    };

    useEffect(() => { fetchComplaints(); }, []);

    const handleUpdate = async (id, newStatus, reply) => {
        try {
            await updateComplaintStatus(id, newStatus, reply);
            setComplaints(prev => prev.map(c => c._id === id ? { ...c, status: newStatus, adminReply: reply !== undefined ? reply : c.adminReply } : c));
            setReplyingTo(null); setReplyText('');
        } catch (err) { alert(err.message); }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-black text-slate-100 uppercase tracking-tight">System Complaints</h1>
            <Card>
                <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-xs">
                        <tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Issue</th><th className="px-4 py-3">Status & Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {complaints.map(comp => (
                            <tr key={comp._id} className="hover:bg-slate-900/50">
                                <td className="px-4 py-4"><div className="font-bold text-slate-200">{comp.user?.name}</div></td>
                                <td className="px-4 py-4">
                                    <div className="font-bold text-slate-200">{comp.title}</div>
                                    <div className="text-xs text-slate-400">{comp.description}</div>
                                    {comp.adminReply && !replyingTo && (
                                        <div className="mt-3 p-3 bg-sky-500/10 border border-sky-500/20 rounded-lg">
                                            <p className="text-xs font-bold text-sky-400 uppercase tracking-widest mb-1">Your Reply</p>
                                            <p className="text-xs text-sky-200">{comp.adminReply}</p>
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-4">
                                    <select value={comp.status} onChange={(e) => handleUpdate(comp._id, e.target.value, comp.adminReply)} className="mb-2 text-xs font-black uppercase rounded-lg px-2 py-1.5 bg-slate-800 text-slate-300 border border-slate-700 outline-none">
                                        <option value="Pending">Pending</option><option value="Processing">Processing</option><option value="Solved">Solved</option>
                                    </select>
                                    {replyingTo === comp._id ? (
                                        <div className="space-y-2">
                                            <textarea rows="2" className="w-full text-xs bg-slate-900 border border-slate-700 rounded p-2 text-slate-200 resize-none" value={replyText} onChange={(e) => setReplyText(e.target.value)} autoFocus />
                                            <div className="flex gap-2">
                                                <button onClick={() => handleUpdate(comp._id, comp.status, replyText)} className="px-2 py-1 bg-sky-500 text-slate-950 text-xs font-bold rounded">Save</button>
                                                <button onClick={() => { setReplyingTo(null); setReplyText(''); }} className="px-2 py-1 bg-slate-800 text-slate-300 text-xs font-bold rounded">Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button onClick={() => { setReplyingTo(comp._id); setReplyText(comp.adminReply || ''); }} className="text-xs font-bold text-sky-400 hover:text-sky-300 block">{comp.adminReply ? "Edit Reply" : "+ Add Reply"}</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
