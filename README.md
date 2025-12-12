# GTFS Calendar Explorer

A React TypeScript application that helps you explore GTFS (General Transit Feed Specification) calendar data locally in your browser. Understand which transit trips run on any given day by analyzing calendar patterns and exceptions.

**[Live Demo](https://sysdevrun.github.io/gtfs-sqljs-calendar/)**

## What does this tool do?

Transit agencies publish their schedules in GTFS format, which includes complex calendar rules defining when services operate. This tool helps you:

1. **Upload a GTFS ZIP file** from any transit agency
2. **Select a date** to see what's running
3. **View active calendars** - which service patterns apply that day
4. **See exceptions** - services added (holidays specials) or removed (holiday cancellations)
5. **Browse all trips** - every trip running that day, grouped by route

All processing happens **locally in your browser** - no data is sent to any server.

## Features

- **Drag & drop upload** - Simply drop your GTFS ZIP file to get started
- **Interactive date picker** - Calendar view showing service counts per day
- **Calendar analysis** - See day-of-week patterns (M T W T F S S) for each service
- **Exception tracking** - Clearly shows which services are added or removed by `calendar_dates.txt`
- **Trip explorer** - Expandable route groups with search/filter functionality
- **Route colors** - Displays route colors from GTFS data when available
- **Dark mode** - Automatic light/dark theme based on system preference
- **Privacy first** - 100% client-side, no backend required

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
  - `1` = Service **added** for this date (e.g., special holiday service)
  - `2` = Service **removed** for this date (e.g., no service on Christmas)

### How it works together

For any given date, the tool:
1. Checks if the date falls within each calendar's date range
2. Checks if the day of week is marked as active
3. Applies any exceptions from `calendar_dates.txt`
4. Lists all trips that use the resulting active service IDs

## Where to get GTFS data

You can download GTFS feeds from:
- [Transitland](https://www.transit.land/) - Global directory of transit feeds
- [OpenMobilityData](https://transitfeeds.com/) - Another feed aggregator
- Your local transit agency's website (often under "Developers" or "Open Data")

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

This project is configured for automatic deployment to GitHub Pages using GitHub Actions. Any push triggers a new deployment.

The app uses relative paths (`base: './'` in Vite config) so it works correctly regardless of the deployment URL path.

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **JSZip** - Client-side ZIP file parsing
- **date-fns** - Date manipulation utilities

## License

MIT
