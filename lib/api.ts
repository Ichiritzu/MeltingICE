/**
 * MeltingICE.app - API Client
 * Handles communication with PHP backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://meltingice.app/api';

interface ApiResponse<T> {
    success: boolean;
    message?: string;
    error?: string;
    data?: T;
}

export interface PublicReport {
    id: string;
    event_time_bucket: string;
    visible_at: string;
    lat_approx: number;
    lng_approx: number;
    geohash: string;
    city: string | null;
    state: string | null;
    tag: string;
    summary: string;
    confidence: number;
    upvotes: number;
    downvotes: number;
    is_verified: number | boolean;  // MySQL returns 0/1
    evidence_present: number | boolean;  // MySQL returns 0/1
    image_url: string | null;
    user_vote?: 'up' | 'down' | null;  // User's vote on this report

    // Detailed documentation fields
    activity_type?: string;
    num_officials?: string;
    num_vehicles?: string;
    uniform_description?: string;
    source_url?: string;
    created_at?: string;
}

interface ReportsListResponse {
    reports: PublicReport[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        has_more: boolean;
    };
}

interface Resource {
    id: number;
    category: string;
    title: string;
    content: string;
    metadata: Record<string, any> | null;
    sort_order: number;
}

// ============================================
// API FUNCTIONS
// ============================================

export const api = {
    /**
     * Fetch public reports from the server
     */
    async getReports(options?: { limit?: number; offset?: number; city?: string; state?: string }): Promise<ReportsListResponse> {
        const params = new URLSearchParams();
        if (options?.limit) params.set('limit', String(options.limit));
        if (options?.offset) params.set('offset', String(options.offset));
        if (options?.city) params.set('city', options.city);
        if (options?.state) params.set('state', options.state);

        const url = `${API_BASE}/reports/list.php?${params.toString()}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                cache: 'no-store',
            });

            const json: ApiResponse<ReportsListResponse> = await response.json();

            if (!json.success) {
                throw new Error(json.error || 'Failed to fetch reports');
            }

            return json.data!;
        } catch (error) {
            console.error('API getReports error:', error);
            // Return empty data on error (graceful degradation)
            return { reports: [], pagination: { total: 0, limit: 50, offset: 0, has_more: false } };
        }
    },

    /**
     * Submit a sanitized report to the public map
     */
    async createReport(report: {
        lat: number;
        lng: number;
        event_time: string;
        city?: string;
        state?: string;
        tag?: string;
        summary: string;
        evidence_present?: boolean;
        image_url?: string;
        // New documentation fields
        activity_type?: string;
        num_officials?: string;
        num_vehicles?: string;
        uniform_description?: string;
        source_url?: string;
    }): Promise<{ id: string; visible_at: string; expires_at: string } | null> {
        const url = `${API_BASE}/reports/create.php`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(report),
            });

            const json: ApiResponse<{ id: string; visible_at: string; expires_at: string }> = await response.json();

            if (!json.success) {
                throw new Error(json.error || 'Failed to create report');
            }

            return json.data!;
        } catch (error) {
            console.error('API createReport error:', error);
            throw error;
        }
    },

    /**
     * Fetch a single public report by ID
     */
    async getReport(id: string): Promise<PublicReport | null> {
        const url = `${API_BASE}/reports/get.php?id=${encodeURIComponent(id)}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                cache: 'no-store',
            });

            const json: ApiResponse<{ report: PublicReport }> = await response.json();

            if (!json.success) {
                return null;
            }

            return json.data?.report || null;
        } catch (error) {
            console.error('API getReport error:', error);
            return null;
        }
    },

    /**
     * Fetch resources (KYR cards, agencies, etc.)
     */
    async getResources(category?: string): Promise<Resource[] | Record<string, Resource[]>> {
        const params = category ? `?category=${category}` : '';
        const url = `${API_BASE}/resources/list.php${params}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
            });

            const json: ApiResponse<Resource[] | Record<string, Resource[]>> = await response.json();

            if (!json.success) {
                throw new Error(json.error || 'Failed to fetch resources');
            }

            return json.data!;
        } catch (error) {
            console.error('API getResources error:', error);
            return category ? [] : {};
        }
    },

    /**
     * Upload an image and get back a WebP URL
     */
    async uploadImage(file: Blob): Promise<{ url: string; id: string } | null> {
        const url = `${API_BASE}/uploads/image.php`;
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData,
            });

            const json: ApiResponse<{ url: string; id: string; size: number; format: string }> = await response.json();

            if (!json.success) {
                throw new Error(json.error || 'Failed to upload image');
            }

            return { url: json.data!.url, id: json.data!.id };
        } catch (error) {
            console.error('API uploadImage error:', error);
            return null;
        }
    },

    /**
     * Vote on a report
     */
    async vote(reportId: string, voteType: 'up' | 'down'): Promise<{ action: string; vote_type: string | null } | null> {
        const url = `${API_BASE}/reports/vote.php`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ report_id: reportId, vote_type: voteType }),
            });

            const json: ApiResponse<{ action: string; vote_type: string | null }> = await response.json();

            if (!json.success) {
                throw new Error(json.error || 'Failed to vote');
            }

            return json.data!;
        } catch (error) {
            console.error('API vote error:', error);
            return null;
        }
    },

    /**
     * Flag a report
     */
    async flag(reportId: string, reason: string, details?: string): Promise<boolean> {
        const url = `${API_BASE}/reports/flag.php`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ report_id: reportId, reason, details }),
            });

            const json: ApiResponse<unknown> = await response.json();

            if (!json.success) {
                throw new Error(json.error || 'Failed to flag');
            }

            return true;
        } catch (error) {
            console.error('API flag error:', error);
            return false;
        }
    },

    // ============================================
    // COMMUNITY API FUNCTIONS
    // ============================================

    /**
     * Fetch approved community events
     */
    async getCommunityEvents(): Promise<CommunityEvent[]> {
        const url = `${API_BASE}/community/events.php`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                cache: 'no-store',
            });

            const json = await response.json();
            return json.success ? json.events : [];
        } catch (error) {
            console.error('API getCommunityEvents error:', error);
            return [];
        }
    },

    /**
     * Fetch approved donation organizations
     */
    async getCommunityDonations(): Promise<CommunityDonation[]> {
        const url = `${API_BASE}/community/donations.php`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                cache: 'no-store',
            });

            const json = await response.json();
            return json.success ? json.donations : [];
        } catch (error) {
            console.error('API getCommunityDonations error:', error);
            return [];
        }
    },

    /**
     * Submit a new community event for approval
     */
    async submitCommunityEvent(event: {
        email: string;
        title: string;
        description: string;
        event_date: string;
        event_time?: string;
        location: string;
        organizer?: string;
        link?: string;
    }): Promise<{ success: boolean; message?: string; error?: string }> {
        const url = `${API_BASE}/community/submit-event.php`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(event),
            });

            return await response.json();
        } catch (error) {
            console.error('API submitCommunityEvent error:', error);
            return { success: false, error: 'Failed to submit event' };
        }
    },

    /**
     * Submit a new donation organization for approval
     */
    async submitCommunityDonation(donation: {
        email: string;
        name: string;
        description: string;
        link: string;
        image_url?: string;
        category?: string;
    }): Promise<{ success: boolean; message?: string; error?: string }> {
        const url = `${API_BASE}/community/submit-donation.php`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(donation),
            });

            return await response.json();
        } catch (error) {
            console.error('API submitCommunityDonation error:', error);
            return { success: false, error: 'Failed to submit organization' };
        }
    },
};

// Community types
export interface CommunityEvent {
    id: number;
    title: string;
    description: string;
    event_date: string;
    event_time: string | null;
    location: string;
    organizer: string | null;
    link: string | null;
    created_at: string;
}

export interface CommunityDonation {
    id: number;
    name: string;
    description: string;
    link: string;
    image_url: string | null;
    category: 'legal' | 'mutual_aid' | 'advocacy' | 'bail' | 'general';
    created_at: string;
}

export type { Resource, ReportsListResponse };
export default api;


