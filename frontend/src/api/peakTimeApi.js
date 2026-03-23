export const getPeakTimeData = async (canteenId) => {
    const res = await fetch(`/api/peaktime/${canteenId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('smartqueue_token')}` }
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch');
    return res.json();
};
