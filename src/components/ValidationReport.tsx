import { useMemo, useState } from 'react';
import type { GTFSData } from '../types/gtfs';
import { validateGTFSData } from '../utils/gtfsValidator';

interface ValidationReportProps {
  gtfsData: GTFSData;
}

export function ValidationReport({ gtfsData }: ValidationReportProps) {
  const [expandedIssues, setExpandedIssues] = useState<Set<number>>(new Set());

  const validation = useMemo(() => validateGTFSData(gtfsData), [gtfsData]);

  const toggleIssue = (index: number) => {
    setExpandedIssues((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className="validation-report">
      <h3>Data Validation</h3>
      <p className="validation-description">
        Checking for duplicate records according to GTFS specification uniqueness constraints.
      </p>

      <div className="validation-stats">
        <span>Checked: </span>
        <span className="stat">{validation.stats.tripsChecked.toLocaleString()} trips</span>
        <span className="separator">|</span>
        <span className="stat">{validation.stats.calendarsChecked.toLocaleString()} calendars</span>
        <span className="separator">|</span>
        <span className="stat">{validation.stats.calendarDatesChecked.toLocaleString()} calendar dates</span>
      </div>

      {validation.isValid ? (
        <div className="validation-success">
          <span className="icon">✓</span>
          <span>No duplicate records found. Data passes GTFS uniqueness constraints.</span>
        </div>
      ) : (
        <div className="validation-errors">
          <div className="validation-error-header">
            <span className="icon">⚠</span>
            <span>Found {validation.issues.length} validation issue(s)</span>
          </div>

          <ul className="issues-list">
            {validation.issues.map((issue, index) => (
              <li key={index} className={`issue ${issue.type}`}>
                <button
                  className="issue-header"
                  onClick={() => toggleIssue(index)}
                >
                  <span className="expand-icon">
                    {expandedIssues.has(index) ? '▼' : '▶'}
                  </span>
                  <span className="issue-file">{issue.file}</span>
                  <span className="issue-field">[{issue.field}]</span>
                  <span className="issue-message">{issue.message}</span>
                </button>

                {expandedIssues.has(index) && (
                  <div className="issue-details">
                    <p className="duplicates-header">Duplicate values:</p>
                    <ul className="duplicates-list">
                      {issue.duplicates.slice(0, 50).map((dup, i) => (
                        <li key={i}>{dup}</li>
                      ))}
                      {issue.duplicates.length > 50 && (
                        <li className="more">
                          ... and {issue.duplicates.length - 50} more
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="validation-spec-note">
        <strong>GTFS Uniqueness Constraints:</strong>
        <ul>
          <li><code>trips.txt</code>: <code>trip_id</code> must be unique</li>
          <li><code>calendar.txt</code>: <code>service_id</code> must be unique</li>
          <li><code>calendar_dates.txt</code>: <code>service_id</code> + <code>date</code> combination must be unique</li>
        </ul>
      </div>
    </div>
  );
}
