import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import CheckoutModal from '../components/CheckoutModal';
import { placeOrder, getAvailableSlots } from '../api/orderApi';
import { generateInvoice } from '../api/invoiceApi';
import { getAllFoodItemsWithImages } from '../api/foodApi'; // Using the image-enabled fetch
import { getPeakTimeData } from '../api/peakTimeApi';
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
    const [filterTag, setFilterTag] = useState('All');
    
    // Wallet & Points State
    const [walletInfo, setWalletInfo] = useState(null);
    const [redeemingPoints, setRedeemingPoints] = useState(0);

    const AVAILABLE_TAGS = ['All', 'Vegetarian', 'Vegan', 'Halal', 'Spicy', 'Contains Nuts'];

    useEffect(() => {
        const fetchMenuAndSlots = async () => {
            try {
                // Combined fetching: Wallet Info + Food Items with Images
                getWalletInfo().then(setWalletInfo).catch(() => {});
                
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

    // --- Conditional Renderings for Order Status ---
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
                                    {orderSuccess.order