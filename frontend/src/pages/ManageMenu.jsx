import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { getAllFoodItems, addFoodItem, updateFoodItem, deleteFoodItem, setItemAvailability, fileToBase64 } from '../api/foodApi';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ManageMenu() {
    const { user } = useAuth();
    const nav = useNavigate();
    const [canteen, setCanteen] = useState(null);
    const [foodItems, setFoodItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Form states
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        category: '',
        description: '',
        image: '',
        imageData: null,
        imageType: null
    });
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        const fetchStaffCanteen = async () => {
            try {
                const res = await fetch("/api/canteen/staff/my-canteen", {
                    headers: { "Authorization": `Bearer ${localStorage.getItem("smartqueue_token")}` }
                });
                if (!res.ok) throw new Error("Could not find assigned canteen");
                const data = await res.json();
                setCanteen(data);
                loadFoodItems(data._id);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };
        fetchStaffCanteen();
    }, []);

    const loadFoodItems = async (cid) => {
        try {
            const data = await getAllFoodItems(cid);
            setFoodItems(data.items);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle image file selection
    const handleImageSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (max 500KB for small images)
        if (file.size > 500 * 1024) {
            alert("Image size must be less than 500KB");
            return;
        }

        // Validate image type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            alert("Only JPEG, PNG, WebP, and GIF images are allowed");
            return;
        }

        try {
            // Convert to base64
            const base64 = await fileToBase64(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (event) => {
                setImagePreview(event.target.result);
            };
            reader.readAsDataURL(file);

            // Store in form data
            setFormData(prev => ({
                ...prev,
                imageData: base64,
                imageType: file.type
            }));
        } catch (err) {
            alert("Failed to process image: " + err.message);
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.price || !formData.category.trim()) {
            alert('Please fill in all required fields.');
            return;
        }
        const priceNum = parseFloat(formData.price);
        if (isNaN(priceNum) || priceNum <= 0 || priceNum > 100000) {
            alert('Price must be a valid positive number up to 100,000.');
            return;
        }
        if (formData.name.trim().length < 2) {
            alert('Item name must be at least 2 characters.');
            return;
        }
        if (formData.description.length > 500) {
            alert('Description is too long (max 500 characters).');
            return;
        }
        setIsSubmitting(true);
        try {
            const submitData = {
                name: formData.name,
                price: parseFloat(formData.price),
                category: formData.category,
                description: formData.description,
                image: formData.image,
                ...(formData.imageData && {
                    imageData: formData.imageData,
                    imageType: formData.imageType
                })
            };

            if (editItem) {
                await updateFoodItem(editItem._id, submitData);
            } else {
                await addFoodItem({ ...submitData, canteen: canteen._id });
            }
            
            // Refresh list
            loadFoodItems(canteen._id);
            closeForm();
        } catch (err) {
            alert(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (item) => {
        setEditItem(item);
        setFormData({
            name: item.name,
            price: item.price,
            category: item.category,
            description: item.description || '',
            image: item.image || '',
            imageData: null,
            imageType: null
        });
        // Show existing image if available
        if (item.imageData) {
            setImagePreview(`data:${item.imageType};base64,${item.imageData.toString('base64')}`);
        } else {
            setImagePreview(null);
        }
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;
        try {
            await deleteFoodItem(id);
            setFoodItems(prev => prev.filter(i => i._id !== id));
        } catch (err) {
            alert(err.message);
        }
    };

    const handleToggleAvailability = async (item) => {
        try {
            const newStatus = !item.availability;
            await setItemAvailability(item._id, newStatus);
            setFoodItems(prev => prev.map(i => i._id === item._id ? { ...i, availability: newStatus } : i));
        } catch (err) {
            alert(err.message);
        }
    };

    const closeForm = () => {
        setShowForm(false);
        setEditItem(null);
        setImagePreview(null);
        setFormData({ 
            name: '', 
            price: '', 
            category: '', 
            description: '', 
            image: '',
            imageData: null,
            imageType: null
        });
    };

    // Helper to get image URL for menu item
    const getItemImageUrl = (item) => {
        if (item.imageData) {
            return `/api/food/${item._id}/image`;
        }
        return item.image || null;
    };

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading Menu...</div>;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">{canteen?.name} Menu Manager</h1>
                        <p className="text-sm text-slate-400 uppercase font-bold tracking-widest mt-1">Add, Update, or Remove Items</p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button
                            onClick={() => nav('/kitchen')}
                            className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition"
                        >
                            Back to Kitchen
                        </button>
                        <button
                            onClick={() => { closeForm(); setShowForm(true); }}
                            className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
                        >
                            + Add New Item
                        </button>
                    </div>
                </div>

                {error && <p className="text-red-400 bg-red-400/10 p-4 rounded-xl border border-red-400/20">{error}</p>}

                {showForm && (
                    <div className="relative group animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="absolute -inset-1 rounded-3xl blur-xl opacity-20 bg-emerald-500 transition-all"></div>
                        <Card title={editItem ? "Edit Food Item" : "Add New Food Item"} subtitle="Fill item details and upload image">
                            <form onSubmit={handleFormSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Item Name</label>
                                        <input
                                            required
                                            type="text"
                                            minLength={2}
                                            maxLength={50}
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                                            placeholder="e.g. Chicken Fried Rice"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Price (LKR)</label>
                                        <input
                                            required
                                            type="number"
                                            min={1}
                                            max={100000}
                                            step="0.01"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                                            placeholder="e.g. 450"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category</label>
                                        <input
                                            required
                                            type="text"
                                            minLength={2}
                                            maxLength={30}
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                                            placeholder="e.g. Lunch, Snacks, Drinks"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Image URL (Optional)</label>
                                        <input
                                            type="url"
                                            maxLength={500}
                                            value={formData.image}
                                            onChange={e => setFormData({ ...formData, image: e.target.value })}
                                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        maxLength={500}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                                        rows="2" 
                                        placeholder="Brief description of the item..."
                                    />
                                </div>

                                {/* Image Upload Section */}
                                <div className="space-y-3 border-t border-slate-700 pt-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">📸 Upload Image (Max 500KB)</label>
                                        <label className="block">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageSelect}
                                                className="block w-full text-sm text-slate-400
                                                    file:mr-4 file:py-2 file:px-4
                                                    file:rounded-lg file:border-0
                                                    file:text-sm file:font-semibold
                                                    file:bg-emerald-500 file:text-slate-950
                                                    hover:file:bg-emerald-400 cursor-pointer"
                                            />
                                        </label>
                                        <p className="text-[10px] text-slate-500">Supported: JPEG, PNG, WebP, GIF</p>
                                    </div>

                                    {/* Image Preview */}
                                    {imagePreview && (
                                        <div className="flex justify-center items-center bg-slate-900/50 border border-slate-700 rounded-xl overflow-hidden">
                                            <img 
                                                src={imagePreview} 
                                                alt="Preview" 
                                                className="max-h-40 max-w-xs object-contain"
                                            />
                                        </div>
                                    )}

                                    {imagePreview && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setImagePreview(null);
                                                setFormData(prev => ({ ...prev, imageData: null, imageType: null }));
                                            }}
                                            className="w-full py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg border border-red-500/20 transition"
                                        >
                                            Remove Image
                                        </button>
                                    )}
                                </div>

                                <div className="flex gap-3 justify-end pt-4 border-t border-slate-800">
                                    <button 
                                        type="button" 
                                        onClick={closeForm} 
                                        disabled={isSubmitting}
                                        className="px-5 py-2 rounded-xl text-slate-400 hover:text-white transition disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? "Saving..." : editItem ? "Save Changes" : "Confirm & Add"}
                                    </button>
                                </div>
                            </form>
                        </Card>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {foodItems.map(item => {
                        const imageUrl = getItemImageUrl(item);
                        return (
                            <Card key={item._id} title={item.name} subtitle={item.category}>
                                <div className="space-y-4">
                                    {/* Image Display */}
                                    {imageUrl && (
                                        <div className="bg-slate-900/50 rounded-lg overflow-hidden border border-slate-700">
                                            <img 
                                                src={imageUrl}
                                                alt={item.name}
                                                className="w-full h-32 object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center">
                                        <p className="text-lg font-black text-emerald-400">LKR {item.price}</p>
                                        <button
                                            onClick={() => handleToggleAvailability(item)}
                                            className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full border ${item.availability ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'}`}
                                        >
                                            {item.availability ? 'Available ✅' : 'Out of Stock ❌'}
                                        </button>
                                    </div>

                                    <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px]">{item.description || 'No description provided.'}</p>

                                    {item.imageData && (
                                        <p className="text-[10px] text-emerald-400 font-bold">📸 Image Stored</p>
                                    )}

                                    <div className="flex gap-2 pt-4 border-t border-slate-800">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="flex-1 py-2 rounded-lg bg-sky-500/10 text-sky-400 font-bold text-xs hover:bg-sky-500 hover:text-slate-950 transition"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item._id)}
                                            className="py-2 px-4 rounded-lg bg-red-500/10 text-red-400 font-bold text-xs hover:bg-red-500 hover:text-slate-950 transition"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}

                    {foodItems.length === 0 && !showForm && (
                        <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-800 rounded-3xl text-slate-500">
                            <p className="text-lg font-medium">No items in the menu yet.</p>
                            <p className="text-sm">Click "Add New Item" to start building your menu.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}