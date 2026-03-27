import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvoice } from '../api/invoiceApi';
import { addReview } from '../api/foodApi';
import html2pdf from 'html2pdf.js';

export default function InvoiceView() {
    const { invoiceId } = useParams();
    const nav = useNavigate();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const invoiceRef = useRef();

    // Review Modal State
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewItem, setReviewItem] = useState(null);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const data = await getInvoice(invoiceId);
                setInvoice(data.invoice);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchInvoice();
    }, [invoiceId]);

    const handleDownloadPDF = () => {
        const element = invoiceRef.current;
        const opt = {
            margin: 10,
            filename: `${invoice.invoiceID}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    };

    const handlePrint = () => {
        window.print();
    };

    const handleOpenReview = (foodItemId, itemName, orderId) => {
        setReviewItem({ foodItemId, name: itemName, orderId });
        setReviewForm({ rating: 5, comment: '' });
        setReviewModalOpen(true);
    };

    const handleSubmitReview = async () => {
        if (!reviewItem?.foodItemId) return;
        setSubmittingReview(true);
        try {
            await addReview(reviewItem.foodItemId, {
                rating: reviewForm.rating,
                comment: reviewForm.comment,
                orderId: reviewItem.orderId
            });
            alert('Review submitted successfully!');
            setReviewModalOpen(false);
        } catch (err) {
            alert(err.message);
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading Invoice...</div>;

    if (error || !invoice) return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 space-y-4">
            <p className="text-red-400">{error || "Invoice not found"}</p>
            <button onClick={() => nav(-1)} className="text-emerald-400 hover:underline">Go Back</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 p-4 md:p-8 flex flex-col items-center font-sans print:bg-white print:p-0">
            {/* Action Bar (Hidden when printing) */}
            <div className="w-full max-w-3xl mb-6 flex justify-between items-center print:hidden">
                <button onClick={() => nav('/home')} className="text-slate-400 hover:text-white font-bold text-sm">← Back to Dashboard</button>
                <div className="flex gap-3">
                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 bg-slate-800 text-slate-200 rounded-lg hover:bg-slate-700 transition text-sm font-bold"
                    >
                        Print
                    </button>
                    <button
                        onClick={handleDownloadPDF}
                        className="px-4 py-2 bg-emerald-500 text-slate-950 rounded-lg hover:bg-emerald-400 transition text-sm font-black shadow-lg shadow-emerald-500/20"
                    >
                        Download PDF
                    </button>
                </div>
            </div>

            {/* Printable Area */}
            <div
                ref={invoiceRef}
                className="w-full max-w-3xl rounded-2xl p-8 md:p-12 shadow-2xl print:shadow-none print:w-full print:max-w-full"
                style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
            >
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 pb-8 mb-8" style={{ borderColor: '#f1f5f9' }}>
                    <div>
                        <h1 className="text-4xl font-black tracking-tight" style={{ color: '#10b981' }}>INVOICE</h1>
                        <p className="font-medium mt-1 uppercase tracking-widest text-sm" style={{ color: '#64748b' }}>SmartQueue Systems</p>
                    </div>
                    <div className="text-right space-y-1">
                        <p className="font-bold" style={{ color: '#1e293b' }}>{invoice.canteen?.name}</p>
                        <p className="text-sm" style={{ color: '#64748b' }}>{invoice.canteen?.location || "Campus Premises"}</p>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-8 mb-8 p-6 rounded-xl border" style={{ backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }}>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs uppercase font-bold tracking-wider" style={{ color: '#94a3b8' }}>Invoice to:</p>
                            <p className="font-bold" style={{ color: '#1e293b' }}>{invoice.student?.name}</p>
                            <p className="text-sm" style={{ color: '#64748b' }}>{invoice.student?.email}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase font-bold tracking-wider" style={{ color: '#94a3b8' }}>Order Reference:</p>
                            <p className="font-bold" style={{ color: '#10b981' }}>{invoice.order?.orderID}</p>
                            
                            {(invoice.order?.orderToken?.startsWith('SQ-') || invoice.order?.orderToken?.startsWith('POS-')) && (
                                <div className="mt-3">
                                    <p className="text-xs uppercase font-bold tracking-wider" style={{ color: '#94a3b8' }}>Smart Token:</p>
                                    <p className="font-black text-xl" style={{ color: '#f59e0b' }}>{invoice.order.orderToken}</p>
                                </div>
                            )}
                            
                            <p className="text-sm font-medium mt-3" style={{ color: '#475569' }}>Pickup: {invoice.order?.timeSlot?.startTime} - {invoice.order?.timeSlot?.endTime}</p>
                        </div>
                    </div>
                    <div className="space-y-4 text-right">
                        <div>
                            <p className="text-xs uppercase font-bold tracking-wider" style={{ color: '#94a3b8' }}>Invoice No:</p>
                            <p className="font-black text-lg" style={{ color: '#1e293b' }}>{invoice.invoiceID}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase font-bold tracking-wider" style={{ color: '#94a3b8' }}>Date:</p>
                            <p className="font-bold" style={{ color: '#1e293b' }}>{new Date(invoice.createdAt).toLocaleDateString()}</p>
                            <p className="text-sm" style={{ color: '#64748b' }}>{new Date(invoice.createdAt).toLocaleTimeString()}</p>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-left border-collapse mb-8">
                    <thead>
                        <tr className="border-b-2" style={{ borderColor: '#e2e8f0' }}>
                            <th className="py-3 text-xs uppercase font-bold tracking-wider" style={{ color: '#94a3b8' }}>Description</th>
                            <th className="py-3 text-xs uppercase font-bold tracking-wider text-center" style={{ color: '#94a3b8' }}>Qty</th>
                            <th className="py-3 text-xs uppercase font-bold tracking-wider text-right" style={{ color: '#94a3b8' }}>Price</th>
                            <th className="py-3 text-xs uppercase font-bold tracking-wider text-right" style={{ color: '#94a3b8' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.items.map((item, idx) => {
                            // Try to find the foodItem id from the populated order.items if possible
                            const matchedOrderItem = invoice.order?.items?.find(oi => oi.name === item.name);
                            const canReview = !!matchedOrderItem?.foodItem;

                            return (
                                <tr key={idx} className="border-b" style={{ borderColor: '#f1f5f9' }}>
                                    <td className="py-4 font-bold" style={{ color: '#1e293b' }}>
                                        {item.name}
                                        {canReview && (
                                            <button 
                                                onClick={() => handleOpenReview(matchedOrderItem.foodItem, item.name, invoice.order._id)}
                                                className="ml-3 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold px-2 py-0.5 rounded-full print:hidden transition-colors"
                                            >
                                                ⭐ Leave Review
                                            </button>
                                        )}
                                    </td>
                                    <td className="py-4 text-center font-medium" style={{ color: '#475569' }}>{item.quantity}</td>
                                    <td className="py-4 text-right" style={{ color: '#475569' }}>LKR {item.price.toFixed(2)}</td>
                                    <td className="py-4 text-right font-bold" style={{ color: '#1e293b' }}>LKR {item.amount.toFixed(2)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end">
                    <div className="w-full max-w-sm space-y-3">
                        <div className="flex justify-between items-center" style={{ color: '#64748b' }}>
                            <span>Subtotal</span>
                            <span className="font-medium">LKR {invoice.subTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center" style={{ color: '#64748b' }}>
                            <span>Tax (5%)</span>
                            <span className="font-medium">LKR {invoice.tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b" style={{ color: '#64748b', borderColor: '#e2e8f0' }}>
                            <span>Platform Fee</span>
                            <span className="font-medium">LKR {invoice.serviceCharge.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center font-black text-2xl pt-2" style={{ color: '#10b981' }}>
                            <span>Total</span>
                            <span>LKR {invoice.totalAmount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer Message */}
                <div className="mt-16 text-center text-sm" style={{ color: '#94a3b8' }}>
                    <p>Thank you for using SmartQueue!</p>
                    <p>Present the Order Reference token at the counter during your pickup window.</p>
                </div>
            </div>

            {/* Review Modal */}
            {reviewModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm print:hidden">
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
                        <h2 className="text-xl font-bold text-slate-100 mb-1">Rate this item</h2>
                        <p className="text-sm text-slate-400 mb-6">How was the <span className="text-emerald-400 font-bold">{reviewItem?.name}</span>?</p>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Rating (1-5)</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            key={star}
                                            onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                            className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-transform ${reviewForm.rating >= star ? 'bg-amber-500/20 text-yellow-500 scale-110' : 'bg-slate-800 text-slate-600 hover:bg-slate-700'}`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Comment (Optional)</label>
                                <textarea
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 text-sm focus:border-emerald-500 outline-none resize-none"
                                    rows="3"
                                    placeholder="Tell us what you liked or how it could be better..."
                                    maxLength="500"
                                    value={reviewForm.comment}
                                    onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                ></textarea>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button 
                                onClick={() => setReviewModalOpen(false)}
                                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white transition font-bold text-sm"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSubmitReview}
                                disabled={submittingReview}
                                className="px-6 py-2 bg-emerald-500 text-slate-950 rounded-xl hover:bg-emerald-400 transition font-black text-sm disabled:opacity-50"
                            >
                                {submittingReview ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Styles for Print */}
            <style jsx="true">{`
                @media print {
                    @page { size: auto; margin: 0mm; }
                    body { background-color: white; }
                }
            `}</style>
        </div>
    );
}
