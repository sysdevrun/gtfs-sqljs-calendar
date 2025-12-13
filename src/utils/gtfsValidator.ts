import type { GTFSData } from '../types/gtfs';

export interface ValidationIssue {
  type: 'error' | 'warning';
  file: string;
  field: string;
  message: string;
  duplicates: string[];
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  stats: {
    tripsChecked: number;
    calendarsChecked: number;
    calendarDatesChecked: number;
  };
}

// Validate GTFS data for duplicates according to GTFS spec
export function validateGTFSData(gtfsData: GTFSData): ValidationResult {
  const issues: ValidationIssue[] = [];

  // Check trips.txt - trip_id must be unique
  const tripIds = gtfsData.trips.map((t) => t.trip_id);
  const duplicateTripIds = findDuplicates(tripIds);
  if (duplicateTripIds.length > 0) {
    issues.push({
      type: 'error',
      file: 'trips.txt',
      field: 'trip_id',
      message: `Found ${duplicateTripIds.length} duplicate trip_id value(s)`,
      duplicates: duplicateTripIds,
    });
  }

  // Check calendar.txt - service_id must be unique
  const calendarServiceIds = gtfsData.calendars.map((c) => c.service_id);
  const duplicateCalendarServiceIds = findDuplicates(calendarServiceIds);
  if (duplicateCalendarServiceIds.length > 0) {
    issues.push({
      type: 'error',
      file: 'calendar.txt',
      field: 'service_id',
      message: `Found ${duplicateCalendarServiceIds.length} duplicate service_id value(s)`,
      duplicates: duplicateCalendarServiceIds,
    });
  }

  // Check calendar_dates.txt - combination of service_id + date must be unique
  const calendarDateKeys = gtfsData.calendarDates.map(
    (cd) => `${cd.service_id}|${cd.date}`
  );
  const duplicateCalendarDateKeys = findDuplicates(calendarDateKeys);
  if (duplicateCalendarDateKeys.length > 0) {
    issues.push({
      type: 'error',
      file: 'calendar_dates.txt',
      field: 'service_id + date',
      message: `Found ${duplicateCalendarDateKeys.length} duplicate service_id + date combination(s)`,
      duplicates: duplicateCalendarDateKeys.map((key) => {
        const [serviceId, date] = key.split('|');
        return `service_id="${serviceId}", date="${date}"`;
      }),
    });
  }

  return {
    isValid: issues.length === 0,
    issues,
    stats: {
      tripsChecked: gtfsData.trips.length,
      calendarsChecked: gtfsData.calendars.length,
      calendarDatesChecked: gtfsData.calendarDates.length,
    },
  };
}

// Find duplicate values in an array
function findDuplicates(arr: string[]): string[] {
  const seen = new Map<string, number>();
  const duplicates: string[] = [];

  for (const item of arr) {
    const count = seen.get(item) || 0;
    seen.set(item, count + 1);
  }

  for (const [item, count] of seen) {
    if (count > 1) {
      duplicates.push(item);
    }
  }

  return duplicates;
}
