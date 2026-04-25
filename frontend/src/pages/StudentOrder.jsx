import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import CheckoutModal from '../components/CheckoutModal';
import { placeOrder, getAvailableSlots } from '../api/orderApi';
import { generateInvoice } from '../api/invoiceApi';
import { getAllFoodItemsWithImages } from '../api/foodApi';
import { getPeakTimeData } from '../api/peakTimeApi';
import { addToCart as saveItemToCart } from '../api/cartApi';
import { getWalletInfo } from '../api/walletApi';
import { useAuth } from '../auth/AuthContext';
import PeakTimeIndicator from '../components/PeakTimeIndicator';

export default function StudentOrder() {
    const { canteenId } = useParams();
    const nav = useNavigate();
    const { user } = useAuth();
    const [menu, setMenu] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [orderSuccess, setOrderSuccess] = useState(null);
    const [invoiceId, setInvoiceId] = useState(null);
    const [showCheckout, setShowCheckout] = useState(false);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [peakData, setPeakData] = useState(null);
    const [peakLoading, setPeakLoading] = useState(true);
    const [cartSaving, setCartSaving] = useState(false);
    const [cartSaveToast, setCartSaveToast] = useState(null);
    const [walletBalance, setWalletBalance] = useState(null);

    useEffect(() => {
        const fetchMenuAndSlots = async () => {
            try {
                const data = await getAllFoodItemsWithImages(canteenId);
                setMenu(data.items);

                let pData = null;
                try {
                    setPeakLoading(true);
                    pData = await getPeakTimeData(canteenId);
                    setPeakData(pData);
                } catch (e) {
                    console.error("Failed to load peak data", e);
                } finally {
                    setPeakLoading(false);
                }

                try {
                    const slotData = await getAvailableSlots(canteenId);
                    const slots = slotData.slots || [];
                    setAvailableSlots(slots);
                    
                    if (slots.length > 0) {
                        let initialSlot = slots[0];
                        if (pData && pData.currentStatus === 'Medium' && pData.suggestedHour) {
                            const validSlot = slots.find(s => s.startTime >= pData.suggestedHour);
                            if (validSlot) initialSlot = validSlot;
                        }
                        setSelectedSlot(initialSlot);
                    }
                } catch (e) {
                    console.error("Failed to load time slots", e);
                }

            } catch (err) {
                setError(err.message);
            }
        };
        fetchMenuAndSlots();
    }, [canteenId]);

    // Setup polling for order confirmation
    useEffect(() => {
        let interval;
        if (orderSuccess && orderSuccess.status === 'Pending') {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`/api/order/${orderSuccess._id}`, {
                        headers: { "Authorization": `Bearer ${localStorage.getItem("smartqueue_token")}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.order.status !== 'Pending') {
                            setOrderSuccess(data.order);
                            if (data.order.status === 'Verified' && data.order.paymentMethod === 'Card') {
                                try {
                                    const invData = await generateInvoice(data.order._id);
                                    setInvoiceId(invData.invoice._id);
                                } catch (invErr) {
                                    console.error("Invoice generation failed on poll:", invErr);
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.error("Polling error", e);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [orderSuccess]);

    const addToCart = (item) => {
        if (!item.availability) return;
        setCart(prev => {
            const existing = prev.find(i => i._id === item._id);
            if (existing) {
                return prev.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const removeFromCart = (itemId) => {
        setCart(prev => prev.filter(i => i._id !== itemId));
    };

    const updateQuantity = (itemId, delta) => {
        setCart(prev => prev.map(i =>
            i._id === itemId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
        ).filter(i => i.quantity > 0));
    };

    const saveCartToServer = async () => {
        if (cart.length === 0) return;
        setCartSaving(true);
        try {
            for (const item of cart) {
                await saveItemToCart({ canteenId: canteenId, foodItemId: item._id, quantity: item.quantity });
            }
            setCartSaveToast({ type: 'success', msg: 'Cart saved! View it anytime from My Cart.' });
        } catch (err) {
            setCartSaveToast({ type: 'error', msg: err.message || 'Failed to save cart.' });
        } finally {
            setCartSaving(false);
            setTimeout(() => setCartSaveToast(null), 4000);
        }
    };

    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const processOrderPlacement = async (paymentMethod, transactionId = null) => {
        setLoading(true);
        setError('');
        try {
            const orderData = {
                canteenID: canteenId,
                items: cart.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
                totalPrice,
                paymentMethod,
                timeSlot: selectedSlot,
                transactionId
            };
            const data = await placeOrder(orderData);

            setOrderSuccess(data.order);
            setCart([]);
            setShowCheckout(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckoutDecision = (method) => {
        if (cart.length === 0) {
            setError("Your cart is empty.");
            return;
        }
        if (!selectedSlot) {
            setError("Please select a pickup time slot first.");
            return;
        }
        if (totalPrice <= 0) {
            setError("Total amount must be greater than zero.");
            return;
        }
        if (method === 'Card') {
            setShowCheckout(true);
        } else if (method === 'Wallet') {
            processOrderPlacement('Wallet');
        } else {
            processOrderPlacement('Cash');
        }
    };

    if (orderSuccess) {
        if (orderSuccess.status === 'Pending') {
            return (
                <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-10 flex items-center justify-center animate-in fade-in duration-500">
                    <div className="max-w-md w-full space-y-6">
                        <Card title="Order Pending... 📨" subtitle="Awaiting Staff Verification">
                            <div className="text-center py-10 space-y-6">
                                <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/30 animate-pulse">
                                    <svg className="w-10 h-10 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <p className="text-sm font-bold text-slate-400 leading-relaxed">
                                    Please wait. The kitchen staff is reviewing your menu items to ensure availability.
                                </p>
                            </div>
                        </Card>
                    </div>
                </div>
            );
        }

        if (orderSuccess.status === 'Rejected') {
            return (
                <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-10 flex items-center justify-center animate-in zoom-in duration-300">
                    <div className="max-w-md w-full space-y-6">
                        <Card title="Order Rejected ❌" subtitle="Kitchen could not fulfill your request.">
                            <div className="text-center py-8 space-y-6">
                                <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/30">
                                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </div>
                                <p className="text-sm font-medium text-slate-300">
                                    Unfortunately, the kitchen is busy or out of stock. If you paid by card, your purchase will be automatically refunded.
                                </p>
                                <button
                                    onClick={() => setOrderSuccess(null)}
                                    className="w-full rounded-xl bg-slate-800 px-4 py-3 text-sm font-bold text-slate-200 hover:bg-slate-700 transition"
                                >
                                    Return to Menu
                                </button>
                            </div>
                        </Card>
                    </div>
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-10 flex items-center justify-center animate-in zoom-in duration-500">
                <div className="max-w-md w-full space-y-6">
                    <Card title="Order Verified! ✅" subtitle="Your token has been assigned.">
                        <div className="text-center py-8 space-y-6">
                            <div className="space-y-2">
                                <p className="text-sm text-slate-400 uppercase tracking-widest font-bold">Your Token</p>
                                <p className="text-6xl font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                    {orderSuccess.orderToken || orderSuccess.orderID}
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/50 space-y-1">
                                <p className="text-xs text-slate-500 font-bold uppercase">Scheduled Pickup Window</p>
                                <p className="text-2xl font-bold text-slate-100">
                                    {orderSuccess.timeSlot?.startTime || "TBD"} – {orderSuccess.timeSlot?.endTime || "TBD"}
                                </p>
                            </div>

                            <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-left">
                                <span className="text-2xl">🕒</span>
                                <div>
                                    <p className="text-sm font-bold text-blue-400">Arrival Control</p>
                                    <p className="text-xs text-slate-400">Please arrive at the counter strictly within your time slot to avoid congestion.</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 pt-4">
                                {invoiceId && (
                                    <button
                                        onClick={() => nav(`/invoice/${invoiceId}`)}
                                        className="w-full inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-bold text-slate-950 hover:shadow-lg transition cursor-pointer"
                                    >
                                        View & Download Invoice
                                    </button>
                                )}
                                <button
                                    onClick={() => nav('/home')}
                                    className="w-full inline-flex items-center justify-center rounded-xl bg-slate-800 px-4 py-3 text-sm font-bold text-slate-200 hover:bg-slate-700 transition"
                                >
                                    Back to Dashboard
                                </button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-10">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-extrabold tracking-tight">Canteen Menu</h1>
                        <button onClick={() => nav('/canteens')} className="text-sm text-slate-400 hover:text-white">Change Canteen</button>
                    </div>

                    <PeakTimeIndicator peakData={peakData} loading={peakLoading} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {menu.map(item => (
                            <div key={item._id} className={`overflow-hidden rounded-2xl bg-slate-900/40 border transition group ${item.availability ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/50 opacity-50'}`}>
                                {item.imageUrl && (
                                    <div className="h-40 bg-slate-800 overflow-hidden">
                                        <img
                                            src={item.imageUrl}
                                            alt={item.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )}
                                <div className="p-4">
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex-1">
                                            <p className="font-bold text-slate-100 group-hover:text-emerald-400 transition-colors uppercase tracking-tight text-sm">{item.name}</p>
                                            <p className="text-lg font-black text-slate-400 mt-1">Rs. {item.price}/=</p>
                                            {item.description && <p className="text-xs text-slate-400 mt-2 line-clamp-2">{item.description}</p>}
                                            {!item.availability && <p className="text-xs text-red-400 font-bold uppercase mt-2">Out of Stock</p>}
                                        </div>
                                        <button
                                            onClick={() => addToCart(item)}
                                            disabled={!item.availability}
                                            className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 mt-1"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {menu.length === 0 && (
                            <div className="col-span-full py-12 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl">
                                <p>No menu items available for this canteen yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <Card title="Your Cart" subtitle="Items ready for order.">
                        <div className="space-y-4">
                            {cart.length > 0 ? (
                                <>
                                    <div className="space-y-3 max-h-64 overflow-y-auto">
                                        {cart.map(item => (
                                            <div key={item._id} className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-200">{item.name}</p>
                                                    <p className="text-xs text-slate-400">Rs. {item.price} × {item.quantity}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => updateQuantity(item._id, -1)} className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm flex items-center justify-center transition">−</button>
                                                    <span className="text-sm font-bold text-slate-200 w-5 text-center">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item._id, 1)} className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm flex items-center justify-center transition">+</button>
                                                    <button onClick={() => removeFromCart(item._id)} className="text-red-400 hover:text-red-300 transition text-lg ml-1">✕</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="border-t border-slate-700 pt-3 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Subtotal:</span>
                                            <span className="font-bold text-slate-100">Rs. {totalPrice.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-600">
                                            <span>Total:</span>
                                            <span className="text-emerald-400">Rs. {totalPrice.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2 pt-2">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-400 uppercase">Select Pickup Slot</label>
                                            {availableSlots.length > 0 ? (
                                                <select
                                                    value={selectedSlot?._id || ''}
                                                    onChange={(e) => setSelectedSlot(availableSlots.find(s => s._id === e.target.value))}
                                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 text-sm"
                                                >
                                                    {availableSlots.map(slot => (
                                                        <option key={slot._id} value={slot._id}>
                                                            {slot.startTime} – {slot.endTime}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <p className="text-xs text-red-400">No pickup slots available</p>
                                            )}
                                        </div>
                                    </div>

                                    {error && <p className="text-sm text-red-400 bg-red-400/10 p-2 rounded-lg">{error}</p>}

                                    {/* Save to Cart (server-side persistence) */}
                                    {cartSaveToast && (
                                        <div className={`text-xs p-2 rounded-lg ${cartSaveToast.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                            {cartSaveToast.type === 'success' ? '✅' : '⚠️'} {cartSaveToast.msg}
                                        </div>
                                    )}
                                    <button
                                        onClick={saveCartToServer}
                                        disabled={cartSaving || cart.length === 0}
                                        className="w-full py-2 px-3 rounded-lg bg-slate-700/60 text-slate-300 border border-slate-600 hover:bg-slate-700 hover:text-white transition font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {cartSaving ? <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : '🛒'}
                                        {cartSaving ? 'Saving…' : 'Save Cart for Later'}
                                    </button>

                                    <div className="space-y-1 pt-1">
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pay with</p>
                                        <div className="grid grid-cols-3 gap-1.5">
                                            <button
                                                onClick={async () => { try { const w = await getWalletInfo(); setWalletBalance(w.walletBalance); } catch(e){} handleCheckoutDecision('Wallet'); }}
                                                disabled={loading}
                                                className="py-2 px-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 transition font-bold text-xs disabled:opacity-50"
                                            >
                                                👛 Wallet
                                            </button>
                                            <button
                                                onClick={() => handleCheckoutDecision('Cash')}
                                                disabled={loading}
                                                className="py-2 px-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500 hover:text-slate-950 transition font-bold text-xs disabled:opacity-50"
                                            >
                                                💵 Cash
                                            </button>
                                            <button
                                                onClick={() => handleCheckoutDecision('Card')}
                                                disabled={loading}
                                                className="py-2 px-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500 hover:text-slate-950 transition font-bold text-xs disabled:opacity-50"
                                            >
                                                💳 Card
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="py-8 text-center text-slate-500">
                                    <p>Your cart is empty.</p>
                                    <p className="text-xs mt-2">Add items from the menu to begin.</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card title="NOTE" subtitle="Information">
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Orders are automatically assigned the next available "05-minute pickup window" to ensure zero-waiting time at the counter. Invoices are generated automatically for online card payments.
                        </p>
                    </Card>
                </div>
            </div>

            {showCheckout && <CheckoutModal amount={totalPrice} onCancel={() => setShowCheckout(false)} onSuccess={(transactionId) => processOrderPlacement('Card', transactionId)} />}
        </div>
    );
}
