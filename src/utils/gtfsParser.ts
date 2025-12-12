import JSZip from 'jszip';
import type {
  GTFSCalendar,
  GTFSCalendarDate,
  GTFSTrip,
  GTFSRoute,
  GTFSData,
} from '../types/gtfs';

// Parse CSV text into array of objects
function parseCSV<T>(csvText: string): T[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const results: T[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;

    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header.trim()] = values[index]?.trim() ?? '';
    });
    results.push(obj as T);
  }

  return results;
}

// Parse a single CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);

  return result;
}

// Parse calendar.txt
function parseCalendars(csvText: string): GTFSCalendar[] {
  const raw = parseCSV<Record<string, string>>(csvText);
  return raw.map((row) => ({
    service_id: row.service_id,
    monday: row.monday === '1',
    tuesday: row.tuesday === '1',
    wednesday: row.wednesday === '1',
    thursday: row.thursday === '1',
    friday: row.friday === '1',
    saturday: row.saturday === '1',
    sunday: row.sunday === '1',
    start_date: row.start_date,
    end_date: row.end_date,
  }));
}

// Parse calendar_dates.txt
function parseCalendarDates(csvText: string): GTFSCalendarDate[] {
  const raw = parseCSV<Record<string, string>>(csvText);
  return raw.map((row) => ({
    service_id: row.service_id,
    date: row.date,
    exception_type: parseInt(row.exception_type, 10) as 1 | 2,
  }));
}

// Parse trips.txt
function parseTrips(csvText: string): GTFSTrip[] {
  const raw = parseCSV<Record<string, string>>(csvText);
  return raw.map((row) => ({
    route_id: row.route_id,
    service_id: row.service_id,
    trip_id: row.trip_id,
    trip_headsign: row.trip_headsign || undefined,
    trip_short_name: row.trip_short_name || undefined,
    direction_id: row.direction_id ? (parseInt(row.direction_id, 10) as 0 | 1) : undefined,
    block_id: row.block_id || undefined,
    shape_id: row.shape_id || undefined,
  }));
}

// Parse routes.txt
function parseRoutes(csvText: string): GTFSRoute[] {
  const raw = parseCSV<Record<string, string>>(csvText);
  return raw.map((row) => ({
    route_id: row.route_id,
    agency_id: row.agency_id || undefined,
    route_short_name: row.route_short_name || undefined,
    route_long_name: row.route_long_name || undefined,
    route_desc: row.route_desc || undefined,
    route_type: parseInt(row.route_type, 10),
    route_url: row.route_url || undefined,
    route_color: row.route_color || undefined,
    route_text_color: row.route_text_color || undefined,
  }));
}

// Main function to parse GTFS zip file
export async function parseGTFSZip(file: File): Promise<GTFSData> {
  const zip = new JSZip();
  const contents = await zip.loadAsync(file);

  // Initialize empty data
  const data: GTFSData = {
    calendars: [],
    calendarDates: [],
    trips: [],
    routes: [],
  };

  // Parse calendar.txt if exists
  const calendarFile = contents.file('calendar.txt');
  if (calendarFile) {
    const csvText = await calendarFile.async('text');
    data.calendars = parseCalendars(csvText);
  }

  // Parse calendar_dates.txt if exists
  const calendarDatesFile = contents.file('calendar_dates.txt');
  if (calendarDatesFile) {
    const csvText = await calendarDatesFile.async('text');
    data.calendarDates = parseCalendarDates(csvText);
  }

  // Parse trips.txt if exists
  const tripsFile = contents.file('trips.txt');
  if (tripsFile) {
    const csvText = await tripsFile.async('text');
    data.trips = parseTrips(csvText);
  }

  // Parse routes.txt if exists
  const routesFile = contents.file('routes.txt');
  if (routesFile) {
    const csvText = await routesFile.async('text');
    data.routes = parseRoutes(csvText);
  }

  return data;
}

// Get list of files in GTFS zip
export async function listGTFSFiles(file: File): Promise<string[]> {
  const zip = new JSZip();
  const contents = await zip.loadAsync(file);
  return Object.keys(contents.files).filter((name) => !contents.files[name].dir);
}
