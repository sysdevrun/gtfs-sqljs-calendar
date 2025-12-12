import { useMemo, useState } from 'react';
import type { TripWithRoute } from '../types/gtfs';

interface TripsListProps {
  trips: TripWithRoute[];
}

type SortKey = 'route' | 'trip_id' | 'headsign' | 'service';
type SortOrder = 'asc' | 'desc';

export function TripsList({ trips }: TripsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('route');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(new Set());

  // Group trips by route
  const tripsByRoute = useMemo(() => {
    const grouped = new Map<string, TripWithRoute[]>();

    for (const trip of trips) {
      const routeKey = trip.route?.route_short_name || trip.route?.route_long_name || trip.route_id;
      const existing = grouped.get(routeKey) || [];
      existing.push(trip);
      grouped.set(routeKey, existing);
    }

    return grouped;
  }, [trips]);

  // Filter and sort
  const filteredTrips = useMemo(() => {
    let filtered = trips;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = trips.filter(
        (trip) =>
          trip.trip_id.toLowerCase().includes(term) ||
          trip.route_id.toLowerCase().includes(term) ||
          trip.trip_headsign?.toLowerCase().includes(term) ||
          trip.route?.route_short_name?.toLowerCase().includes(term) ||
          trip.route?.route_long_name?.toLowerCase().includes(term) ||
          trip.service_id.toLowerCase().includes(term)
      );
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let aVal: string;
      let bVal: string;

      switch (sortKey) {
        case 'route':
          aVal = a.route?.route_short_name || a.route_id;
          bVal = b.route?.route_short_name || b.route_id;
          break;
        case 'trip_id':
          aVal = a.trip_id;
          bVal = b.trip_id;
          break;
        case 'headsign':
          aVal = a.trip_headsign || '';
          bVal = b.trip_headsign || '';
          break;
        case 'service':
          aVal = a.service_id;
          bVal = b.service_id;
          break;
        default:
          aVal = '';
          bVal = '';
      }

      const comparison = aVal.localeCompare(bVal, undefined, { numeric: true });
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [trips, searchTerm, sortKey, sortOrder]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const toggleRoute = (routeKey: string) => {
    setExpandedRoutes((prev) => {
      const next = new Set(prev);
      if (next.has(routeKey)) {
        next.delete(routeKey);
      } else {
        next.add(routeKey);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedRoutes(new Set(tripsByRoute.keys()));
  };

  const collapseAll = () => {
    setExpandedRoutes(new Set());
  };

  // Get unique service IDs and routes
  const uniqueServices = new Set(trips.map((t) => t.service_id));
  const uniqueRoutes = tripsByRoute.size;

  if (trips.length === 0) {
    return (
      <div className="trips-list empty">
        <h3>Trips</h3>
        <p className="empty-message">No trips running on this day</p>
      </div>
    );
  }

  return (
    <div className="trips-list">
      <div className="trips-header">
        <h3>
          Trips Running <span className="count">({trips.length})</span>
        </h3>
        <div className="trips-stats">
          <span>{uniqueRoutes} routes</span>
          <span>{uniqueServices.size} services</span>
        </div>
      </div>

      <div className="trips-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search trips, routes, headsigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              ×
            </button>
          )}
        </div>
        <div className="view-controls">
          <button onClick={expandAll}>Expand All</button>
          <button onClick={collapseAll}>Collapse All</button>
        </div>
      </div>

      {searchTerm && (
        <div className="search-results-info">
          Found {filteredTrips.length} trips matching "{searchTerm}"
        </div>
      )}

      {/* Grouped view by route */}
      <div className="trips-by-route">
        {Array.from(tripsByRoute.entries())
          .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
          .map(([routeKey, routeTrips]) => {
            // Filter route trips based on search
            const visibleTrips = searchTerm
              ? routeTrips.filter((trip) =>
                  filteredTrips.some((ft) => ft.trip_id === trip.trip_id)
                )
              : routeTrips;

            if (visibleTrips.length === 0) return null;

            const isExpanded = expandedRoutes.has(routeKey);
            const routeInfo = routeTrips[0].route;

            return (
              <div key={routeKey} className="route-group">
                <button
                  className="route-header"
                  onClick={() => toggleRoute(routeKey)}
                  style={{
                    borderLeftColor: routeInfo?.route_color
                      ? `#${routeInfo.route_color}`
                      : undefined,
                  }}
                >
                  <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                  <span
                    className="route-badge"
                    style={{
                      backgroundColor: routeInfo?.route_color
                        ? `#${routeInfo.route_color}`
                        : undefined,
                      color: routeInfo?.route_text_color
                        ? `#${routeInfo.route_text_color}`
                        : undefined,
                    }}
                  >
                    {routeInfo?.route_short_name || routeKey}
                  </span>
                  <span className="route-name">
                    {routeInfo?.route_long_name || ''}
                  </span>
                  <span className="trip-count">
                    {visibleTrips.length} trip{visibleTrips.length !== 1 ? 's' : ''}
                  </span>
                </button>

                {isExpanded && (
                  <div className="route-trips">
                    <table>
                      <thead>
                        <tr>
                          <th onClick={() => handleSort('trip_id')}>
                            Trip ID {sortKey === 'trip_id' && (sortOrder === 'asc' ? '↑' : '↓')}
                          </th>
                          <th onClick={() => handleSort('headsign')}>
                            Headsign {sortKey === 'headsign' && (sortOrder === 'asc' ? '↑' : '↓')}
                          </th>
                          <th onClick={() => handleSort('service')}>
                            Service {sortKey === 'service' && (sortOrder === 'asc' ? '↑' : '↓')}
                          </th>
                          <th>Direction</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleTrips.map((trip) => (
                          <tr key={trip.trip_id}>
                            <td className="trip-id">{trip.trip_id}</td>
                            <td className="headsign">{trip.trip_headsign || '-'}</td>
                            <td className="service-id">{trip.service_id}</td>
                            <td className="direction">
                              {trip.direction_id !== undefined
                                ? trip.direction_id === 0
                                  ? 'Outbound'
                                  : 'Inbound'
                                : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
