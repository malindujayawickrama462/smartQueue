export const getCanteenHistory = async (canteenId) => {
    const res = await fetch(`/api/order/canteen/${canteenId}/history`, {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("smartqueue_token")}`
        }
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to fetch history");
    }
    return res.json();
};

export const getCanteenAnalytics = async (canteenId) => {
    const res = await fetch(`/api/order/canteen/${canteenId}/analytics`, {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("smartqueue_token")}`
        }
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to fetch analytics");
    }
    return res.json();
};

export const createPOSOrder = async (canteenId, orderData) => {
    const res = await fetch(`/api/order/canteen/${canteenId}/pos`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("smartqueue_token")}`
        },
        body: JSON.stringify(orderData)
    });

    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create POS order");
    }
    return res.json();
};
