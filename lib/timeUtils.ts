
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
 * Lấy danh sách các múi giờ khả dụng dựa trên mã quốc gia (ISO) hoặc tên quốc gia
 */
export const getTimezoneByCountry = (country: string): string => {
  if (!country) return Intl.DateTimeFormat().resolvedOptions().timeZone;

  const mapping: Record<string, string> = {
    // ISO Codes
    'VN': 'Asia/Ho_Chi_Minh',
    'JP': 'Asia/Tokyo',
    'KR': 'Asia/Seoul',
    'CN': 'Asia/Shanghai',
    'US': 'America/New_York',
    'GB': 'Europe/London',
    'UK': 'Europe/London',
    'SG': 'Asia/Singapore',
    'AU': 'Australia/Sydney',
    'FR': 'Europe/Paris',
    'DE': 'Europe/Berlin',
    'CA': 'America/Toronto',
    // Full Names
    'Vietnam': 'Asia/Ho_Chi_Minh',
    'Japan': 'Asia/Tokyo',
    'South Korea': 'Asia/Seoul',
    'China': 'Asia/Shanghai',
    'United States': 'America/New_York',
    'USA': 'America/New_York',
    'United Kingdom': 'Europe/London',
    'Singapore': 'Asia/Singapore',
    'Australia': 'Australia/Sydney',
    'France': 'Europe/Paris',
    'Germany': 'Europe/Berlin',
    'Canada': 'America/Toronto'
  };

  return mapping[country] || mapping[country.toUpperCase()] || Intl.DateTimeFormat().resolvedOptions().timeZone;
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
