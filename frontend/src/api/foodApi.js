const API_URL = "/api/food";

export const getAllFoodItems = async (canteenId) => {
    const res = await fetch(`${API_URL}/all/${canteenId}`, {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("smartqueue_token")}`
        }
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to fetch food items");
    }
    return res.json();
};

export const getFoodItemsByCategory = async (canteenId, category) => {
    const res = await fetch(`${API_URL}/category/${canteenId}/${category}`, {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("smartqueue_token")}`
        }
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to fetch category items");
    }
    return res.json();
};

export const addFoodItem = async (foodData) => {
    const res = await fetch(`${API_URL}/add`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("smartqueue_token")}`
        },
        body: JSON.stringify(foodData)
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to add food item");
    }
    return res.json();
};

export const updateFoodItem = async (id, foodData) => {
    const res = await fetch(`${API_URL}/update/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("smartqueue_token")}`
        },
        body: JSON.stringify(foodData)
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update food item");
    }
    return res.json();
};

export const setItemAvailability = async (id, availability) => {
    const res = await fetch(`${API_URL}/availability/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("smartqueue_token")}`
        },
        body: JSON.stringify({ availability })
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update availability");
    }
    return res.json();
};

export const deleteFoodItem = async (id) => {
    const res = await fetch(`${API_URL}/delete/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("smartqueue_token")}`
        }
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to delete food item");
    }
    return res.json();
};

// Helper: Convert file to base64
export const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Extract base64 data without the data URL prefix
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = (error) => reject(error);
    });
};

// Get food items with image URLs
export const getAllFoodItemsWithImages = async (canteenId) => {
    const res = await fetch(`${API_URL}/with-images/${canteenId}`, {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("smartqueue_token")}`
        }
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to fetch food items with images");
    }
    return res.json();
};
