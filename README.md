# GTFS Calendar Explorer

A React TypeScript application that helps you explore GTFS (General Transit Feed Specification) calendar data locally in your browser.

## Features

- **Upload GTFS ZIP files** - Drag and drop or browse to upload your GTFS data
- **Parse calendar data** - Automatically parses `calendar.txt`, `calendar_dates.txt`, `trips.txt`, and `routes.txt`
- **Date selection** - Interactive calendar to select any date within the GTFS data range
- **Active calendars** - Shows which service calendars are active on the selected day
- **Calendar exceptions** - Displays calendars added or removed via `calendar_dates.txt`
- **Trip listing** - Lists all trips running on the selected day, grouped by route
- **Search and filter** - Search trips by ID, route, or headsign
- **100% local** - All processing happens in your browser, no data is uploaded to any server

## Understanding GTFS Calendars

GTFS defines service patterns using two files:

### calendar.txt
Defines regular service patterns with:
- `service_id` - Unique identifier for the service
- Days of week (`monday`, `tuesday`, etc.) - 1 if service runs, 0 if not
- `start_date` and `end_date` - Date range when this pattern is valid

### calendar_dates.txt
Defines exceptions to the regular patterns:
- `service_id` - Which service is affected
- `date` - The specific date
- `exception_type`:
  - `1` = Service **added** for this date
  - `2` = Service **removed** for this date

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

This project is configured for automatic deployment to GitHub Pages using GitHub Actions. Any push to any branch will trigger a deployment.

## Tech Stack

- React 18
- TypeScript
- Vite
- JSZip - For parsing ZIP files
- date-fns - For date manipulation
