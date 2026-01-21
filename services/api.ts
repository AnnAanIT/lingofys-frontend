import {
  User, UserRole, Mentor, Booking, BookingStatus, Homework,
  AvailabilitySlot, Conversation, Message, Notification,
  Transaction, Payout, SystemLog, CreditHistoryEntry,
  Subscription, SubscriptionPlan, MentorEarning,
  SystemCreditLedgerEntry, Provider, Referral,
  ProviderCommission, PricingCountry, PricingGroup,
  SystemSettings, ProviderLevel, WeeklyRevenueResponse, MonthlyRevenueResponse, CACDashboardData
} from '../types';

// ===== BACKEND API CONFIGURATION =====
// ✅ FIXED: No fallback to localhost - fail fast if VITE_API_URL missing
const API_BASE_URL = import.meta.env.VITE_API_URL as string;
if (!API_BASE_URL) {
  throw new Error(
    '❌ VITE_API_URL is not configured. Please set it in .env file.\n' +
    'Example: VITE_API_URL=https://api.lingofys.com'
  );
}

// Helper: Build full API URL
const buildUrl = (path: string): string => `${API_BASE_URL}${path}`;

// Helper: Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Helper: Get refresh token from localStorage
const getRefreshToken = (): string | null => {
  return localStorage.getItem('refreshToken');
};

// Helper: Set tokens in localStorage
const setTokens = (token: string, refreshToken: string): void => {
  localStorage.setItem('authToken', token);
  localStorage.setItem('refreshToken', refreshToken);
};

// Helper: Clear all auth data
const clearAuthData = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

// Helper: Refresh access token using refresh token
const refreshAccessToken = async (): Promise<boolean> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch(buildUrl('/api/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    setTokens(data.token, data.refreshToken);
    return true;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    return false;
  }
};

// Helper: Authenticated fetch with JWT token and auto-refresh
const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  let token = getAuthToken();
  if (!token) {
    throw new Error('Not authenticated. Please login first.');
  }

  // First attempt with current token
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  // If 401, try to refresh token and retry
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      // Retry with new token
      token = getAuthToken();
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } else {
      // Refresh failed, clear auth and redirect to login
      clearAuthData();
      throw new Error('Session expired. Please login again.');
    }
  }

  return response;
};

// Helper: Authenticated fetch for multipart/form-data (file uploads)
const authenticatedFetchMultipart = async (url: string, options: RequestInit = {}): Promise<Response> => {
  let token = getAuthToken();
  if (!token) {
    throw new Error('Not authenticated. Please login first.');
  }

  // First attempt with current token
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      // DO NOT set Content-Type for multipart - browser sets it automatically
    }
  });

  // If 401, try to refresh token and retry
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      // Retry with new token
      token = getAuthToken();
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
        }
      });
    } else {
      // Refresh failed, clear auth
      clearAuthData();
      throw new Error('Session expired. Please login again.');
    }
  }

  return response;
};

// Helper: Handle API errors
const handleApiError = async (response: Response): Promise<never> => {
  // Try to parse error message from response
  const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));

  // Auto-logout on 401 Unauthorized ONLY if user was previously authenticated
  if (response.status === 401) {
    const hasToken = getAuthToken();

    // Only clear auth and redirect if user had a token (was logged in)
    // Don't do this for login failures where user never had a token
    if (hasToken) {
      clearAuthData();
      // Redirect to login after short delay
      setTimeout(() => {
        window.location.href = '/#/login';
      }, 1000);
    }

    // Throw the actual error message from backend
    throw new Error(errorData.error || errorData.message || 'Unauthorized');
  }

  throw new Error(errorData.error || errorData.message || `API Error: ${response.status}`);
};

// ===== FIELD MAPPING HELPERS (Option 1 Implementation) =====
// Backend DB uses "bio" and "bioLong"
// Frontend uses "headline" and "aboutMe" for better clarity

/**
 * Transform API response (DB fields) to Frontend format
 * bio → headline
 * bioLong → aboutMe
 */
const transformMentorFromAPI = (apiMentor: any): Mentor => {
  // Backend may return nested mentorProfile or flat structure
  const profile = apiMentor.mentorProfile || {};
  
  console.log('🔄 [transformMentorFromAPI]', apiMentor.name, {
    hasTopLevelTeachingLanguages: !!apiMentor.teachingLanguages,
    hasProfileTeachingLanguages: !!profile.teachingLanguages,
    teachingLanguages: apiMentor.teachingLanguages || profile.teachingLanguages
  });
  
  return {
    ...apiMentor,
    // Flatten mentorProfile fields to top level
    headline: apiMentor.bio || profile.bio || '',
    aboutMe: apiMentor.bioLong || profile.bioLong || '',
    teachingLanguages: apiMentor.teachingLanguages || profile.teachingLanguages || [],
    videoIntro: apiMentor.videoIntro || profile.videoIntro || '',
    specialties: apiMentor.specialties || profile.specialties || [],
    experienceYears: apiMentor.experienceYears ?? profile.experienceYears ?? 0,
    education: apiMentor.education || profile.education || '',
    rating: apiMentor.rating ?? profile.rating ?? 5,
    totalSessions: apiMentor.totalSessions ?? profile.totalSessions ?? 0,
    availability: apiMentor.availability || profile.availability || [],
    // Keep original fields for backward compatibility during transition
    bio: undefined,
    bioLong: undefined,
    mentorProfile: undefined,
  } as Mentor;
};

/**
 * Transform Frontend data to API format (DB fields)
 * headline → bio
 * aboutMe → bioLong
 */
const transformMentorToAPI = (mentorData: Partial<Mentor>): any => {
  const apiData: any = { ...mentorData };
  
  // Map frontend field names to backend field names
  if (mentorData.headline !== undefined) {
    apiData.bio = mentorData.headline;
    delete apiData.headline;
  }
  
  if (mentorData.aboutMe !== undefined) {
    apiData.bioLong = mentorData.aboutMe;
    delete apiData.aboutMe;
  }
  
  return apiData;
};

// ===== API OBJECT =====
export const api = {
  resetDatabase: async () => {
    // Backend API: Reset database to initial state (dev/test only)
    // Requires confirmToken in body to prevent accidental resets
    const response = await authenticatedFetch(buildUrl('/api/admin/reset-database'), {
      method: 'POST',
      body: JSON.stringify({
        confirmToken: 'CONFIRM_RESET_DATABASE'
      })
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    // Clear local cache
    clearAuthData();
    window.location.reload();
  },

  // ===== AUTHENTICATION =====

  login: async (email: string, password: string): Promise<User> => {
    const response = await fetch(buildUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    const data = await response.json();

    // Store both tokens
    setTokens(data.token, data.refreshToken);

    // Cache user data for session persistence
    localStorage.setItem('user', JSON.stringify(data.user));

    return data.user;
  },

  loginById: async (id: string): Promise<User> => {
    // Backend API: Get user by ID (for testing/development)
    const response = await authenticatedFetch(buildUrl(`/api/users/${id}`));

    if (!response.ok) {
      await handleApiError(response);
    }

    const user = await response.json();

    // Cache user data
    localStorage.setItem('user', JSON.stringify(user));

    return user;
  },

  loginByRole: async (role: UserRole): Promise<User> => {
    // Backend API: Find first user by role (for testing/development)
    const response = await authenticatedFetch(buildUrl(`/api/users/by-role/${role}`));

    if (!response.ok) {
      await handleApiError(response);
    }

    const user = await response.json();

    // Cache user data
    localStorage.setItem('user', JSON.stringify(user));

    return user;
  },

  register: async (data: any): Promise<User> => {
    // ✅ Validate country is provided (required field)
    if (!data.country) {
      throw new Error('Country is required for registration');
    }

    const response = await fetch(buildUrl('/api/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role,
        country: data.country,  // ✅ REQUIRED - no default
        referralCode: data.referralCode || undefined
      })
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    const result = await response.json();
    return result.user;
  },

  // ===== USER PROFILE =====

  getUserById: async (id: string): Promise<User | undefined> => {
    const response = await authenticatedFetch(buildUrl(`/api/users/${id}`));

    if (response.status === 404) {
      return undefined;
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const userData = await response.json();
    
    // Flatten mentorProfile fields to top level for MENTOR role
    if (userData.role === 'MENTOR' && userData.mentorProfile) {
      const { mentorProfile, ...user } = userData;
      return {
        ...user,
        // Flatten mentor-specific fields from nested mentorProfile
        headline: mentorProfile.bio || '',
        bio: mentorProfile.bio,
        aboutMe: mentorProfile.bioLong,
        videoIntro: mentorProfile.videoIntro,
        specialties: mentorProfile.specialties || [],
        teachingLanguages: mentorProfile.teachingLanguages || [],
        experienceYears: mentorProfile.experienceYears || 0,
        mentorGroupId: mentorProfile.mentorGroupId,
        availability: mentorProfile.availability || [],
        rating: mentorProfile.rating || 0,
        reviewCount: mentorProfile.reviewCount || 0,
        certificates: mentorProfile.certificates || [],
        cancellationCount: mentorProfile.cancellationCount,
        lastCancelAt: mentorProfile.lastCancelAt,
        meetingLink: mentorProfile.meetingLink || '',
        meetingPlatform: mentorProfile.meetingPlatform || 'zoom'
      };
    }

    return userData;
  },

  updateUserProfile: async (data: Partial<User>): Promise<User> => {
    // Updates current user profile (always /api/users/me)
    console.log('📤 [api.updateUserProfile] Sending data:', data);
    const response = await authenticatedFetch(buildUrl('/api/users/me'), {
      method: 'PATCH',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    const updatedUser = await response.json();
    console.log('📥 [api.updateUserProfile] Response:', updatedUser);

    // Update cached user
    localStorage.setItem('user', JSON.stringify(updatedUser));

    return updatedUser;
  },

  uploadAvatar: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await authenticatedFetchMultipart(buildUrl('/api/users/me/avatar'), {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    const data = await response.json();
    return data.avatarUrl;
  },

  updateAvatar: async (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await authenticatedFetchMultipart(buildUrl('/api/users/me/avatar'), {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    const updatedUser = await response.json();

    // Update cached user
    localStorage.setItem('user', JSON.stringify(updatedUser));

    return updatedUser;
  },

  // ===== MENTOR MANAGEMENT =====

  getMentors: async (): Promise<Mentor[]> => {
    const response = await fetch(buildUrl('/api/mentors'));

    if (!response.ok) {
      await handleApiError(response);
    }

    const apiMentors = await response.json();
    return apiMentors.map(transformMentorFromAPI);
  },

  getMentorById: async (id: string): Promise<Mentor | undefined> => {
    const response = await fetch(buildUrl(`/api/mentors/${id}`));

    if (response.status === 404) {
      return undefined;
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    const apiMentor = await response.json();
    return transformMentorFromAPI(apiMentor);
  },

  getMentorReviews: async (mentorId: string, limit?: number): Promise<{ reviews: any[] }> => {
    const url = limit 
      ? buildUrl(`/api/mentors/${mentorId}/reviews?limit=${limit}`)
      : buildUrl(`/api/mentors/${mentorId}/reviews`);
    
    const response = await fetch(url);

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  // ===== MENTOR PROFILE =====

  updateMentorProfile: async (mentorId: string, data: Partial<Mentor>): Promise<Mentor> => {
    // Transform frontend field names to backend field names
    const apiData = transformMentorToAPI(data);
    
    const response = await authenticatedFetch(buildUrl(`/api/mentors/${mentorId}/profile`), {
      method: 'PATCH',
      body: JSON.stringify(apiData)
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    const apiMentor = await response.json();
    return transformMentorFromAPI(apiMentor);
  },

  // ===== AVAILABILITY =====

  getAvailability: async (mentorId: string): Promise<AvailabilitySlot[]> => {
    const response = await fetch(buildUrl(`/api/mentors/${mentorId}/availability`));

    if (!response.ok) {
      await handleApiError(response);
    }

    const backendSlots = await response.json();

    // Transform backend format to frontend format
    // Backend transformAvailability already returns day, endTime, interval, duration
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return backendSlots.map((slot: any) => {
      // Backend already calculates duration and handles 24:00 in transformAvailability
      // But we need to ensure frontend format is consistent
      const day = slot.day || dayNames[slot.dayOfWeek];
      
      // Calculate duration if not provided (for backward compatibility)
      let duration = slot.duration;
      if (!duration) {
        const [startHour, startMin] = slot.startTime.split(':').map(Number);
        let [endHour, endMin] = slot.endTime === '24:00' ? [24, 0] : slot.endTime.split(':').map(Number);
        duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
        if (duration < 0) {
          duration = (24 * 60) + duration; // Handle midnight crossover
        }
        if (duration <= 0) {
          duration = 30; // Default to 30 minutes
        }
      }

      return {
        id: slot.id,
        mentorId: slot.mentorId,
        day: day,
        startTime: slot.startTime,
        endTime: slot.endTime, // Include endTime for frontend
        interval: slot.interval || 30,
        duration: duration,
        recurring: slot.recurring ?? slot.isRecurring ?? true
      };
    });
  },

  addAvailability: async (mentorId: string, slots: AvailabilitySlot[]): Promise<AvailabilitySlot[]> => {
    const response = await authenticatedFetch(buildUrl(`/api/mentors/${mentorId}/availability`), {
      method: 'PUT',
      body: JSON.stringify({ availability: slots })
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  updateAvailability: async (mentorId: string, slots: AvailabilitySlot[]): Promise<AvailabilitySlot[]> => {
    const response = await authenticatedFetch(buildUrl(`/api/mentors/${mentorId}/availability`), {
      method: 'PUT',
      body: JSON.stringify({ availability: slots })
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  deleteAvailability: async (mentorId: string, dayOfWeek: number, startTime: string): Promise<void> => {
    // Convert dayOfWeek number to day name
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = dayNames[dayOfWeek];

    // Call DELETE endpoint with query params
    const response = await authenticatedFetch(
      buildUrl(`/api/mentors/${mentorId}/availability?day=${dayName}&startTime=${startTime}`),
      { method: 'DELETE' }
    );

    if (!response.ok) {
      await handleApiError(response);
    }
  },

  // ✅ New: Delete specific 30-minute slot from a range
  deleteAvailabilitySlot: async (mentorId: string, dayOfWeek: number, rangeStartTime: string, slotStartTime: string): Promise<AvailabilitySlot[]> => {
    // Convert dayOfWeek number to day name
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = dayNames[dayOfWeek];

    // Call DELETE endpoint with query params (rangeStartTime + slotStartTime)
    const response = await authenticatedFetch(
      buildUrl(`/api/mentors/${mentorId}/availability/slot?day=${dayName}&rangeStartTime=${rangeStartTime}&slotStartTime=${slotStartTime}`),
      { method: 'DELETE' }
    );

    if (!response.ok) {
      await handleApiError(response);
    }

    // Backend returns updated availability slots (already in frontend format from transformAvailability)
    const backendSlots = await response.json();
    
    // Transform backend format to frontend format (same as getAvailability)
    // Backend already returns transformed format from transformAvailability, but we need to ensure consistency
    return backendSlots.map((slot: any) => {
      // Backend transformAvailability already calculates duration and handles 24:00
      // But we need to ensure frontend format matches getAvailability
      const day = slot.day || dayNames[slot.dayOfWeek];
      
      // Calculate duration if not provided (for backward compatibility)
      let duration = slot.duration;
      if (!duration) {
        const [startHour, startMin] = slot.startTime.split(':').map(Number);
        let [endHour, endMin] = slot.endTime === '24:00' ? [24, 0] : slot.endTime.split(':').map(Number);
        duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
        if (duration < 0) {
          duration = (24 * 60) + duration; // Handle midnight crossover
        }
        if (duration <= 0) {
          duration = 30; // Default to 30 minutes
        }
      }

      return {
        id: slot.id,
        mentorId: slot.mentorId,
        day: day,
        startTime: slot.startTime,
        endTime: slot.endTime, // Include endTime for frontend
        interval: slot.interval || 30,
        duration: duration,
        recurring: slot.recurring ?? slot.isRecurring ?? true
      };
    });
  },

  getMentorLocalizedRate: async (mentorId: string, userCountry?: string) => {
    const queryParams = new URLSearchParams();
    if (userCountry) queryParams.append('country', userCountry);

    const url = buildUrl(`/api/mentors/${mentorId}/localized-rate${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to get mentor localized rate');
    }

    return await response.json();
  },

  // Added: Get mentor's upcoming bookings (PUBLIC - for calendar display)
  getMentorUpcomingBookings: async (mentorId: string): Promise<Booking[]> => {
    const response = await fetch(buildUrl(`/api/mentors/${mentorId}/upcoming-bookings`));

    if (!response.ok) {
      throw new Error('Failed to get mentor bookings');
    }

    return await response.json();
  },

  // ===== CREDIT SYSTEM =====

  getUserCreditHistory: async (userId: string): Promise<CreditHistoryEntry[]> => {
    const response = await authenticatedFetch(buildUrl('/api/users/me/credit-history'));

    if (!response.ok) {
      await handleApiError(response);
    }

    const history = await response.json();
    // Transform backend format to frontend format (convert type to lowercase, convert Decimal to number)
    return history.map((entry: any) => {
      // Map backend types to frontend types
      const typeMap: Record<string, string> = {
        'TOPUP': 'topup',
        'BOOKING_PAYMENT': 'booking_use',
        'BOOKING_REFUND': 'refund',
        'SUBSCRIPTION_PAYMENT': 'subscription_purchase',
        'SUBSCRIPTION_RENEWAL': 'subscription_renewal',
        'SUBSCRIPTION_UPGRADE': 'subscription_upgrade',
        'SUBSCRIPTION_DOWNGRADE': 'subscription_downgrade',
        'SUBSCRIPTION_REFUND': 'subscription_refund',
        'EARNING': 'earning',
        'PAYOUT': 'payout',
        'ADMIN_ADJUSTMENT': 'admin_adjustment',
        'PROVIDER_COMMISSION': 'earning', // Provider commission is treated as earning
      };
      
      const mappedType = typeMap[entry.type] || entry.type?.toLowerCase() || entry.type;
      
      return {
        ...entry,
        type: mappedType,
        amount: Number(entry.amount || 0),
        balanceAfter: Number(entry.balanceAfter || 0),
        timestamp: entry.createdAt || entry.timestamp, // Backend uses createdAt, frontend expects timestamp
      };
    });
  },

  updateUserCredit: async (userId: string, amount: number, reason: string): Promise<User> => {
    // Admin function: Adjust user credits
    const response = await authenticatedFetch(buildUrl(`/api/users/${userId}/adjust-credits`), {
      method: 'PATCH',
      body: JSON.stringify({ amount, reason })
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  // ===== BOOKING SYSTEM =====

  createOneTimeBooking: async (bookingData: any): Promise<Booking> => {
    const response = await authenticatedFetch(buildUrl('/api/bookings'), {
      method: 'POST',
      body: JSON.stringify(bookingData)
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  getBookings: async (): Promise<Booking[]> => {
    const response = await authenticatedFetch(buildUrl('/api/bookings'));

    if (!response.ok) {
      await handleApiError(response);
    }

    const bookings = await response.json();
    // Transform backend format to frontend format (flatten mentee/mentor objects)
    return bookings.map((booking: any) => ({
      ...booking,
      menteeName: booking.mentee?.name || booking.menteeName || '',
      mentorName: booking.mentor?.name || booking.mentorName || '',
      menteeAvatar: booking.mentee?.avatar || booking.menteeAvatar || '',
      mentorAvatar: booking.mentor?.avatar || booking.mentorAvatar || '',
    }));
  },

  // Get upcoming bookings for current user
  getUpcomingBookings: async (limit: number = 5, todayOnly: boolean = false): Promise<Booking[]> => {
    const response = await authenticatedFetch(
      buildUrl(`/api/bookings/upcoming?limit=${limit}&todayOnly=${todayOnly}`)
    );

    if (!response.ok) {
      await handleApiError(response);
    }

    const bookings = await response.json();
    // Transform backend format to frontend format (flatten mentee/mentor objects)
    return bookings.map((booking: any) => ({
      ...booking,
      menteeName: booking.mentee?.name || booking.menteeName || '',
      mentorName: booking.mentor?.name || booking.mentorName || '',
      menteeAvatar: booking.mentee?.avatar || '',
      mentorAvatar: booking.mentor?.avatar || '',
    }));
  },

  getAllBookings: async (): Promise<Booking[]> => {
    // Admin function: Get all bookings
    const response = await authenticatedFetch(buildUrl('/api/bookings/admin/all'));

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  trackBookingJoin: async (bookingId: string): Promise<{ success: boolean; joinLink: string; message: string }> => {
    const response = await authenticatedFetch(buildUrl(`/api/bookings/${bookingId}/join`), {
      method: 'POST'
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  getBookingById: async (id: string): Promise<Booking | undefined> => {
    const response = await authenticatedFetch(buildUrl(`/api/bookings/${id}`));

    if (response.status === 404) {
      return undefined;
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  updateBookingStatus: async (id: string, status: BookingStatus, reason?: string): Promise<Booking> => {
    let endpoint = '';
    let body: any = {};

    switch (status) {
      case 'COMPLETED':
        endpoint = `/api/bookings/${id}/complete`;
        break;
      case 'CANCELLED':
        endpoint = `/api/bookings/${id}/cancel`;
        body = { reason };
        break;
      case 'NO_SHOW':
        endpoint = `/api/bookings/${id}/no-show`;
        break;
      default:
        throw new Error(`Cannot update booking to status: ${status}`);
    }

    const response = await authenticatedFetch(buildUrl(endpoint), {
      method: 'PATCH',
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  /**
   * Mark mentor as no-show (mentee reports mentor didn't attend)
   * This creates a claim for admin review, does NOT auto-refund
   */
  markMentorNoShow: async (bookingId: string): Promise<any> => {
    const response = await authenticatedFetch(buildUrl(`/api/bookings/${bookingId}/mentor-no-show`), {
      method: 'PATCH'
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  // Cancel booking as mentee (2-hour rule, quota tracking)
  cancelBooking: async (id: string, reason?: string): Promise<void> => {
    const response = await authenticatedFetch(buildUrl(`/api/bookings/${id}/cancel`), {
      method: 'PATCH',
      body: JSON.stringify({ reason })  // Optional cancellation reason
    });

    if (!response.ok) {
      await handleApiError(response);
    }
  },

  // NEW: Cancel booking as mentor with 6h rule and limit tracking
  cancelBookingAsMentor: async (id: string, reason?: string): Promise<{
    booking: Booking;
    cancellationStats: {
      wasLateCancellation: boolean;
      hoursUntilBooking: number;
      newCount: number;
      remaining: number;
    };
  }> => {
    const response = await authenticatedFetch(buildUrl(`/api/bookings/${id}/cancel-as-mentor`), {
      method: 'POST',
      body: JSON.stringify({ reason })  // ✅ NEW: Send optional reason
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  // NEW: Get mentor cancellation statistics
  getMentorCancellationStats: async (): Promise<{
    cancellationCount: number;
    remaining: number;
    lastCancelAt: string | null;
    canCancel: boolean;
  }> => {
    const response = await authenticatedFetch(buildUrl('/api/bookings/mentor/cancellation-stats'));

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  // NEW: Admin reset mentor cancellation counter
  resetMentorCancellationCount: async (userId: string): Promise<{ success: boolean; message: string }> => {
    const response = await authenticatedFetch(buildUrl(`/api/bookings/admin/reset-mentor-cancellation/${userId}`), {
      method: 'POST'
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  // NEW: Admin reset mentee cancellation counter
  resetMenteeCancellationCount: async (userId: string): Promise<{ success: boolean; message: string }> => {
    const response = await authenticatedFetch(buildUrl(`/api/bookings/admin/reset-mentee-cancellation/${userId}`), {
      method: 'POST'
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  // NEW: Get mentee cancellation stats
  getMenteeCancellationStats: async (): Promise<{ cancellationCount: number; remaining: number; lastCancelAt: Date | null; canCancel: boolean }> => {
    const response = await authenticatedFetch(buildUrl('/api/bookings/mentee/cancellation-stats'), {
      method: 'GET'
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  rescheduleBooking: async (id: string, newDate: string, newStartTime: string, reason?: string): Promise<Booking> => {
    const response = await authenticatedFetch(buildUrl(`/api/bookings/${id}/reschedule`), {
      method: 'PATCH',
      body: JSON.stringify({ newStartTime, reason })  // Backend uses newStartTime and optional reason
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  submitReview: async (bookingId: string, rating: number, comment: string): Promise<void> => {
    const response = await authenticatedFetch(buildUrl(`/api/bookings/${bookingId}/review`), {
      method: 'POST',
      body: JSON.stringify({ rating, review: comment })  // Backend expects 'review' not 'comment'
    });

    if (!response.ok) {
      await handleApiError(response);
    }
  },

  reportDispute: async (bookingId: string, reason: string, description: string): Promise<void> => {
    const response = await authenticatedFetch(buildUrl(`/api/bookings/${bookingId}/dispute`), {
      method: 'POST',
      body: JSON.stringify({ reason, evidence: description })  // Backend expects 'evidence' not 'description'
    });

    if (!response.ok) {
      await handleApiError(response);
    }
  },

  resolveDispute: async (bookingId: string, outcome: string, note: string): Promise<void> => {
    const response = await authenticatedFetch(buildUrl(`/api/bookings/${bookingId}/resolve-dispute`), {
      method: 'PATCH',
      body: JSON.stringify({ outcome, note })
    });

    if (!response.ok) {
      await handleApiError(response);
    }
  },

  // ===== HOMEWORK SYSTEM =====

  getHomework: async (): Promise<Homework[]> => {
    const response = await authenticatedFetch(buildUrl('/api/homework/my'));

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  getAllHomework: async (): Promise<Homework[]> => {
    // Admin function
    const response = await authenticatedFetch(buildUrl('/api/homework/admin/all'));

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  createHomework: async (data: Partial<Homework>): Promise<Homework> => {
    const response = await authenticatedFetch(buildUrl('/api/homework'), {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  submitHomework: async (id: string, submissionUrl: string, submissionNote?: string): Promise<Homework> => {
    const response = await authenticatedFetch(buildUrl(`/api/homework/${id}/submit`), {
      method: 'POST',
      body: JSON.stringify({ submissionUrl, submissionNote })  // Fixed: Added submissionNote support
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  gradeHomework: async (id: string, grade: number, feedback: string): Promise<Homework> => {
    const response = await authenticatedFetch(buildUrl(`/api/homework/${id}/grade`), {
      method: 'POST',
      body: JSON.stringify({ grade, feedback })
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  // Added: Missing homework APIs
  getPendingHomework: async (): Promise<Homework[]> => {
    const response = await authenticatedFetch(buildUrl('/api/homework/pending'));

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  getOverdueHomework: async (): Promise<Homework[]> => {
    const response = await authenticatedFetch(buildUrl('/api/homework/overdue'));

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  getHomeworkStats: async (): Promise<any> => {
    const response = await authenticatedFetch(buildUrl('/api/homework/stats'));

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  getHomeworkById: async (id: string): Promise<Homework> => {
    const response = await authenticatedFetch(buildUrl(`/api/homework/${id}`));

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  updateHomework: async (id: string, data: Partial<Homework>): Promise<Homework> => {
    const response = await authenticatedFetch(buildUrl(`/api/homework/${id}`), {
      method: 'PATCH',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  deleteHomework: async (id: string): Promise<void> => {
    const response = await authenticatedFetch(buildUrl(`/api/homework/${id}`), {
      method: 'DELETE'
    });

    if (!response.ok) {
      await handleApiError(response);
    }
  },

  // ===== PAYOUT SYSTEM (Delegated to V2 Services) =====

  getMentorBalanceDetails: async (mentorId: string) => {
    const response = await authenticatedFetch(buildUrl('/api/payouts/balance'));

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  requestPayout: async (mentorId: string, creditsToWithdraw: number, method: string, accountDetails: string) => {
    const response = await authenticatedFetch(buildUrl('/api/payouts/request'), {
      method: 'POST',
      body: JSON.stringify({ creditsToWithdraw, method })
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  approvePayout: async (payoutId: string, adminId: string, adminNote?: string) => {
    const response = await authenticatedFetch(buildUrl(`/api/payouts/${payoutId}/approve`), {
      method: 'PATCH',
      body: JSON.stringify({ adminNote })  // Backend expects 'adminNote' not 'transactionId'
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  rejectPayout: async (payoutId: string, adminId: string, reason: string) => {
    const response = await authenticatedFetch(buildUrl(`/api/payouts/${payoutId}/reject`), {
      method: 'PATCH',
      body: JSON.stringify({ reason })
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  getPayouts: async (userId?: string): Promise<Payout[]> => {
    const endpoint = userId ? `/api/payouts?userId=${userId}` : '/api/payouts';
    const response = await authenticatedFetch(buildUrl(endpoint));

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  getAllPayouts: async (): Promise<Payout[]> => {
    const response = await authenticatedFetch(buildUrl('/api/payouts/admin/all'));

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  getPayoutById: async (id: string): Promise<Payout | undefined> => {
    const response = await authenticatedFetch(buildUrl(`/api/payouts/${id}`));

    if (response.status === 404) {
      return undefined;
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  // ===== TRANSACTION MANAGEMENT =====

  getUserTransactions: async (userId: string): Promise<Transaction[]> => {
    const response = await authenticatedFetch(buildUrl('/api/users/me/transactions'));

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  getAllTransactions: async (): Promise<Transaction[]> => {
    // Backend endpoint: /api/transactions/admin/all returns ALL transaction types
    // (TOPUP, PAYOUT, REFUND, BOOKING_USE, EARNING, SUBSCRIPTION_*, etc.)
    const response = await authenticatedFetch(buildUrl('/api/transactions/admin/all'));

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  // ===== PROVIDER & REFERRAL SYSTEM =====

  getProviders: async (): Promise<Provider[]> => {
    const response = await authenticatedFetch(buildUrl('/api/providers'));

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  getProviderProfile: async (id: string): Promise<Provider | undefined> => {
    const response = await authenticatedFetch(buildUrl(`/api/providers/${id}`));

    if (response.status === 404) {
      return undefined;
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  getReferrals: async (providerId: string): Promise<Referral[]> => {
    const response = await authenticatedFetch(buildUrl(`/api/providers/${providerId}/referrals`));

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  createReferral: async (providerId: string, referredEmail: string): Promise<Referral> => {
    const response = await authenticatedFetch(buildUrl('/api/providers/referrals'), {
      method: 'POST',
      body: JSON.stringify({ menteeId: referredEmail, menteeName: referredEmail })
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  getProviderCommissions: async (providerId: string): Promise<ProviderCommission[]> => {
    const response = await authenticatedFetch(buildUrl(`/api/providers/${providerId}/commissions`));

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  getProviderLevels: async (): Promise<ProviderLevel[]> => {
    const response = await authenticatedFetch(buildUrl('/api/providers/levels'));

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  getSystemFinancialHealth: async () => {
    const response = await authenticatedFetch(buildUrl('/api/payouts/financial-health'));

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  // ===== SUBSCRIPTION SYSTEM =====

  getSubscriptionPlans: async (): Promise<SubscriptionPlan[]> => {
    const response = await fetch(buildUrl('/api/subscriptions/plans'));

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  getSubscriptionPlansByMentor: async (mentorId: string): Promise<SubscriptionPlan[]> => {
    const response = await fetch(buildUrl(`/api/subscriptions/plans/by-mentor/${mentorId}`));

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  createSubscription: async (data: {
    menteeId: string;
    mentorId: string;
    planId: string;
    paymentMethod: string;
    weeklySlots?: { day: string, time: string }[]; // ✅ FIX: Add weekly slots for automatic booking creation
  }): Promise<{ subscription: Subscription; transaction: Transaction }> => {
    const response = await authenticatedFetch(buildUrl('/api/subscriptions'), {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  getUserSubscriptions: async (userId: string): Promise<Subscription[]> => {
    const response = await authenticatedFetch(buildUrl('/api/subscriptions/my'));

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  getMentorSubscriptions: async (mentorId: string): Promise<Subscription[]> => {
    const response = await authenticatedFetch(buildUrl('/api/subscriptions/mentor/my'));

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  getActiveSubscription: async (mentorId: string): Promise<Subscription | null> => {
    const response = await authenticatedFetch(buildUrl(`/api/subscriptions/active/${mentorId}`));

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  // Added: Missing subscription APIs
  getSubscriptionStats: async (): Promise<any> => {
    const response = await authenticatedFetch(buildUrl('/api/subscriptions/my/stats'));

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  getMentorSubscriptionStats: async (): Promise<any> => {
    const response = await authenticatedFetch(buildUrl('/api/subscriptions/mentor/stats'));

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  updateSubscriptionPlan: async (id: string, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> => {
    const response = await authenticatedFetch(buildUrl(`/api/subscriptions/admin/plans/${id}`), {
      method: 'PATCH',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  createSubscriptionPlan: async (data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> => {
    const response = await authenticatedFetch(buildUrl('/api/subscriptions/admin/plans'), {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  deleteSubscriptionPlan: async (id: string): Promise<void> => {
    const response = await authenticatedFetch(buildUrl(`/api/subscriptions/admin/plans/${id}`), {
      method: 'DELETE'
    });

    if (!response.ok) {
      await handleApiError(response);
    }
  },

  resetSubscriptionQuota: async (subscriptionId: string): Promise<Subscription> => {
    const response = await authenticatedFetch(buildUrl(`/api/subscriptions/admin/${subscriptionId}/reset-quota`), {
      method: 'PATCH'
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  forceRenewSubscription: async (subscriptionId: string): Promise<Subscription> => {
    const response = await authenticatedFetch(buildUrl(`/api/subscriptions/${subscriptionId}/renew`), {
      method: 'PATCH'
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  changeSubscriptionPlan: async (subscriptionId: string, newPlanId: string): Promise<Subscription> => {
    const response = await authenticatedFetch(buildUrl(`/api/subscriptions/admin/${subscriptionId}/change-plan`), {
      method: 'PATCH',
      body: JSON.stringify({ newPlanId })
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  cancelSubscription: async (subscriptionId: string, reason?: string): Promise<Subscription> => {
    const response = await authenticatedFetch(buildUrl(`/api/subscriptions/${subscriptionId}/cancel`), {
      method: 'PATCH',
      body: JSON.stringify({ reason })
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  // ===== USER ADMIN FUNCTIONS =====

  getUsers: async (): Promise<User[]> => {
    const response = await authenticatedFetch(buildUrl('/api/users/admin/all'));

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  deleteUser: async (id: string): Promise<void> => {
    const response = await authenticatedFetch(buildUrl(`/api/users/${id}`), {
      method: 'DELETE'
    });

    if (!response.ok) {
      await handleApiError(response);
    }
  },

  approveUser: async (id: string): Promise<User> => {
    const response = await authenticatedFetch(buildUrl(`/api/users/${id}/approve`), {
      method: 'PATCH'
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  rejectUser: async (id: string, reason: string): Promise<User> => {
    const response = await authenticatedFetch(buildUrl(`/api/users/${id}/reject`), {
      method: 'PATCH',
      body: JSON.stringify({ reason })
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  banUser: async (id: string, reason: string): Promise<User> => {
    const response = await authenticatedFetch(buildUrl(`/api/users/${id}/ban`), {
      method: 'PATCH',
      body: JSON.stringify({ reason })
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  unbanUser: async (id: string): Promise<User> => {
    const response = await authenticatedFetch(buildUrl(`/api/users/${id}/unban`), {
      method: 'PATCH'
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  // ===== ANALYTICS & REPORTING =====

  getAnalyticsDashboard: async () => {
    const response = await authenticatedFetch(buildUrl('/api/analytics/dashboard'));

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  getSystemLogs: async (filters?: {
    action?: string;
    userId?: string;
    targetId?: string;
    targetType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<SystemLog[]> => {
    const params = new URLSearchParams();
    if (filters?.action) params.append('action', filters.action);
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.targetId) params.append('targetId', filters.targetId);
    if (filters?.targetType) params.append('targetType', filters.targetType);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const url = buildUrl('/api/analytics/logs' + (params.toString() ? `?${params.toString()}` : ''));
    const response = await authenticatedFetch(url);

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  getCreditLedger: async (): Promise<SystemCreditLedgerEntry[]> => {
    // TODO: Backend endpoint not implemented yet
    // This should return system credit ledger entries
    // For now, return empty array to prevent errors
    return [];
  },

  getMentorEarnings: async (mentorId: string): Promise<MentorEarning[]> => {
    const response = await authenticatedFetch(buildUrl(`/api/mentors/${mentorId}/earnings`));

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  // ===== SETTINGS & PRICING =====

  getSystemSettings: async (): Promise<SystemSettings> => {
    const response = await fetch(buildUrl('/api/pricing/settings'));

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  updateSettings: async (data: Partial<SystemSettings>): Promise<SystemSettings> => {
    const response = await authenticatedFetch(buildUrl('/api/pricing/admin/settings'), {
      method: 'PATCH',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  getPricingCountries: async (): Promise<PricingCountry[]> => {
    const response = await fetch(buildUrl('/api/pricing/countries'));

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  updatePricingCountry: async (code: string, data: Partial<PricingCountry>): Promise<PricingCountry> => {
    const response = await authenticatedFetch(buildUrl(`/api/pricing/admin/countries/${code}`), {
      method: 'PATCH',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  createPricingCountry: async (data: PricingCountry): Promise<PricingCountry> => {
    const response = await authenticatedFetch(buildUrl('/api/pricing/admin/countries'), {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  getPricingGroups: async (): Promise<PricingGroup[]> => {
    const response = await fetch(buildUrl('/api/pricing/groups'));

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  updatePricingGroup: async (id: string, data: Partial<PricingGroup>): Promise<PricingGroup> => {
    const response = await authenticatedFetch(buildUrl(`/api/pricing/admin/groups/${id}`), {
      method: 'PATCH',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  createPricingGroup: async (data: PricingGroup): Promise<PricingGroup> => {
    const response = await authenticatedFetch(buildUrl('/api/pricing/admin/groups'), {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  // ===== REVENUE & CAC ANALYTICS =====

  getWeeklyRevenue: async (): Promise<WeeklyRevenueResponse> => {
    // TODO: Implement using /api/analytics/revenue with date range
    // Backend endpoint: GET /api/analytics/revenue?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const queryParams = new URLSearchParams({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });

    const response = await authenticatedFetch(buildUrl(`/api/analytics/revenue?${queryParams.toString()}`));
    return await response.json();
  },

  getMonthlyRevenue: async (): Promise<MonthlyRevenueResponse> => {
    // TODO: Implement using /api/analytics/revenue with date range
    // Backend endpoint: GET /api/analytics/revenue?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const queryParams = new URLSearchParams({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });

    const response = await authenticatedFetch(buildUrl(`/api/analytics/revenue?${queryParams.toString()}`));
    return await response.json();
  },

  getCACDashboard: async (): Promise<CACDashboardData> => {
    // TODO: Implement using /api/analytics/cac with date range
    // Backend endpoint: GET /api/analytics/cac?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const queryParams = new URLSearchParams({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });

    const response = await authenticatedFetch(buildUrl(`/api/analytics/cac?${queryParams.toString()}`));
    return await response.json();
  },

  // ===== NOTIFICATIONS =====

  getNotifications: async (userId: string, limit?: number): Promise<Notification[]> => {
    const url = limit 
      ? buildUrl(`/api/notifications?limit=${limit}`)
      : buildUrl('/api/notifications');
    
    const response = await authenticatedFetch(url);

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  getUnreadNotificationCount: async (userId: string): Promise<number> => {
    const response = await authenticatedFetch(buildUrl('/api/notifications/unread-count'));

    if (!response.ok) {
      await handleApiError(response);
    }

    const result = await response.json();
    return result.count || 0;
  },

  markNotificationRead: async (notificationId: string): Promise<void> => {
    const response = await authenticatedFetch(buildUrl(`/api/notifications/${notificationId}/read`), {
      method: 'PATCH'
    });

    if (!response.ok) {
      await handleApiError(response);
    }
  },

  markAllNotificationsRead: async (userId: string): Promise<void> => {
    const response = await authenticatedFetch(buildUrl('/api/notifications/mark-all-read'), {
      method: 'PATCH'
    });

    if (!response.ok) {
      await handleApiError(response);
    }
  },

  getUnreadCount: async (userId: string): Promise<number> => {
    // Get unread MESSAGE count (not notification count)
    const response = await authenticatedFetch(buildUrl('/api/messages/unread-count'));

    if (!response.ok) {
      await handleApiError(response);
    }

    const result = await response.json();
    return result.count || 0;
  },

  // ===== MESSAGING (TODO: Backend implementation needed) =====

  getConversations: async (userId: string): Promise<Conversation[]> => {
    const response = await authenticatedFetch(buildUrl('/api/messages/conversations'));

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  getMessages: async (
    conversationId: string,
    limit?: number,
    cursor?: string
  ): Promise<{ messages: Message[]; hasMore: boolean; nextCursor: string | null }> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (cursor) params.append('cursor', cursor);

    const url = buildUrl(`/api/messages/conversations/${conversationId}/messages${params.toString() ? `?${params}` : ''}`);
    const response = await authenticatedFetch(url);

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  sendMessage: async (receiverId: string, content: string): Promise<Message> => {
    const response = await authenticatedFetch(buildUrl('/api/messages/send'), {
      method: 'POST',
      body: JSON.stringify({ receiverId, content })
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  markAsRead: async (conversationId: string): Promise<void> => {
    const response = await authenticatedFetch(buildUrl(`/api/messages/conversations/${conversationId}/mark-read`), {
      method: 'PATCH'
    });

    if (!response.ok) {
      await handleApiError(response);
    }
  },

  assignConversation: async (conversationId: string): Promise<Conversation> => {
    const response = await authenticatedFetch(buildUrl(`/api/messages/conversations/${conversationId}/assign`), {
      method: 'PUT'
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  // ===== MISSING FUNCTIONS (Compatibility) =====

  getPendingUsers: async (): Promise<User[]> => {
    const response = await authenticatedFetch(buildUrl('/api/users/admin/pending'));

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  uploadFile: async (file: File, category: string = 'avatar'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', category);

    const response = await authenticatedFetchMultipart(buildUrl('/api/upload'), {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    const data = await response.json();
    return data.url;
  },

  logAction: async (action: string, userId: string, details?: any): Promise<void> => {
    const response = await authenticatedFetch(buildUrl('/api/analytics/logs'), {
      method: 'POST',
      body: JSON.stringify({ action, userId, details })
    });

    if (!response.ok) {
      await handleApiError(response);
    }
  },

  getAdminCACStats: async () => {
    // Use the same implementation as getCACDashboard
    return api.getCACDashboard();
  },

  getAdminCreditStats: async (): Promise<{ summary: any; records: any[] }> => {
    // TODO: Backend endpoint NOT implemented yet
    // Required endpoint: GET /api/analytics/credit-stats or /api/admin/credit-stats
    // Should return: { summary: { totalHeld, totalReleased, totalRefunded, pendingBookings }, records: [...] }
    // Temporarily returning mock data to prevent runtime errors
    console.warn('⚠️ getAdminCreditStats: Backend endpoint not implemented, returning mock data');
    return {
      summary: {
        totalHeld: 0,
        totalReleased: 0,
        totalRefunded: 0,
        pendingBookings: 0
      },
      records: []
    };
  },

  calculatePriceDetail: async (mentorId: string, userCountry?: string, duration: number = 30) => {
    // Get mentor localized rate (this returns price for 30 minutes by default)
    const rate = await api.getMentorLocalizedRate(mentorId, userCountry);
    // Calculate price based on duration (base price is for 30 minutes)
    // rate.finalPrice is already for 30 minutes, so multiply by duration/30
    const durationMultiplier = duration / 30;
    const finalPrice = Number((rate.finalPrice * durationMultiplier).toFixed(2));
    
    return {
      ...rate,
      duration,
      finalPrice,
      basePrice: rate.baseRate,
      countryMultiplier: rate.finalPrice / rate.baseRate, // Approximate multiplier
      groupMultiplier: 1.0 // Will be calculated on backend
    };
  },

  updateProviderProfile: async (id: string, data: Partial<Provider>): Promise<Provider> => {
    const response = await authenticatedFetch(buildUrl(`/api/providers/${id}/profile`), {
      method: 'PATCH',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  // ===== FEEDBACK SYSTEM (Session Feedback) =====

  submitFeedback: async (data: {
    bookingId: string;
    rating: number;
    strengths: string;
    improvements: string;
    nextSteps: string;
    notes?: string;
  }): Promise<void> => {
    const response = await authenticatedFetch(buildUrl('/api/feedbacks'), {
      method: 'POST',
      body: JSON.stringify({
        bookingId: data.bookingId,
        rating: data.rating,
        strengths: data.strengths,
        improvements: data.improvements,
        nextSteps: data.nextSteps,
        notes: data.notes || ''
      })
    });

    if (!response.ok) {
      await handleApiError(response);
    }
  },

  getSubmittedFeedbacks: async (params?: { page?: number; limit?: number; menteeId?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.menteeId) queryParams.append('menteeId', params.menteeId);

    const url = buildUrl(`/api/feedbacks/submitted/list${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
    const response = await authenticatedFetch(url);

    if (!response.ok) {
      await handleApiError(response);
    }

    const result = await response.json();
    return result;
  },

  getPendingFeedbacks: async () => {
    const response = await authenticatedFetch(buildUrl(`/api/feedbacks/pending/list`));

    if (!response.ok) {
      await handleApiError(response);
    }

    const result = await response.json();
    return result.data || result;
  },

  getReceivedFeedbacks: async (params?: { page?: number; limit?: number; mentorId?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.mentorId) queryParams.append('mentorId', params.mentorId);

    const url = buildUrl(`/api/feedbacks/received/list${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
    const response = await authenticatedFetch(url);

    if (!response.ok) {
      await handleApiError(response);
    }

    const result = await response.json();
    return result;
  },

  getAllFeedbacks: async (params?: { page?: number; limit?: number; mentorId?: string; menteeId?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.mentorId) queryParams.append('mentorId', params.mentorId);
    if (params?.menteeId) queryParams.append('menteeId', params.menteeId);

    const url = buildUrl(`/api/feedbacks/all/list${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
    const response = await authenticatedFetch(url);

    if (!response.ok) {
      await handleApiError(response);
    }

    const result = await response.json();
    return result;
  },

  getFeedbackStats: async () => {
    const response = await authenticatedFetch(buildUrl('/api/feedbacks/stats/summary'));

    if (!response.ok) {
      await handleApiError(response);
    }

    const result = await response.json();
    return result.data || result;
  },

  getOverdueFeedbacks: async () => {
    const response = await authenticatedFetch(buildUrl('/api/feedbacks/overdue/list'));

    if (!response.ok) {
      await handleApiError(response);
    }

    const result = await response.json();
    return result.data || result;
  },

  getFeedbackById: async (id: string): Promise<any> => {
    const response = await authenticatedFetch(buildUrl(`/api/feedbacks/${id}`));

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  // ===== ADMIN FUNCTIONS =====

  getLogs: async (): Promise<SystemLog[]> => {
    return api.getSystemLogs();
  },

  markPayoutPaid: async (payoutId: string, evidenceFile: string): Promise<void> => {
    const response = await authenticatedFetch(buildUrl(`/api/payouts/${payoutId}/mark-paid`), {
      method: 'PATCH',
      body: JSON.stringify({ evidenceFile })  // Backend expects 'evidenceFile' not 'transactionId'
    });

    if (!response.ok) {
      await handleApiError(response);
    }
  },

  batchSavePricing: async (data: any): Promise<void> => {
    const response = await authenticatedFetch(buildUrl('/api/pricing/admin/batch'), {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      await handleApiError(response);
    }
  },

  addPricingCountry: async (data: PricingCountry): Promise<PricingCountry> => {
    return api.createPricingCountry(data);
  },

  deletePricingCountry: async (code: string): Promise<void> => {
    const response = await authenticatedFetch(buildUrl(`/api/pricing/admin/countries/${code}`), {
      method: 'DELETE'
    });

    if (!response.ok) {
      await handleApiError(response);
    }
  },

  addPricingGroup: async (data: PricingGroup): Promise<PricingGroup> => {
    return api.createPricingGroup(data);
  },

  deletePricingGroup: async (id: string): Promise<void> => {
    const response = await authenticatedFetch(buildUrl(`/api/pricing/admin/groups/${id}`), {
      method: 'DELETE'
    });

    if (!response.ok) {
      await handleApiError(response);
    }
  },

  updateProviderLevel: async (id: string, data: Partial<ProviderLevel>): Promise<ProviderLevel> => {
    const response = await authenticatedFetch(buildUrl(`/api/providers/levels/${id}`), {
      method: 'PATCH',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  addProviderLevel: async (data: Partial<ProviderLevel>): Promise<ProviderLevel> => {
    const response = await authenticatedFetch(buildUrl('/api/providers/levels'), {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  deleteProviderLevel: async (id: string): Promise<void> => {
    const response = await authenticatedFetch(buildUrl(`/api/providers/levels/${id}`), {
      method: 'DELETE'
    });

    if (!response.ok) {
      await handleApiError(response);
    }
  },

  getAllProviderCommissions: async (status?: string): Promise<any[]> => {
    const url = status
      ? buildUrl(`/api/providers/admin/commissions?status=${status}`)
      : buildUrl('/api/providers/admin/commissions');

    const response = await authenticatedFetch(url);

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  markCommissionPaid: async (commissionId: string): Promise<any> => {
    const response = await authenticatedFetch(
      buildUrl(`/api/providers/admin/commissions/${commissionId}/mark-paid`),
      {
        method: 'PATCH'
      }
    );

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  addSubscriptionPlan: async (data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> => {
    return api.createSubscriptionPlan(data);
  },

  updateUserConfig: async (userId: string, config: any): Promise<User> => {
    const response = await authenticatedFetch(buildUrl(`/api/users/${userId}/config`), {
      method: 'PATCH',
      body: JSON.stringify(config)
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  updateUserStatus: async (userId: string, status: string): Promise<User> => {
    const response = await authenticatedFetch(buildUrl(`/api/users/${userId}/status`), {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  updateUser: async (userId: string, data: Partial<User>): Promise<User> => {
    const response = await authenticatedFetch(buildUrl(`/api/users/${userId}`), {
      method: 'PATCH',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  },

  createUser: async (data: any): Promise<User> => {
    const response = await authenticatedFetch(buildUrl('/api/users/admin/create'), {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create user');
    }

    return await response.json();
  },

  resetPassword: async (userId: string, newPassword: string): Promise<void> => {
    const response = await authenticatedFetch(buildUrl(`/api/users/${userId}/reset-password`), {
      method: 'PATCH',
      body: JSON.stringify({ newPassword })
    });

    if (!response.ok) {
      await handleApiError(response);
    }
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    const response = await authenticatedFetch(buildUrl('/api/users/me/password'), {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword })
    });

    if (!response.ok) {
      await handleApiError(response);
    }
  },

  // BUG FIX #1: Get user's booking history (admin endpoint)
  getAdminUserBookings: async (userId: string, page: number = 1, limit: number = 10) => {
    const response = await authenticatedFetch(
      buildUrl(`/api/admin/users/${userId}/bookings?page=${page}&limit=${limit}`)
    );
    if (!response.ok) {
      await handleApiError(response);
    }
    return response.json();
  },

  // ===== LOCAL TOPUP SYSTEM =====

  // Get all active credit packages
  getLocalTopupPackages: async (): Promise<any[]> => {
    const response = await fetch(buildUrl('/api/local-topup/packages'));
    if (!response.ok) {
      await handleApiError(response);
    }
    return response.json();
  },

  // Get all active payment methods
  getLocalTopupPaymentMethods: async (): Promise<any[]> => {
    const response = await fetch(buildUrl('/api/local-topup/payment-methods'));
    if (!response.ok) {
      await handleApiError(response);
    }
    return response.json();
  },

  // Create new topup transaction
  createLocalTopup: async (data: {
    packageId?: string;
    creditAmount?: number;
    paymentMethodId: string;
    transactionCode: string;
  }): Promise<any> => {
    const response = await authenticatedFetch(buildUrl('/api/local-topup/create'), {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      await handleApiError(response);
    }
    return response.json();
  },

  // Get current user's topup history
  getMyTopupHistory: async (limit: number = 20): Promise<any[]> => {
    const response = await authenticatedFetch(
      buildUrl(`/api/local-topup/my-history?limit=${limit}`)
    );
    if (!response.ok) {
      await handleApiError(response);
    }
    return response.json();
  },

  // Get current user's topup limits
  getMyTopupLimits: async (): Promise<any> => {
    const response = await authenticatedFetch(buildUrl('/api/local-topup/my-limits'));
    if (!response.ok) {
      await handleApiError(response);
    }
    return response.json();
  },

  // ===== ADMIN: LOCAL TOPUP MANAGEMENT =====

  // Get daily topup report
  getAdminTopupDailyReport: async (date?: string): Promise<any> => {
    const url = date 
      ? buildUrl(`/api/admin/local-topup/daily-report?date=${date}`)
      : buildUrl('/api/admin/local-topup/daily-report');
    const response = await authenticatedFetch(url);
    if (!response.ok) {
      await handleApiError(response);
    }
    return response.json();
  },

  // Get all topup transactions with filters
  getAdminTopupTransactions: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    flaggedOnly?: boolean;
    userId?: string;
  }): Promise<any> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.status) query.append('status', params.status);
    if (params?.flaggedOnly) query.append('flaggedOnly', 'true');
    if (params?.userId) query.append('userId', params.userId);

    const response = await authenticatedFetch(
      buildUrl(`/api/admin/local-topup/transactions?${query}`)
    );
    if (!response.ok) {
      await handleApiError(response);
    }
    return response.json();
  },

  // Mark topup as fraud and reverse credits
  markTopupAsFraud: async (topupId: string, reason: string): Promise<void> => {
    const response = await authenticatedFetch(
      buildUrl(`/api/admin/local-topup/${topupId}/mark-fraud`),
      {
        method: 'POST',
        body: JSON.stringify({ reason })
      }
    );
    if (!response.ok) {
      await handleApiError(response);
    }
  },

  // Unflag topup (if marked by mistake)
  unflagTopup: async (topupId: string): Promise<void> => {
    const response = await authenticatedFetch(
      buildUrl(`/api/admin/local-topup/${topupId}/unflag`),
      {
        method: 'POST'
      }
    );
    if (!response.ok) {
      await handleApiError(response);
    }
  },

  // ===== ADMIN: PAYMENT METHOD CRUD =====

  getAdminPaymentMethods: async (): Promise<any[]> => {
    const response = await authenticatedFetch(
      buildUrl('/api/admin/local-topup/payment-methods')
    );
    if (!response.ok) {
      await handleApiError(response);
    }
    return response.json();
  },

  createPaymentMethod: async (data: any): Promise<any> => {
    const response = await authenticatedFetch(
      buildUrl('/api/admin/local-topup/payment-methods'),
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    );
    if (!response.ok) {
      await handleApiError(response);
    }
    return response.json();
  },

  updatePaymentMethod: async (id: string, data: any): Promise<any> => {
    const response = await authenticatedFetch(
      buildUrl(`/api/admin/local-topup/payment-methods/${id}`),
      {
        method: 'PATCH',
        body: JSON.stringify(data)
      }
    );
    if (!response.ok) {
      await handleApiError(response);
    }
    return response.json();
  },

  deletePaymentMethod: async (id: string): Promise<void> => {
    const response = await authenticatedFetch(
      buildUrl(`/api/admin/local-topup/payment-methods/${id}`),
      {
        method: 'DELETE'
      }
    );
    if (!response.ok) {
      await handleApiError(response);
    }
  },

  uploadQRCode: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'qr-code');

    const response = await authenticatedFetchMultipart(buildUrl('/api/upload'), {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return response.json();
  },

  // ===== ADMIN: CREDIT PACKAGE CRUD =====

  getAdminCreditPackages: async (): Promise<any[]> => {
    const response = await authenticatedFetch(
      buildUrl('/api/admin/local-topup/packages')
    );
    if (!response.ok) {
      await handleApiError(response);
    }
    return response.json();
  },

  createCreditPackage: async (data: any): Promise<any> => {
    const response = await authenticatedFetch(
      buildUrl('/api/admin/local-topup/packages'),
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    );
    if (!response.ok) {
      await handleApiError(response);
    }
    return response.json();
  },

  updateCreditPackage: async (id: string, data: any): Promise<any> => {
    const response = await authenticatedFetch(
      buildUrl(`/api/admin/local-topup/packages/${id}`),
      {
        method: 'PATCH',
        body: JSON.stringify(data)
      }
    );
    if (!response.ok) {
      await handleApiError(response);
    }
    return response.json();
  },

  deleteCreditPackage: async (id: string): Promise<void> => {
    const response = await authenticatedFetch(
      buildUrl(`/api/admin/local-topup/packages/${id}`),
      {
        method: 'DELETE'
      }
    );
    if (!response.ok) {
      await handleApiError(response);
    }
  },
};

// Named exports for backward compatibility
export const submitFeedback = api.submitFeedback;
export const getSubmittedFeedbacks = api.getSubmittedFeedbacks;
export const getPendingFeedbacks = api.getPendingFeedbacks;
export const getReceivedFeedbacks = api.getReceivedFeedbacks;
export const getAllFeedbacks = api.getAllFeedbacks;
export const getFeedbackStats = api.getFeedbackStats;
export const getOverdueFeedbacks = api.getOverdueFeedbacks;
