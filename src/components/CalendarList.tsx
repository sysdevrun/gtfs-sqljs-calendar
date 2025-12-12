import { format } from 'date-fns';
import type { CalendarDayStatus } from '../types/gtfs';
import { parseGTFSDate } from '../utils/calendarService';

interface CalendarListProps {
  title: string;
  calendars: CalendarDayStatus[];
  type: 'active' | 'excluded';
}

export function CalendarList({ title, calendars, type }: CalendarListProps) {
  if (calendars.length === 0) {
    return (
      <div className={`calendar-list ${type}`}>
        <h3>{title}</h3>
        <p className="empty-message">No {type === 'active' ? 'active' : 'excluded'} calendars</p>
      </div>
    );
  }

  // Group by exception status
  const regularCalendars = calendars.filter((c) => !c.isException);
  const addedExceptions = calendars.filter((c) => c.isException && c.exceptionType === 'added');
  const removedExceptions = calendars.filter((c) => c.isException && c.exceptionType === 'removed');

  return (
    <div className={`calendar-list ${type}`}>
      <h3>
        {title} <span className="count">({calendars.length})</span>
      </h3>

      {regularCalendars.length > 0 && (
        <div className="calendar-group">
          <h4>Regular Services ({regularCalendars.length})</h4>
          <ul>
            {regularCalendars.map((cal) => (
              <CalendarItem key={cal.service_id} calendar={cal} />
            ))}
          </ul>
        </div>
      )}

      {addedExceptions.length > 0 && (
        <div className="calendar-group exceptions added">
          <h4>
            <span className="badge added">+</span> Added by Exception ({addedExceptions.length})
          </h4>
          <ul>
            {addedExceptions.map((cal) => (
              <CalendarItem key={cal.service_id} calendar={cal} />
            ))}
          </ul>
        </div>
      )}

      {removedExceptions.length > 0 && (
        <div className="calendar-group exceptions removed">
          <h4>
            <span className="badge removed">-</span> Removed by Exception ({removedExceptions.length})
          </h4>
          <ul>
            {removedExceptions.map((cal) => (
              <CalendarItem key={cal.service_id} calendar={cal} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface CalendarItemProps {
  calendar: CalendarDayStatus;
}

function CalendarItem({ calendar }: CalendarItemProps) {
  const { service_id, isException, exceptionType, calendar: calData } = calendar;

  const getDaysOfWeek = () => {
    if (!calData) return null;

    const days = [
      { key: 'monday', label: 'M', active: calData.monday },
      { key: 'tuesday', label: 'T', active: calData.tuesday },
      { key: 'wednesday', label: 'W', active: calData.wednesday },
      { key: 'thursday', label: 'T', active: calData.thursday },
      { key: 'friday', label: 'F', active: calData.friday },
      { key: 'saturday', label: 'S', active: calData.saturday },
      { key: 'sunday', label: 'S', active: calData.sunday },
    ];

    return (
      <div className="days-of-week">
        {days.map((day) => (
          <span
            key={day.key}
            className={`day-indicator ${day.active ? 'active' : 'inactive'}`}
            title={day.key}
          >
            {day.label}
          </span>
        ))}
      </div>
    );
  };

  return (
    <li className={`calendar-item ${isException ? `exception ${exceptionType}` : ''}`}>
      <div className="calendar-item-header">
        <span className="service-id">{service_id}</span>
        {isException && (
          <span className={`exception-badge ${exceptionType}`}>
            {exceptionType === 'added' ? 'ADDED' : 'REMOVED'}
          </span>
        )}
      </div>

      {calData && (
        <div className="calendar-item-details">
          {getDaysOfWeek()}
          <div className="date-range">
            <span className="label">Valid:</span>
            <span className="dates">
              {format(parseGTFSDate(calData.start_date), 'MMM d, yyyy')} -{' '}
              {format(parseGTFSDate(calData.end_date), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      )}

      {!calData && isException && (
        <div className="calendar-item-details">
          <span className="exception-only">Exception-only service (no regular schedule)</span>
        </div>
      )}
    </li>
  );
}
