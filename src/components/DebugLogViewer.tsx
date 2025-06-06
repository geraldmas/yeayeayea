import React, { useEffect, useState } from 'react';
import { debugLogsService } from '../utils/dataService';
import './DebugLogViewer.css';

export type LogType = 'tag_interaction' | 'performance' | 'error';
export type Severity = 'info' | 'warning' | 'error' | 'critical';

interface DebugLog {
  id: number;
  log_type: LogType;
  severity: Severity;
  message: string;
  context: any;
  stack_trace?: string;
  created_at?: string;
}

const PAGE_SIZE = 20;

const DebugLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await debugLogsService.getRecentLogs(200);
        setLogs(data);
      } catch (err) {
        console.error('Failed to load logs', err);
      }
    };
    load();
  }, []);

  const filteredLogs = logs.filter(log => {
    if (typeFilter !== 'all' && log.log_type !== typeFilter) return false;
    if (severityFilter !== 'all' && log.severity !== severityFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE) || 1;
  const pagedLogs = filteredLogs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const formatDate = (dateStr?: string) => dateStr ? new Date(dateStr).toLocaleString() : '';

  return (
    <div className="debug-log-viewer">
      <h2>Debug Logs</h2>

      <div className="filters">
        <label>
          Type
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setCurrentPage(1); }}>
            <option value="all">Tous</option>
            <option value="tag_interaction">Tag Interaction</option>
            <option value="performance">Performance</option>
            <option value="error">Error</option>
          </select>
        </label>
        <label>
          Sévérité
          <select value={severityFilter} onChange={e => { setSeverityFilter(e.target.value); setCurrentPage(1); }}>
            <option value="all">Toutes</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="critical">Critical</option>
          </select>
        </label>
      </div>

      <table className="logs-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Sévérité</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody>
          {pagedLogs.map(log => (
            <tr key={log.id}>
              <td>{formatDate(log.created_at)}</td>
              <td>{log.log_type}</td>
              <td>{log.severity}</td>
              <td>{log.message}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Préc.</button>
        <span>{currentPage} / {totalPages}</span>
        <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Suiv.</button>
      </div>
    </div>
  );
};

export default DebugLogViewer;
