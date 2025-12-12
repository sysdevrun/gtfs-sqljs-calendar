// GTFS Calendar (calendar.txt)
export interface GTFSCalendar {
  service_id: string;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  start_date: string; // YYYYMMDD format
  end_date: string; // YYYYMMDD format
}

// GTFS Calendar Dates (calendar_dates.txt) - Exceptions
export interface GTFSCalendarDate {
  service_id: string;
  date: string; // YYYYMMDD format
  exception_type: 1 | 2; // 1 = service added, 2 = service removed
}

// GTFS Trip (trips.txt)
export interface GTFSTrip {
  route_id: string;
  service_id: string;
  trip_id: string;
  trip_headsign?: string;
  trip_short_name?: string;
  direction_id?: 0 | 1;
  block_id?: string;
  shape_id?: string;
  wheelchair_accessible?: 0 | 1 | 2;
  bikes_allowed?: 0 | 1 | 2;
}

// GTFS Route (routes.txt)
export interface GTFSRoute {
  route_id: string;
  agency_id?: string;
  route_short_name?: string;
  route_long_name?: string;
  route_desc?: string;
  route_type: number;
  route_url?: string;
  route_color?: string;
  route_text_color?: string;
  route_sort_order?: number;
}

// Parsed GTFS Data
export interface GTFSData {
  calendars: GTFSCalendar[];
  calendarDates: GTFSCalendarDate[];
  trips: GTFSTrip[];
  routes: GTFSRoute[];
}

// Calendar status for a specific day
export interface CalendarDayStatus {
  service_id: string;
  isActive: boolean;
  isException: boolean;
  exceptionType?: 'added' | 'removed';
  calendar?: GTFSCalendar;
}

// Trip with route info for display
export interface TripWithRoute extends GTFSTrip {
  route?: GTFSRoute;
}

// Day info with all active services and trips
export interface DayInfo {
  date: Date;
  dateString: string; // YYYYMMDD format
  baseCalendars: CalendarDayStatus[]; // Calendars matching by regular rules (before exceptions)
  activeCalendars: CalendarDayStatus[];
  excludedCalendars: CalendarDayStatus[];
  activeTrips: TripWithRoute[];
}
