import React, { useState } from 'react';
import { processPayment } from '../api/paymentApi';

export default function CheckoutModal({ amount, onCancel, onSuccess }) {
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [name, setName] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) {
            setError("Please enter the cardholder's name.");
            return;
        }
        if (name.trim().length < 2) {
            setError("Cardholder name must be at least 2 characters.");
            return;
        }
        if (cardNumber.replace(/\s/g, '').length !== 16) {
            setError("Please enter a valid 16-digit card number.");
            return;
        }
        if (expiry.replace(/\D/g, '').length !== 4) {
            setError("Please enter a valid expiry date (MM/YY).");
            return;
        }
        if (cvv.length !== 3) {
            setError("Please enter a valid 3-digit CVV.");
            return;
        }

        setProcessing(true);
        try {
            const data = await processPayment({
                amount,
                cardNumber: cardNumber.replace(/\s/g, ''),
                name
            });
            onSuccess(data.transactionId);
        } catch (err) {
            setError(err.message);
            setProcessing(false);
        }
    };

    const formatCardNumber = (val) => {
        return val.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
    };

    const formatExpiry = (val) => {
        const cleaned = val.replace(/\D/g, '');
        if (cleaned.length >= 2) {
            return `${cleaned.substring(0, 2)} / ${cleaned.substring(2, 4)}`;
        }
        return cleaned;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden relative shadow-2xl shadow-indigo-500/10">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                <div className="p-6 md:p-8 space-y-6">
                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 mb-2">
                            <span className="text-xl">💳</span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-100 tracking-tight">Secure Checkout</h2>
                        <p className="text-slate-400 font-medium text-sm">Amount due: <strong className="text-indigo-400 text-lg">LKR {amount.toFixed(2)}</strong></p>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cardholder Name</label>
                            <input
                                required
                                type="text"
                                minLength={2}
                                maxLength={50}
                                value={name}
                                onChange={(e) => setName(e.target.value.toUpperCase())}
                                className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 font-medium placeholder:text-slate-600 uppercase"
                                placeholder="JANE DOE"
                                disabled={processing}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Card Number</label>
                            <div className="relative">
                                <input
                                    required
                                    type="text"
                                    maxLength="19"
                                    value={cardNumber}
                                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-lg tracking-widest placeholder:text-slate-600"
                                    placeholder="0000 0000 0000 0000"
                                    disabled={processing}
                                />
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Expiry</label>
                                <input
                                    required
                                    type="text"
                                    maxLength="7"
                                    value={expiry}
                                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                                    className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-center placeholder:text-slate-600 tracking-widest"
                                    placeholder="MM / YY"
                                    disabled={processing}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">CVV</label>
                                <input
                                    required
                                    type="password"
                                    maxLength="3"
                                    value={cvv}
                                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                                    className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-center placeholder:text-slate-600 tracking-widest"
                                    placeholder="•••"
                                    disabled={processing}
                                />
                            </div>
                        </div>

                        <div className="pt-2 flex gap-3">
                            <button
                                type="button"
                                onClick={onCancel}
                                disabled={processing}
                                className="flex-1 py-3 rounded-xl border border-slate-700/50 text-slate-400 font-bold hover:bg-slate-800 transition disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                            >
                                {processing ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </>
                                ) : "Pay Securely"}
                            </button>
                        </div>
                    </form>

                    <div className="text-center pt-4 border-t border-slate-800/50 mt-6">
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
                            🔒 256-bit Encrypted Mock Processing
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
