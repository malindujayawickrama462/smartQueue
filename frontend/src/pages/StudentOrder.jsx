import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import CheckoutModal from '../components/CheckoutModal';
import { placeOrder, getAvailableSlots } from '../api/orderApi';
import { generateInvoice } from '../api/invoiceApi';
import { getAllFoodItems } from '../api/foodApi';
import { getWalletInfo } from '../api/walletApi';
import { useAuth } from '../auth/AuthContext';

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
    const [filterTag, setFilterTag] = useState('All');
    
    // Wallet & Points State
    const [walletInfo, setWalletInfo] = useState(null);
    const [redeemingPoints, setRedeemingPoints] = useState(0);

    const AVAILABLE_TAGS = ['All', 'Vegetarian', 'Vegan', 'Halal', 'Spicy', 'Contains Nuts'];

    useEffect(() => {
        const fetchMenuAndSlots = async () => {
            try {
                // Fetch Wallet Info in parallel
                getWalletInfo().then(setWalletInfo).catch(() => {});
                
                const data = await getAllFoodItems(canteenId);
                setMenu(data.items);
                
                try {
                    const slotData = await getAvailableSlots(canteenId);
                    setAvailableSlots(slotData.slots || []);
                    if (slotData.slots && slotData.slots.length > 0) {
                        setSelectedSlot(slotData.slots[0]);
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
                            // Invoice is now generated immediately upon upfront payment,
                            // no need to generate it here anymore.
                        }
                    }
                } catch (e) {
                    console.error("Polling error", e);
                }
            }, 3000); // Poll every 3 seconds
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

    const originalTotalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const pointsDiscount = Math.min(redeemingPoints, originalTotalPrice, walletInfo?.loyaltyPoints || 0);
    const finalPrice = originalTotalPrice - pointsDiscount;

    const processOrderPlacement = async (paymentMethod, transactionId = null) => {
        setLoading(true);
        setError('');
        try {
            const orderData = {
                canteenID: canteenId,
                items: cart.map(i => ({ foodItem: i._id, name: i.name, quantity: i.quantity, price: i.price })),
                totalPrice: originalTotalPrice, 
                redeemPoints: pointsDiscount,
                paymentMethod,
                timeSlot: selectedSlot,
                transactionId
            };
            const data = await placeOrder(orderData);

            // Instantly generate the invoice for upfront payments (Card/Wallet)
            // so the receipt is permanently saved even if the user leaves before staff verification.
            if (['Card', 'Wallet'].includes(paymentMethod)) {
                try {
                    const invData = await generateInvoice(data.order._id);
                    setInvoiceId(invData.invoice._id);
                } catch (invErr) {
                    console.error("Instant invoice generation failed:", invErr);
                }
            }

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
        if (finalPrice <= 0 && method !== 'Wallet') {
            // Unlikely since 1 point = 1 LKR, but handled
            if(finalPrice === 0) return processOrderPlacement('Cash'); 
        }
        
        if (method === 'Wallet') {
            if (!walletInfo || walletInfo.walletBalance < finalPrice) {
                setError("Insufficient Wallet Balance!");
                return;
            }
            processOrderPlacement('Wallet');
        } else if (method === 'Card') {
            setShowCheckout(true);
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

                    <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {AVAILABLE_TAGS.map(tag => (
                            <button
                                key={tag}
                                onClick={() => setFilterTag(tag)}
                                className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold transition-all border ${filterTag === tag ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600'}`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {menu.filter(item => filterTag === 'All' || (item.dietaryTags && item.dietaryTags.includes(filterTag))).map(item => (
                            <div key={item._id} className={`p-4 rounded-2xl bg-slate-900/40 border transition group ${item.availability ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/50 opacity-50'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-slate-100 group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{item.name}</p>
                                        
                                        {/* Ratings and Tags */}
                                        <div className="flex flex-col gap-1 my-1">
                                            {item.totalRatings > 0 && (
                                                <div className="flex items-center gap-1">
                                                    <svg className="w-3 h-3 text-yellow-500 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                                    <span className="text-[10px] font-bold text-slate-300">{item.averageRating} <span className="text-slate-500 font-medium">({item.totalRatings})</span></span>
                                                </div>
                                            )}
                                            {item.dietaryTags && item.dietaryTags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-0.5">
                                                    {item.dietaryTags.map(tag => (
                                                        <span key={tag} className="text-[8px] uppercase tracking-widest font-bold bg-slate-800/80 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700/50">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <p className="text-lg font-black text-slate-400">Rs. {item.price}/=</p>
                                        {!item.availability && <p className="text-xs text-red-400 font-bold uppercase mt-1">Out of Stock</p>}
                                    </div>
                                    <button
                                        onClick={() => addToCart(item)}
                                        disabled={!item.availability}
                                        className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        +
                                    </button>
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
                        {cart.length === 0 ? (
                            <div className="text-center py-10 text-slate-500">
                                <p>Your cart is empty.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-3 max-h-60 overflow-auto pr-2">
                                    {cart.map(item => (
                                        <div key={item._id} className="flex justify-between items-center text-sm bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                                            <div>
                                                <p className="font-bold text-slate-200">{item.name}</p>
                                                <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                                            </div>
                                            <div className="text-right flex items-center gap-3">
                                                <p className="font-bold text-slate-300">Rs. {item.price * item.quantity}</p>
                                                <button onClick={() => removeFromCart(item._id)} className="text-red-500 hover:text-red-400">×</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-slate-800 pt-4 flex flex-col gap-3">
                                    {walletInfo && walletInfo.loyaltyPoints > 0 && cart.length > 0 && (
                                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl mb-2">
                                            <div className="flex justify-between items-center mb-2">
                                                <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">⭐ Use Loyalty Points</p>
                                                <p className="text-xs font-bold text-slate-300">Avail: {walletInfo.loyaltyPoints}</p>
                                            </div>
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max={Math.min(walletInfo.loyaltyPoints, originalTotalPrice)} 
                                                value={redeemingPoints} 
                                                onChange={e => setRedeemingPoints(Number(e.target.value))}
                                                className="w-full accent-emerald-500"
                                            />
                                            <div className="flex justify-between mt-1">
                                                <span className="text-[10px] text-slate-500">0</span>
                                                <span className="text-xs font-black text-emerald-400">-{redeemingPoints} LKR</span>
                                                <span className="text-[10px] text-slate-500">Max</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-end mb-4">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-bold">Total Amount</p>
                                            {redeemingPoints > 0 ? (
                                                <div className="flex items-end gap-2">
                                                    <p className="text-lg text-slate-500 line-through">Rs. {originalTotalPrice}/=</p>
                                                    <p className="text-2xl font-black text-emerald-400 tracking-tighter">Rs. {finalPrice}/=</p>
                                                </div>
                                            ) : (
                                                <p className="text-2xl font-black text-slate-100 tracking-tighter">Rs. {finalPrice}/=</p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-1 mb-4">
                                        <label className="text-xs text-slate-500 uppercase font-bold tracking-widest">Select Pickup Time ✨</label>
                                        {availableSlots.length > 0 ? (
                                            <select 
                                                className="bg-slate-900 border border-slate-700 text-sm font-bold text-emerald-400 rounded-lg p-3 outline-none focus:border-emerald-500 shadow-inner"
                                                value={selectedSlot ? JSON.stringify(selectedSlot) : ''}
                                                onChange={(e) => {
                                                    setError('');
                                                    setSelectedSlot(JSON.parse(e.target.value));
                                                }}
                                            >
                                                {availableSlots.map((slot, idx) => (
                                                    <option key={idx} value={JSON.stringify(slot)}>
                                                        {slot.startTime} - {slot.endTime}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-bold text-center">
                                                Canteen is currently at Full Capacity for orders tonight.
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-2">
                                        <button
                                            onClick={() => handleCheckoutDecision('Wallet')}
                                            disabled={loading || availableSlots.length === 0}
                                            className="rounded-xl bg-slate-100 px-2 py-3 text-sm font-bold text-slate-900 border border-slate-300 hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                            {loading ? 'Wait...' : 'Pay with Wallet'}
                                            {walletInfo && <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded-md ml-1 text-slate-500 tracking-wider">LKR {walletInfo.walletBalance.toFixed(2)}</span>}
                                        </button>
                                        
                                        <div className="grid grid-cols-2 gap-2 mt-1">
                                            <button
                                                onClick={() => handleCheckoutDecision('Cash')}
                                                disabled={loading || availableSlots.length === 0}
                                                className="rounded-xl border border-slate-700 bg-slate-900 px-2 py-3 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-all disabled:opacity-50"
                                            >
                                                {loading ? 'Wait...' : 'Pay at Counter'}
                                            </button>
                                            <button
                                                onClick={() => handleCheckoutDecision('Card')}
                                                disabled={loading || availableSlots.length === 0}
                                                className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-2 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                                {loading ? 'Wait...' : 'Pay with Card'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {error && <p className="text-xs text-red-400 mt-4 bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</p>}
                    </Card>

                    <div className="p-5 rounded-2xl bg-sky-500/5 border border-sky-500/10">
                        <p className="text-xs font-bold text-sky-400 uppercase mb-2">💡 Note</p>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Orders are automatically assigned the next available **5-minute pickup window** to ensure zero-waiting time at the counter. Points are earned on every purchase (1 point per 100 LKR).
                        </p>
                    </div>
                </div>
            </div>

            {showCheckout && (
                <CheckoutModal
                    amount={finalPrice}
                    onCancel={() => setShowCheckout(false)}
                    onSuccess={(txnId) => processOrderPlacement('Card', txnId)}
                />
            )}
        </div>
    );
}
