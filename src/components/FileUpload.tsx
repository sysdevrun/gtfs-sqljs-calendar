import { useCallback, useState } from 'react';
import { parseGTFSZip, listGTFSFiles } from '../utils/gtfsParser';
import type { GTFSData } from '../types/gtfs';

interface FileUploadProps {
  onDataLoaded: (data: GTFSData) => void;
}

export function FileUpload({ onDataLoaded }: FileUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileList, setFileList] = useState<string[]>([]);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      setError(null);
      setFileName(file.name);

      try {
        // First, list files in the zip
        const files = await listGTFSFiles(file);
        setFileList(files);

        // Check for required files
        const hasCalendarOrDates =
          files.includes('calendar.txt') || files.includes('calendar_dates.txt');

        if (!hasCalendarOrDates) {
          throw new Error(
            'GTFS file must contain calendar.txt or calendar_dates.txt'
          );
        }

        // Parse the GTFS data
        const data = await parseGTFSZip(file);
        onDataLoaded(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse GTFS file');
        setFileList([]);
      } finally {
        setIsLoading(false);
      }
    },
    [onDataLoaded]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const file = event.dataTransfer.files?.[0];
      if (!file) return;

      if (!file.name.endsWith('.zip')) {
        setError('Please upload a .zip file');
        return;
      }

      // Create a synthetic event to reuse the handler
      const syntheticEvent = {
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      await handleFileChange(syntheticEvent);
    },
    [handleFileChange]
  );

  return (
    <div className="file-upload">
      <div
        className={`drop-zone ${isLoading ? 'loading' : ''}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".zip"
          onChange={handleFileChange}
          disabled={isLoading}
          id="gtfs-file-input"
        />
        <label htmlFor="gtfs-file-input">
          {isLoading ? (
            <span className="loading-text">Parsing GTFS data...</span>
          ) : (
            <>
              <span className="upload-icon">📁</span>
              <span className="upload-text">
                Drop GTFS ZIP file here or click to browse
              </span>
            </>
          )}
        </label>
      </div>

      {fileName && !error && (
        <div className="file-info">
          <strong>Loaded:</strong> {fileName}
          {fileList.length > 0 && (
            <details>
              <summary>Files in ZIP ({fileList.length})</summary>
              <ul className="file-list">
                {fileList.map((f) => (
                  <li key={f} className={f.includes('calendar') ? 'highlight' : ''}>
                    {f}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
}
