const API_URL = "/api/cart";

const getToken = () => localStorage.getItem("smartqueue_token");

const authHeaders = () => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${getToken()}`
});

// Fetch cart for a specific canteen
export const getCart = async (canteenId) => {
    const res = await fetch(`${API_URL}/${canteenId}`, {
        headers: authHeaders()
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to fetch cart");
    }
    return res.json();
};

// Fetch all carts for the logged-in user
export const getUserCarts = async () => {
    const res = await fetch(`${API_URL}/`, {
        headers: authHeaders()
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to fetch user carts");
    }
    return res.json();
};

// Add an item to cart
export const addToCart = async ({ canteenId, foodItemId, quantity = 1 }) => {
    const res = await fetch(`${API_URL}/add`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ canteenId, foodItemId, quantity })
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to add item to cart");
    }
    return res.json();
};

// Update quantity of a cart item
export const updateCartItem = async (canteenId, foodItemId, quantity) => {
    const res = await fetch(`${API_URL}/${canteenId}/item/${foodItemId}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ quantity })
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update cart item");
    }
    return res.json();
};

// Remove a single item from cart
export const removeCartItem = async (canteenId, foodItemId) => {
    const res = await fetch(`${API_URL}/${canteenId}/item/${foodItemId}`, {
        method: "DELETE",
        headers: authHeaders()
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to remove item from cart");
    }
    return res.json();
};

// Clear entire cart for a canteen
export const clearCart = async (canteenId) => {
    const res = await fetch(`${API_URL}/${canteenId}`, {
        method: "DELETE",
        headers: authHeaders()
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to clear cart");
    }
    return res.json();
};
