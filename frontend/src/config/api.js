// Normalize and sanitize API base URL to prevent double slashes (//)
// and guarantee the '/api' prefix regardless of how VITE_API_BASE_URL is entered in Vercel.
let rawBase = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000').trim();

// Strip any trailing slashes (e.g. "https://example.com/" -> "https://example.com")
rawBase = rawBase.replace(/\/+$/, '');

// Ensure it ends with '/api' (e.g. "https://example.com" -> "https://example.com/api")
const API_BASE_URL = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`;

export default API_BASE_URL;
