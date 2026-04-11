// API routes are now same-origin — no proxy needed
const API_URL = '';

async function fetchAPI(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    try {
        const res = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            // Disable caching for data freshness locally by default, or keep revalidate. 
            // Using cache: 'no-store' for Next.js 15 to ensure fresh data always for now.
            cache: 'no-store'
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || `API Error: ${res.status}`);
        }

        return res.json();
    } catch (error) {
        console.error(`Error fetching ${url}:`, error);
        throw error;
    }
}

export const api = {
    // Public
    getStats: () => fetchAPI('/api/public/stats'),
    getMapData: () => fetchAPI('/api/public/map'),
    searchPermits: ({ q = '', status = '', schemeId = '', regId = '', page = 1, limit = 25 }) => {
        const params = new URLSearchParams();
        if (q) params.append('q', q);
        if (status) params.append('status', status);
        if (schemeId) params.append('schemeId', schemeId);
        if (regId) params.append('regId', regId);
        params.append('page', page);
        params.append('limit', limit);
        return fetchAPI(`/api/public/search?${params.toString()}`);
    },
    getPermitDetail: (id) => fetchAPI(`/api/public/permit/${id}`),
    getLegalDashboard: () => fetchAPI('/api/public/dashboard/legal'),

    // Advanced
    getPriorityMap: () => fetchAPI('/api/advanced/priority/map'),
    getPriorityDetail: (id) => fetchAPI(`/api/advanced/priority/detail/${id}`),
    getBiophysicalMap: (commodityId) => {
        const query = commodityId ? `?commodityId=${commodityId}` : '';
        return fetchAPI(`/api/advanced/biophysical/map${query}`);
    },
    getBiophysicalData: (id) => fetchAPI(`/api/advanced/biophysical/${id}`),
    getCommodityData: (id) => fetchAPI(`/api/advanced/commodity/${id}`),
    getSocialData: (id) => fetchAPI(`/api/advanced/social/${id}`),
    getMarketData: (id) => fetchAPI(`/api/advanced/market/${id}`),
    getRiskData: (id) => fetchAPI(`/api/advanced/risk/${id}`)
};
