import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

export const getPeakTimeData = (canteenId) =>
  axios.get(`${BASE_URL}/peaktime/${canteenId}`);

export const submitComplaint = (data) => axios.post(`${BASE_URL}/complaints`, data);

export const getMyComplaints = (studentId) =>
  axios.get(`${BASE_URL}/complaints/student/${studentId}`);

export const getAllComplaints = () => axios.get(`${BASE_URL}/complaints/admin/all`);

export const updateComplaintStatus = (id, data) =>
  axios.put(`${BASE_URL}/complaints/${id}`, data);

