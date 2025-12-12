import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import type { GTFSData, DayInfo } from './types/gtfs';
import { FileUpload } from './components/FileUpload';
import { DateSelector } from './components/DateSelector';
import { CalendarList } from './components/CalendarList';
import { TripsList } from './components/TripsList';
import { getDayInfo, getServiceStats } from './utils/calendarService';
import './App.css';

function App() {
  const [gtfsData, setGtfsData] = useState<GTFSData | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const dayInfo: DayInfo | null = useMemo(() => {
    if (!gtfsData || !selectedDate) return null;
    return getDayInfo(gtfsData, selectedDate);
  }, [gtfsData, selectedDate]);

  const stats = useMemo(() => {
    if (!gtfsData) return null;
    return getServiceStats(gtfsData);
  }, [gtfsData]);

  const handleDataLoaded = (data: GTFSData) => {
    setGtfsData(data);
    setSelectedDate(null);
  };

  const handleClearData = () => {
    setGtfsData(null);
    setSelectedDate(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>GTFS Calendar Explorer</h1>
        <p className="subtitle">
          Explore GTFS transit calendars and find which trips run on specific days
        </p>
      </header>

      <main className="app-main">
        {!gtfsData ? (
          <section className="upload-section">
            <FileUpload onDataLoaded={handleDataLoaded} />
            <div className="info-box">
              <h3>What is GTFS?</h3>
              <p>
                GTFS (General Transit Feed Specification) is a standard format for public
                transit schedules. This tool helps you understand:
              </p>
              <ul>
                <li>
                  <strong>calendar.txt</strong> - Regular service patterns (weekdays,
                  weekends)
                </li>
                <li>
                  <strong>calendar_dates.txt</strong> - Exceptions (holidays, special
                  events)
                </li>
                <li>
                  <strong>trips.txt</strong> - Individual trips that run on each service
                </li>
              </ul>
              <p className="privacy-note">
                All processing is done locally in your browser. No data is uploaded to
                any server.
              </p>
            </div>
          </section>
        ) : (
          <>
            <section className="data-overview">
              <div className="overview-header">
                <h2>GTFS Data Loaded</h2>
                <button className="clear-btn" onClick={handleClearData}>
                  Load Different File
                </button>
              </div>

              {stats && (
                <div className="stats-grid">
                  <div className="stat-card">
                    <span className="stat-value">{stats.totalCalendars}</span>
                    <span className="stat-label">Calendars</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value">{stats.totalExceptions}</span>
                    <span className="stat-label">Exceptions</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value">{stats.uniqueServiceIds}</span>
                    <span className="stat-label">Services</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value">{stats.totalRoutes}</span>
                    <span className="stat-label">Routes</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-value">{stats.totalTrips.toLocaleString()}</span>
                    <span className="stat-label">Total Trips</span>
                  </div>
                </div>
              )}
            </section>

            <section className="date-section">
              <h2>Select a Date</h2>
              <DateSelector
                gtfsData={gtfsData}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
            </section>

            {selectedDate && dayInfo && (
              <section className="day-details">
                <h2>
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </h2>

                <div className="day-summary">
                  <div className="summary-item active">
                    <span className="number">{dayInfo.activeCalendars.length}</span>
                    <span className="label">Active Calendars</span>
                  </div>
                  <div className="summary-item excluded">
                    <span className="number">{dayInfo.excludedCalendars.length}</span>
                    <span className="label">Excluded Calendars</span>
                  </div>
                  <div className="summary-item trips">
                    <span className="number">{dayInfo.activeTrips.length.toLocaleString()}</span>
                    <span className="label">Trips Running</span>
                  </div>
                </div>

                <div className="day-content">
                  <div className="calendars-section">
                    <CalendarList
                      title="Active Calendars"
                      calendars={dayInfo.activeCalendars}
                      type="active"
                    />
                    <CalendarList
                      title="Excluded Calendars"
                      calendars={dayInfo.excludedCalendars}
                      type="excluded"
                    />
                  </div>

                  <div className="trips-section">
                    <TripsList trips={dayInfo.activeTrips} />
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>
          GTFS Calendar Explorer - All processing done locally in your browser
        </p>
      </footer>
    </div>
  );
}

export default App;
