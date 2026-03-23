import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { submitComplaint, getMyComplaints } from '../api/complaintApi';

export default function Complaints() {
    const [complaints, setComplaints] = useState([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const fetchComplaints = async () => {
        try { const data = await getMyComplaints(); setComplaints(data.complaints || []); } catch {}
    };

    useEffect(() => { fetchComplaints(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await submitComplaint({ title, description });
            setTitle(''); setDescription(''); fetchComplaints();
        } catch (err) { alert(err.message); }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-10">
            <div className="max-w-4xl mx-auto space-y-8">
                <div><h1 className="text-3xl font-bold tracking-tight text-white mb-2">My Complaints</h1></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1">
                        <Card title="File a Complaint">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <input required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none" placeholder="Title" />
                                <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none resize-none" placeholder="Description..." />
                                <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-3 rounded-xl font-bold transition">Submit</button>
                            </form>
                        </Card>
                    </div>
                    <div className="md:col-span-2 space-y-4">
                        <h2 className="text-xl font-semibold text-slate-200">Past Complaints</h2>
                        {complaints.map(comp => (
                            <div key={comp._id} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg text-slate-200">{comp.title}</h3>
                                    <span className={`px-3 py-1 text-xs font-black uppercase rounded-full border ${comp.status === 'Solved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>{comp.status}</span>
                                </div>
                                <p className="text-sm text-slate-400 leading-relaxed mb-4">{comp.description}</p>
                                {comp.adminReply && (
                                    <div className="mb-4 p-4 rounded-xl bg-sky-500/10 border border-sky-500/20">
                                        <p className="text-xs font-bold text-sky-400 uppercase tracking-widest mb-1">Admin Reply</p>
                                        <p className="text-sm text-sky-100">{comp.adminReply}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
