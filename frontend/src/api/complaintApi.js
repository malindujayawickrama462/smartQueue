const API_URL = '/api/complaint';
const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('smartqueue_token')}`
});

export const submitComplaint = async (data) => {
    const res = await fetch(API_URL, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
    if (!res.ok) throw new Error((await res.json()).message || "Failed");
    return res.json();
};

export const getMyComplaints = async () => {
    const res = await fetch(`${API_URL}/my`, { headers: getHeaders() });
    if (!res.ok) throw new Error((await res.json()).message || "Failed");
    return res.json();
};

export const getAllComplaints = async () => {
    const res = await fetch(API_URL, { headers: getHeaders() });
    if (!res.ok) throw new Error((await res.json()).message || "Failed");
    return res.json();
};

export const updateComplaintStatus = async (id, status, adminReply) => {
    const res = await fetch(`${API_URL}/${id}/status`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ status, adminReply }) });
    if (!res.ok) throw new Error((await res.json()).message || "Failed");
    return res.json();
};
