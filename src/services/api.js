import axios from 'axios';

/**
 * Single place for the backend URL and the axios instance.
 *
 * The API base used to be hardcoded as 'http://localhost:8000' in nine places
 * across four components, so pointing the app at a different host meant editing
 * every file. Vite exposes VITE_ variables at build time; the fallback keeps a
 * fresh clone working with no setup.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const getComplaints = () => api.get('/api/complaints');

export const saveComplaint = (payload) => api.post('/api/complaints', payload);

export const updateComplaintStatus = (id, status) =>
  api.patch(`/api/complaints/${id}/status`, { status });

export const checkDuplicate = (payload) => api.post('/api/check-duplicate', payload);

// current_state lets the backend treat this as a delta edit against the fields
// already on the form rather than re-extracting everything from scratch.
export const extractFromState = (prompt, currentState) =>
  api.post('/api/extract', { prompt, current_state: currentState });

// Multipart upload: let the browser set the boundary rather than forcing JSON.
export const uploadAndExtract = (formData) =>
  api.post('/api/upload-extract', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export default api;
