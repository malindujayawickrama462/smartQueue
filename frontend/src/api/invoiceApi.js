const API_URL = "/api/invoice";

export const generateInvoice = async (orderId) => {
    const res = await fetch(`${API_URL}/generate/${orderId}`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("smartqueue_token")}`
        }
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to generate invoice");
    }
    return res.json();
};

export const getInvoice = async (invoiceId) => {
    const res = await fetch(`${API_URL}/${invoiceId}`, {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("smartqueue_token")}`
        }
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to fetch invoice");
    }
    return res.json();
};

export const getUserInvoices = async () => {
    const res = await fetch(`${API_URL}/user/all`, {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("smartqueue_token")}`
        }
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to fetch user invoices");
    }
    return res.json();
};
