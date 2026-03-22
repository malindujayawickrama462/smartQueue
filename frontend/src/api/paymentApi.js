export const processPayment = async (paymentData) => {
    const res = await fetch("/api/payment/process", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("smartqueue_token")}`
        },
        body: JSON.stringify(paymentData)
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || "Payment processing failed");
    }
    return data;
};
