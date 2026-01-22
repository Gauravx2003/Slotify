import axios from 'axios';

// In development, we use relative /api which goes through Vite proxy to localhost:3000
// In production, use the full API URL from environment variable
const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
