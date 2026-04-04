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

export const downloadInvoice = async (invoiceId, invoiceNumber) => {
    try {
        const res = await fetch(`${API_URL}/download/${invoiceId}`, {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("smartqueue_token")}`
            }
        });
        
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || "Failed to download invoice");
        }
        
        // Get the blob from response
        const blob = await res.blob();
        
        // Create a temporary URL for the blob
        const url = window.URL.createObjectURL(blob);
        
        // Create a link element and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = `Invoice_${invoiceNumber}.html`;
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        throw new Error(error.message || "Failed to download invoice");
    }
};
