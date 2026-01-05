
/**
 * Chuyển đổi một thời điểm cụ thể sang chuỗi hiển thị theo múi giờ chỉ định
 */
export const formatInTimezone = (date: Date | string, timezone: string, options: Intl.DateTimeFormatOptions = {}): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    ...options,
    timeZone: timezone
  });
};

/**
 * Chuyển đổi một Date object sang Date object mới "giả lập" thời gian tại múi giờ đó
 */
export const convertTimezone = (date: Date | string, toTimezone: string): Date => {
  const d = typeof date === 'string' ? new Date(date) : date;
  try {
    const invdate = new Date(d.toLocaleString('en-US', { timeZone: toTimezone }));
    return invdate;
  } catch (e) {
    console.warn(`Invalid timezone: ${toTimezone}, falling back to UTC`);
    return new Date(d);
  }
};

/**
 * ✅ UPDATED: Get timezone by country code
 * NOTE: This is now a simplified fallback. 
 * Primary source should be from API: /api/pricing/countries which includes timezone
 * Frontend should use timezone from API response instead of this hardcoded mapping
 */
export const getTimezoneByCountry = (country: string): string => {
  if (!country) return Intl.DateTimeFormat().resolvedOptions().timeZone;

  // ✅ Synced with backend COUNTRY_PRICING (15 countries)
  const mapping: Record<string, string> = {
    // ISO Codes
    'VN': 'Asia/Ho_Chi_Minh',
    'IN': 'Asia/Kolkata',
    'PH': 'Asia/Manila',
    'ID': 'Asia/Jakarta',
    'TH': 'Asia/Bangkok',
    'CN': 'Asia/Shanghai',
    'JP': 'Asia/Tokyo',
    'KR': 'Asia/Seoul',
    'US': 'America/New_York',
    'GB': 'Europe/London',
    'DE': 'Europe/Berlin',
    'FR': 'Europe/Paris',
    'AU': 'Australia/Sydney',
    'CA': 'America/Toronto',
    'SG': 'Asia/Singapore',
    // Aliases
    'UK': 'Europe/London',
    'USA': 'America/New_York',
  };

  return mapping[country] || mapping[country?.toUpperCase()] || Intl.DateTimeFormat().resolvedOptions().timeZone;
};

// ✅ FIX BUG #11: Valid timezones list for validation
export const VALID_TIMEZONES = [
    'Asia/Ho_Chi_Minh',
    'Asia/Tokyo',
    'Asia/Seoul',
    'Asia/Shanghai',
    'Asia/Singapore',
    'America/New_York',
    'America/Los_Angeles',
    'America/Chicago',
    'America/Toronto',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Australia/Sydney',
    'Pacific/Auckland'
];

/**
 * ✅ FIX BUG #11: Validate timezone string
 */
export const isValidTimezone = (timezone: string): boolean => {
    return VALID_TIMEZONES.includes(timezone);
};

/**
 * ✅ FIX BUG #11: Validate and normalize timezone
 * Returns valid timezone or throws error
 */
export const validateTimezone = (timezone: string | undefined, fallbackCountry: string = 'US'): string => {
    if (!timezone) {
        return getTimezoneByCountry(fallbackCountry);
    }

    if (!isValidTimezone(timezone)) {
        throw new Error(`Invalid timezone: ${timezone}. Must be one of: ${VALID_TIMEZONES.join(', ')}`);
    }

    return timezone;
};

/**
 * Tạo một đối tượng Date (UTC) từ thông tin ngày/giờ địa phương của một múi giờ cụ thể
 */
export const createAbsoluteDate = (baseDate: Date, timeStr: string, fromTimezone: string): Date => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth() + 1;
  const day = baseDate.getDate();

  const localDateTimeString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: fromTimezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false
    });

    const parts = formatter.formatToParts(new Date(localDateTimeString));
    const map: any = {};
    parts.forEach(p => map[p.type] = p.value);
    
    const dtInTz = new Date(`${map.year}-${map.month.padStart(2, '0')}-${map.day.padStart(2, '0')}T${map.hour.padStart(2, '0')}:${map.minute.padStart(2, '0')}:${map.second.padStart(2, '0')}`);
    const diff = new Date(localDateTimeString).getTime() - dtInTz.getTime();
    
    return new Date(new Date(localDateTimeString).getTime() + diff);
  } catch (e) {
    console.error("Error creating absolute date with timezone:", fromTimezone, e);
    return new Date(localDateTimeString);
  }
};
