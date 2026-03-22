const API_URL = "/api/order";

export const placeOrder = async (orderData) => {
    const res = await fetch(`${API_URL}/place`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("smartqueue_token")}`
        },
        body: JSON.stringify(orderData)
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to place order");
    }
    return res.json();
};

export const getStudentOrders = async () => {
    const res = await fetch(`${API_URL}/student`, {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("smartqueue_token")}`
        }
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to fetch orders");
    }
    return res.json();
};

export const getCanteenOrders = async (canteenID) => {
    const res = await fetch(`${API_URL}/canteen/${canteenID}`, {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("smartqueue_token")}`
        }
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to fetch canteen orders");
    }
    return res.json();
};

export const getAvailableSlots = async (canteenID) => {
    const res = await fetch(`${API_URL}/canteen/${canteenID}/slots`, {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("smartqueue_token")}`
        }
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to fetch available slots");
    }
    return res.json();
};

export const updateOrderStatus = async (statusData) => {
    const res = await fetch(`${API_URL}/status`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("smartqueue_token")}`
        },
        body: JSON.stringify(statusData)
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update status");
    }
    return res.json();
};

export const getGlobalAnalytics = async (filters = {}) => {
    const { startDate, endDate, canteenID } = filters;
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (canteenID && canteenID !== 'all') params.append('canteenID', canteenID);

    const queryString = params.toString() ? `?${params.toString()}` : '';

    const res = await fetch(`${API_URL}/global/analytics${queryString}`, {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("smartqueue_token")}`
        }
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to fetch global analytics");
    }
    return res.json();
};

export const generateAdminReport = async (filters = {}) => {
    const { startDate, endDate, canteenID, reportType } = filters;
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (canteenID && canteenID !== 'all') params.append('canteenID', canteenID);
    if (reportType) params.append('reportType', reportType);

    const queryString = params.toString() ? `?${params.toString()}` : '';

    const res = await fetch(`${API_URL}/global/reports${queryString}`, {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("smartqueue_token")}`
        }
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to generate report data");
    }
    return res.json();
};
