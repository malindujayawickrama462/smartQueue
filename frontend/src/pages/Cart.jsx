import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserCarts, updateCartItem, removeCartItem, clearCart } from '../api/cartApi';
import { placeOrder, getAvailableSlots } from '../api/orderApi';
import { processPayment } from '../api/paymentApi';
import { getWalletInfo } from '../api/walletApi';
import CheckoutModal from '../components/CheckoutModal';

const formatPrice = (n) => `Rs. ${Number(n).toFixed(2)}`;

/* ── Quantity Control ── */
function QuantityControl({ value, onDecrease, onIncrease, onChange, loading }) {
    return (
        <div className="flex items-center gap-1">
            <button onClick={onDecrease} disabled={loading || value <= 1}
                className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed">
                −
            </button>
            <input type="number" min={1} max={99} value={value}
                onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1) onChange(v); }}
                disabled={loading}
                className="w-12 text-center bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm py-1 focus:outline-none focus:border-emerald-500 disabled:opacity-50" />
            <button onClick={onIncrease} disabled={loading}
                className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed">
                +
            </button>
        </div>
    );
}

/* ── Cart Item Card ── */
function CartItemCard({ item, canteenId, onUpdate, onRemove }) {
    const [qty, setQty] = useState(item.quantity);
    const [busy, setBusy] = useState(false);
    const [removeConfirm, setRemoveConfirm] = useState(false);

    useEffect(() => setQty(item.quantity), [item.quantity]);

    const applyQty = useCallback(async (newQty) => {
        if (newQty === item.quantity) return;
        setBusy(true);
        try { await onUpdate(canteenId, item.foodItem._id || item.foodItem, newQty); }
        finally { setBusy(false); }
    }, [item, canteenId, onUpdate]);

    const handleRemove = useCallback(async () => {
        setBusy(true);
        try { await onRemove(canteenId, item.foodItem._id || item.foodItem); }
        finally { setBusy(false); setRemoveConfirm(false); }
    }, [item, canteenId, onRemove]);

    return (
        <div className={`relative flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-slate-900/60 border transition-all ${busy ? 'border-emerald-500/30 opacity-70' : 'border-slate-800 hover:border-slate-700'}`}>
            {busy && <div className="absolute inset-0 rounded-2xl bg-slate-950/40 flex items-center justify-center z-10"><div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>}
            <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-100 text-sm truncate">{item.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{formatPrice(item.price)} each</p>
                <p className="text-xs text-emerald-400 font-bold mt-1">Subtotal: {formatPrice(item.price * qty)}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
                <QuantityControl value={qty} loading={busy}
                    onDecrease={() => { const v = Math.max(1, qty - 1); setQty(v); applyQty(v); }}
                    onIncrease={() => { const v = qty + 1; setQty(v); applyQty(v); }}
                    onChange={(v) => { setQty(v); applyQty(v); }} />
                {removeConfirm ? (
                    <div className="flex gap-1">
                        <button onClick={handleRemove} disabled={busy} className="px-2 py-1 text-xs rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white transition font-bold">Yes</button>
                        <button onClick={() => setRemoveConfirm(false)} className="px-2 py-1 text-xs rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition font-bold">No</button>
                    </div>
                ) : (
                    <button onClick={() => setRemoveConfirm(true)} disabled={busy} title="Remove item"
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition disabled:opacity-40">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V4a1 1 0 011-1h6a1 1 0 011 1v3" /></svg>
                    </button>
                )}
            </div>
        </div>
    );
}

/* ── Slot Selector ── */
function SlotSelector({ canteenId, selectedSlot, onSelect }) {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const data = await getAvailableSlots(canteenId);
                const s = data.slots || [];
                setSlots(s);
                if (s.length > 0) onSelect(s[0]);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        })();
    }, [canteenId]);

    if (loading) return <p className="text-xs text-slate-500">Loading slots…</p>;
    if (slots.length === 0) return <p className="text-xs text-red-400">No pickup slots available right now.</p>;

    return (
        <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pickup Slot</p>
            <select
                value={selectedSlot?._id || ''}
                onChange={e => onSelect(slots.find(s => s._id === e.target.value))}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 text-sm">
                {slots.map(slot => <option key={slot._id} value={slot._id}>{slot.startTime} – {slot.endTime}</option>)}
            </select>
        </div>
    );
}

/* ── Payment Panel ── */
function PaymentPanel({ cartData, selectedSlot, onSuccess, onError, showToast }) {
    const [walletBalance, setWalletBalance] = useState(null);
    const [walletLoading, setWalletLoading] = useState(false);
    const [placing, setPlacing] = useState(false);
    const [showCardModal, setShowCardModal] = useState(false);

    const total = cartData.items.reduce((s, i) => s + i.price * i.quantity, 0);

    const buildOrderData = () => ({
        canteenID: cartData.canteen._id,
        items: cartData.items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
        totalPrice: total,
        timeSlot: selectedSlot,
    });

    const doPlace = async (method, transactionId = null) => {
        if (!selectedSlot) { onError('Please select a pickup slot first.'); return; }
        setPlacing(true);
        try {
            const data = await placeOrder({ ...buildOrderData(), paymentMethod: method, transactionId });
            onSuccess(data.order, cartData.canteen._id);
        } catch (err) {
            onError(err.message || 'Failed to place order');
        } finally {
            setPlacing(false);
        }
    };

    const handleWallet = async () => {
        setWalletLoading(true);
        try {
            const w = await getWalletInfo();
            setWalletBalance(w.walletBalance);
            if (w.walletBalance < total) {
                onError(`Insufficient wallet balance. Available: Rs. ${w.walletBalance.toFixed(2)}`);
                return;
            }
            await doPlace('Wallet');
        } catch (err) {
            onError(err.message || 'Wallet payment failed');
        } finally {
            setWalletLoading(false);
        }
    };

    return (
        <>
            <div className="border-t border-slate-800 px-5 py-5 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Cart Total</p>
                        <p className="text-2xl font-black text-emerald-400">{formatPrice(total)}</p>
                    </div>
                    <div className="text-right text-xs text-slate-500 font-bold">
                        {cartData.items.reduce((s, i) => s + i.quantity, 0)} items
                    </div>
                </div>

                {/* Slot selector */}
                <SlotSelector canteenId={cartData.canteen._id} selectedSlot={selectedSlot} onSelect={(slot) => onError('', slot)} />

                {/* Payment options */}
                <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select Payment</p>
                    <div className="grid grid-cols-3 gap-2">
                        {/* Wallet */}
                        <button
                            onClick={handleWallet}
                            disabled={placing || walletLoading}
                            className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 transition-all font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed">
                            {walletLoading ? <span className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /> : <span className="text-xl">👛</span>}
                            <span>Wallet</span>
                            {walletBalance !== null && <span className="text-[10px] opacity-70">Rs.{walletBalance.toFixed(0)}</span>}
                        </button>

                        {/* Cash */}
                        <button
                            onClick={() => doPlace('Cash')}
                            disabled={placing || walletLoading}
                            className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500 hover:text-slate-950 transition-all font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed">
                            {placing ? <span className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /> : <span className="text-xl">💵</span>}
                            <span>Cash</span>
                            <span className="text-[10px] opacity-70">Pay at counter</span>
                        </button>

                        {/* Card */}
                        <button
                            onClick={() => setShowCardModal(true)}
                            disabled={placing || walletLoading}
                            className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500 hover:text-slate-950 transition-all font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed">
                            <span className="text-xl">💳</span>
                            <span>Card</span>
                            <span className="text-[10px] opacity-70">Online payment</span>
                        </button>
                    </div>
                </div>
            </div>

            {showCardModal && (
                <CheckoutModal
                    amount={total}
                    onCancel={() => setShowCardModal(false)}
                    onSuccess={async (transactionId) => {
                        setShowCardModal(false);
                        await doPlace('Card', transactionId);
                    }}
                />
            )}
        </>
    );
}

/* ── Canteen Cart Section ── */
function CanteenCartSection({ cartData, onUpdate, onRemove, onClear, onOrderSuccess, showToast }) {
    const [clearing, setClearing] = useState(false);
    const [clearConfirm, setClearConfirm] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [slotError, setSlotError] = useState('');

    const handleClear = async () => {
        setClearing(true);
        try { await onClear(cartData.canteen._id); }
        finally { setClearing(false); setClearConfirm(false); }
    };

    const itemCount = cartData.items.reduce((s, i) => s + i.quantity, 0);

    // onError doubles as slot setter when called with empty string + slot
    const handleError = (msg, slot) => {
        if (slot !== undefined) { setSelectedSlot(slot); setSlotError(''); return; }
        setSlotError(msg);
        showToast(msg, 'error');
    };

    return (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 text-lg">🍽️</div>
                    <div>
                        <p className="font-black text-slate-100 text-sm">{cartData.canteen?.name || 'Canteen'}</p>
                        <p className="text-xs text-slate-500">{cartData.canteen?.location || ''}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-bold">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                    {clearConfirm ? (
                        <div className="flex gap-1">
                            <button onClick={handleClear} disabled={clearing} className="px-3 py-1 text-xs rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white transition font-bold">{clearing ? '…' : 'Clear'}</button>
                            <button onClick={() => setClearConfirm(false)} className="px-2 py-1 text-xs rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition">Cancel</button>
                        </div>
                    ) : (
                        <button onClick={() => setClearConfirm(true)} className="text-xs text-slate-500 hover:text-red-400 transition font-bold border border-transparent hover:border-red-500/20 px-2 py-1 rounded-lg">Clear all</button>
                    )}
                </div>
            </div>

            {/* Items */}
            <div className="p-4 space-y-3">
                {cartData.items.map(item => (
                    <CartItemCard key={item._id} item={item} canteenId={cartData.canteen._id} onUpdate={onUpdate} onRemove={onRemove} />
                ))}
            </div>

            {slotError && <p className="px-5 pb-2 text-xs text-red-400 font-bold">{slotError}</p>}

            {/* Payment panel */}
            <PaymentPanel
                cartData={cartData}
                selectedSlot={selectedSlot}
                onSuccess={onOrderSuccess}
                onError={handleError}
                showToast={showToast}
            />
        </div>
    );
}

/* ── Order Success Screen ── */
function OrderSuccessCard({ order, onDone }) {
    return (
        <div className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-sm w-full text-center space-y-5 shadow-2xl">
                <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-4xl">✅</div>
                <div>
                    <h2 className="text-2xl font-black text-slate-100">Order Placed!</h2>
                    {order.orderID && <p className="text-sm text-slate-400 mt-1">Order ID: <span className="text-emerald-400 font-bold">{order.orderID}</span></p>}
                    {order.timeSlot?.startTime && (
                        <p className="text-sm text-slate-400 mt-1">Pickup: <span className="text-slate-200 font-bold">{order.timeSlot.startTime} – {order.timeSlot.endTime}</span></p>
                    )}
                    <p className="text-xs text-slate-500 mt-3">Awaiting kitchen confirmation.</p>
                </div>
                <button onClick={onDone} className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all">Done</button>
            </div>
        </div>
    );
}

/* ── Main Cart Page ── */
export default function CartPage() {
    const nav = useNavigate();
    const [carts, setCarts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState(null);
    const [successOrder, setSuccessOrder] = useState(null);

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    }, []);

    const fetchCarts = useCallback(async () => {
        try { setLoading(true); setError(''); const data = await getUserCarts(); setCarts(data.carts || []); }
        catch (err) { setError(err.message || 'Failed to load carts'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchCarts(); }, [fetchCarts]);

    const handleUpdate = useCallback(async (canteenId, foodItemId, quantity) => {
        try {
            const data = await updateCartItem(canteenId, foodItemId, quantity);
            setCarts(prev => prev.map(c => c.canteen._id === canteenId ? { ...c, ...data.cart, canteen: c.canteen } : c));
            showToast('Cart updated');
        } catch (err) { showToast(err.message || 'Failed to update item', 'error'); await fetchCarts(); }
    }, [fetchCarts, showToast]);

    const handleRemove = useCallback(async (canteenId, foodItemId) => {
        try {
            const data = await removeCartItem(canteenId, foodItemId);
            if (!data.cart) { setCarts(prev => prev.filter(c => c.canteen._id !== canteenId)); }
            else { setCarts(prev => prev.map(c => c.canteen._id === canteenId ? { ...c, ...data.cart, canteen: c.canteen } : c)); }
            showToast('Item removed');
        } catch (err) { showToast(err.message || 'Failed to remove item', 'error'); await fetchCarts(); }
    }, [fetchCarts, showToast]);

    const handleClear = useCallback(async (canteenId) => {
        try { await clearCart(canteenId); setCarts(prev => prev.filter(c => c.canteen._id !== canteenId)); showToast('Cart cleared'); }
        catch (err) { showToast(err.message || 'Failed to clear cart', 'error'); }
    }, [showToast]);

    const handleOrderSuccess = useCallback((order, canteenId) => {
        // Remove the ordered canteen's cart
        setCarts(prev => prev.filter(c => c.canteen._id !== canteenId));
        setSuccessOrder(order);
    }, []);

    const grandTotal = carts.reduce((s, c) => s + c.totalPrice, 0);
    const totalItems = carts.reduce((s, c) => s + c.items.reduce((a, i) => a + i.quantity, 0), 0);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-10">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border text-sm font-bold ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                    {toast.type === 'error' ? '⚠️' : '✅'} {toast.message}
                </div>
            )}

            {/* Success overlay */}
            {successOrder && <OrderSuccessCard order={successOrder} onDone={() => { setSuccessOrder(null); if (carts.length === 0) nav('/home'); }} />}

            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3"><span className="text-4xl">🛒</span> My Cart</h1>
                        {!loading && carts.length > 0 && <p className="text-slate-400 mt-1 text-sm">{totalItems} item{totalItems !== 1 ? 's' : ''} across {carts.length} canteen{carts.length !== 1 ? 's' : ''}</p>}
                    </div>
                    <button onClick={() => nav('/canteens')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition text-sm font-bold border border-slate-700">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Add more
                    </button>
                </div>

                {loading && <div className="py-20 flex flex-col items-center gap-4"><div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /><p className="text-slate-500 text-sm">Loading your cart…</p></div>}

                {!loading && error && (
                    <div className="flex flex-col items-center gap-4 py-16 text-center">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-2xl">⚠️</div>
                        <p className="text-red-400 font-bold">{error}</p>
                        <button onClick={fetchCarts} className="px-5 py-2 rounded-xl bg-slate-800 text-slate-200 font-bold hover:bg-slate-700 transition">Retry</button>
                    </div>
                )}

                {!loading && !error && carts.length === 0 && (
                    <div className="flex flex-col items-center gap-6 py-24 text-center">
                        <div className="w-24 h-24 rounded-3xl bg-slate-800/60 border-2 border-dashed border-slate-700 flex items-center justify-center text-5xl">🛒</div>
                        <div>
                            <p className="text-xl font-black text-slate-200">Your cart is empty</p>
                            <p className="text-slate-500 mt-2 text-sm">Browse canteens and add items to get started.</p>
                        </div>
                        <button onClick={() => nav('/canteens')} className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black hover:shadow-[0_0_24px_rgba(16,185,129,0.35)] transition-all active:scale-95">Browse Canteens</button>
                    </div>
                )}

                {!loading && !error && carts.length > 0 && (
                    <>
                        <div className="space-y-6">
                            {carts.map(cartData => (
                                <CanteenCartSection
                                    key={cartData._id}
                                    cartData={cartData}
                                    onUpdate={handleUpdate}
                                    onRemove={handleRemove}
                                    onClear={handleClear}
                                    onOrderSuccess={handleOrderSuccess}
                                    showToast={showToast}
                                />
                            ))}
                        </div>
                        {carts.length > 1 && (
                            <div className="sticky bottom-4 mx-auto max-w-lg">
                                <div className="flex items-center justify-between px-6 py-4 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl backdrop-blur-md">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Grand Total</p>
                                        <p className="text-2xl font-black text-emerald-400">{formatPrice(grandTotal)}</p>
                                    </div>
                                    <div className="text-sm text-slate-400 font-bold">{carts.length} canteens</div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
