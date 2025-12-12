import { format, parse, eachDayOfInterval, getDay, isWithinInterval } from 'date-fns';
import type {
  GTFSData,
  GTFSCalendar,
  CalendarDayStatus,
  TripWithRoute,
  DayInfo,
} from '../types/gtfs';

// Day of week mapping (getDay returns 0=Sunday, 1=Monday, etc.)
const dayOfWeekKeys: (keyof GTFSCalendar)[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

// Convert YYYYMMDD string to Date
export function parseGTFSDate(dateString: string): Date {
  return parse(dateString, 'yyyyMMdd', new Date());
}

// Convert Date to YYYYMMDD string
export function formatGTFSDate(date: Date): string {
  return format(date, 'yyyyMMdd');
}

// Check if a calendar is active on a given day of week
function isCalendarActiveOnDayOfWeek(calendar: GTFSCalendar, date: Date): boolean {
  const dayOfWeek = getDay(date);
  const dayKey = dayOfWeekKeys[dayOfWeek];
  return calendar[dayKey] as boolean;
}

// Check if a date is within calendar's date range
function isDateInCalendarRange(calendar: GTFSCalendar, date: Date): boolean {
  const startDate = parseGTFSDate(calendar.start_date);
  const endDate = parseGTFSDate(calendar.end_date);
  return isWithinInterval(date, { start: startDate, end: endDate });
}

// Get calendar status for a specific date
export function getCalendarStatusForDate(
  gtfsData: GTFSData,
  date: Date
): { active: CalendarDayStatus[]; excluded: CalendarDayStatus[] } {
  const dateString = formatGTFSDate(date);
  const active: CalendarDayStatus[] = [];
  const excluded: CalendarDayStatus[] = [];

  // Track service IDs that are added via exceptions (not in calendar.txt)
  const addedServiceIds = new Set<string>();

  // First, check calendar.txt for regular services
  for (const calendar of gtfsData.calendars) {
    const isInRange = isDateInCalendarRange(calendar, date);
    const isActiveDay = isCalendarActiveOnDayOfWeek(calendar, date);
    const baseActive = isInRange && isActiveDay;

    // Check for exceptions in calendar_dates.txt
    const exception = gtfsData.calendarDates.find(
      (cd) => cd.service_id === calendar.service_id && cd.date === dateString
    );

    if (exception) {
      if (exception.exception_type === 1) {
        // Service added for this date
        active.push({
          service_id: calendar.service_id,
          isActive: true,
          isException: true,
          exceptionType: 'added',
          calendar,
        });
      } else if (exception.exception_type === 2) {
        // Service removed for this date
        if (baseActive) {
          excluded.push({
            service_id: calendar.service_id,
            isActive: false,
            isException: true,
            exceptionType: 'removed',
            calendar,
          });
        }
      }
    } else if (baseActive) {
      // No exception, use regular calendar
      active.push({
        service_id: calendar.service_id,
        isActive: true,
        isException: false,
        calendar,
      });
    }
  }

  // Check for service IDs in calendar_dates.txt that don't exist in calendar.txt
  // These are services defined only by exceptions
  const calendarServiceIds = new Set(gtfsData.calendars.map((c) => c.service_id));

  for (const calendarDate of gtfsData.calendarDates) {
    if (calendarDate.date !== dateString) continue;
    if (calendarServiceIds.has(calendarDate.service_id)) continue;

    if (calendarDate.exception_type === 1) {
      addedServiceIds.add(calendarDate.service_id);
      active.push({
        service_id: calendarDate.service_id,
        isActive: true,
        isException: true,
        exceptionType: 'added',
      });
    }
  }

  return { active, excluded };
}

// Get all active service IDs for a date
export function getActiveServiceIds(gtfsData: GTFSData, date: Date): Set<string> {
  const { active } = getCalendarStatusForDate(gtfsData, date);
  return new Set(active.map((c) => c.service_id));
}

// Get trips for active services on a date
export function getTripsForDate(gtfsData: GTFSData, date: Date): TripWithRoute[] {
  const activeServiceIds = getActiveServiceIds(gtfsData, date);

  // Create route lookup map
  const routeMap = new Map(gtfsData.routes.map((r) => [r.route_id, r]));

  return gtfsData.trips
    .filter((trip) => activeServiceIds.has(trip.service_id))
    .map((trip) => ({
      ...trip,
      route: routeMap.get(trip.route_id),
    }));
}

// Get calendars that match by regular rules (date range + day of week), ignoring exceptions
export function getBaseCalendarsForDate(
  gtfsData: GTFSData,
  date: Date
): CalendarDayStatus[] {
  const baseCalendars: CalendarDayStatus[] = [];

  for (const calendar of gtfsData.calendars) {
    const isInRange = isDateInCalendarRange(calendar, date);
    const isActiveDay = isCalendarActiveOnDayOfWeek(calendar, date);

    if (isInRange && isActiveDay) {
      baseCalendars.push({
        service_id: calendar.service_id,
        isActive: true,
        isException: false,
        calendar,
      });
    }
  }

  return baseCalendars;
}

// Get complete day info
export function getDayInfo(gtfsData: GTFSData, date: Date): DayInfo {
  const { active, excluded } = getCalendarStatusForDate(gtfsData, date);
  const baseCalendars = getBaseCalendarsForDate(gtfsData, date);
  const activeTrips = getTripsForDate(gtfsData, date);

  return {
    date,
    dateString: formatGTFSDate(date),
    baseCalendars,
    activeCalendars: active,
    excludedCalendars: excluded,
    activeTrips,
  };
}

// Get date range from GTFS data
export function getDateRange(gtfsData: GTFSData): { start: Date; end: Date } | null {
  if (gtfsData.calendars.length === 0 && gtfsData.calendarDates.length === 0) {
    return null;
  }

  let minDate: Date | null = null;
  let maxDate: Date | null = null;

  // Check calendar.txt
  for (const calendar of gtfsData.calendars) {
    const startDate = parseGTFSDate(calendar.start_date);
    const endDate = parseGTFSDate(calendar.end_date);

    if (!minDate || startDate < minDate) minDate = startDate;
    if (!maxDate || endDate > maxDate) maxDate = endDate;
  }

  // Check calendar_dates.txt
  for (const calendarDate of gtfsData.calendarDates) {
    const date = parseGTFSDate(calendarDate.date);
    if (!minDate || date < minDate) minDate = date;
    if (!maxDate || date > maxDate) maxDate = date;
  }

  if (!minDate || !maxDate) return null;

  return { start: minDate, end: maxDate };
}

// Get all dates in GTFS data range starting from today
export function getAvailableDates(gtfsData: GTFSData): Date[] {
  const range = getDateRange(gtfsData);
  if (!range) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start from today or range start, whichever is later
  const startDate = today > range.start ? today : range.start;

  if (startDate > range.end) return [];

  return eachDayOfInterval({ start: startDate, end: range.end });
}

// Get service summary stats
export function getServiceStats(gtfsData: GTFSData) {
  return {
    totalCalendars: gtfsData.calendars.length,
    totalExceptions: gtfsData.calendarDates.length,
    totalTrips: gtfsData.trips.length,
    totalRoutes: gtfsData.routes.length,
    uniqueServiceIds: new Set([
      ...gtfsData.calendars.map((c) => c.service_id),
      ...gtfsData.calendarDates.map((cd) => cd.service_id),
    ]).size,
  };
}
