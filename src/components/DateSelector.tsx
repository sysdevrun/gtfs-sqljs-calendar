import { useMemo, useState } from 'react';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';
import type { GTFSData } from '../types/gtfs';
import { getAvailableDates, getDateRange, getActiveServiceIds } from '../utils/calendarService';

interface DateSelectorProps {
  gtfsData: GTFSData;
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
}

export function DateSelector({ gtfsData, selectedDate, onDateSelect }: DateSelectorProps) {
  const dateRange = useMemo(() => getDateRange(gtfsData), [gtfsData]);
  const availableDates = useMemo(() => getAvailableDates(gtfsData), [gtfsData]);

  const [currentMonth, setCurrentMonth] = useState(() => {
    if (availableDates.length > 0) {
      return startOfMonth(availableDates[0]);
    }
    return startOfMonth(new Date());
  });

  // Create a Set for quick lookup of available dates
  const availableDateStrings = useMemo(
    () => new Set(availableDates.map((d) => format(d, 'yyyy-MM-dd'))),
    [availableDates]
  );

  // Pre-calculate service counts for visible dates
  const serviceCountsForMonth = useMemo(() => {
    const counts = new Map<string, number>();
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    for (const day of daysInMonth) {
      const dateStr = format(day, 'yyyy-MM-dd');
      if (availableDateStrings.has(dateStr)) {
        const activeServices = getActiveServiceIds(gtfsData, day);
        counts.set(dateStr, activeServices.size);
      }
    }
    return counts;
  }, [currentMonth, gtfsData, availableDateStrings]);

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Get starting day offset (0 = Sunday)
  const startOffset = getDay(startOfMonth(currentMonth));

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (!dateRange) {
    return (
      <div className="date-selector empty">
        <p>No date range found in GTFS data</p>
      </div>
    );
  }

  return (
    <div className="date-selector">
      <div className="date-range-info">
        <span>Data available: </span>
        <strong>{format(dateRange.start, 'MMM d, yyyy')}</strong>
        <span> to </span>
        <strong>{format(dateRange.end, 'MMM d, yyyy')}</strong>
        <span className="date-count"> ({availableDates.length} days from today)</span>
      </div>

      <div className="calendar-nav">
        <button onClick={handlePrevMonth} className="nav-btn">
          ◀ Prev
        </button>
        <h3>{format(currentMonth, 'MMMM yyyy')}</h3>
        <button onClick={handleNextMonth} className="nav-btn">
          Next ▶
        </button>
      </div>

      <div className="calendar-grid">
        {weekDays.map((day) => (
          <div key={day} className="calendar-header">
            {day}
          </div>
        ))}

        {/* Empty cells for offset */}
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="calendar-cell empty" />
        ))}

        {/* Day cells */}
        {daysInMonth.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isAvailable = availableDateStrings.has(dateStr);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const serviceCount = serviceCountsForMonth.get(dateStr) || 0;

          return (
            <button
              key={dateStr}
              className={`calendar-cell ${isAvailable ? 'available' : 'unavailable'} ${
                isSelected ? 'selected' : ''
              } ${serviceCount > 0 ? 'has-services' : ''}`}
              onClick={() => isAvailable && onDateSelect(day)}
              disabled={!isAvailable}
              title={
                isAvailable
                  ? `${serviceCount} active service${serviceCount !== 1 ? 's' : ''}`
                  : 'No data for this date'
              }
            >
              <span className="day-number">{format(day, 'd')}</span>
              {isAvailable && serviceCount > 0 && (
                <span className="service-count">{serviceCount}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick date list */}
      <div className="date-list">
        <h4>Quick Select (Next 14 days with service)</h4>
        <div className="date-buttons">
          {availableDates.slice(0, 14).map((date) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const serviceCount = getActiveServiceIds(gtfsData, date).size;

            return (
              <button
                key={dateStr}
                className={`date-btn ${isSelected ? 'selected' : ''}`}
                onClick={() => onDateSelect(date)}
              >
                <span className="date-btn-day">{format(date, 'EEE')}</span>
                <span className="date-btn-date">{format(date, 'MMM d')}</span>
                <span className="date-btn-services">{serviceCount} svc</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
