const API_URL = "/api/wallet";

export const getWalletInfo = async () => {
    const res = await fetch(`${API_URL}/info`, {
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("smartqueue_token")}`
        }
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to fetch wallet info");
    }
    return res.json();
};

export const topUpWallet = async (amount) => {
    const res = await fetch(`${API_URL}/topup`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("smartqueue_token")}`
        },
        body: JSON.stringify({ amount })
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to top up wallet");
    }
    return res.json();
};
