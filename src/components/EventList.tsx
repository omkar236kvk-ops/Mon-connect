import React from 'react';
import { EventItem } from '../utils/events';

const card: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '12px',
  padding: '20px',
  backdropFilter: 'blur(10px)',
};

const EventList: React.FC<{
  events: EventItem[];
  loading: boolean;
  error?: string | null;
  emptyText: string;
  renderAction?: (event: EventItem) => React.ReactNode;
}> = ({ events, loading, error, emptyText, renderAction }) => {
  if (loading || error || !events.length) {
    return (
      <div style={{ ...card, padding: '40px', textAlign: 'center' }}>
        <p style={{ color: error ? '#ff6b6b' : 'rgba(255, 255, 255, 0.6)', fontSize: '1.1rem' }}>
          {loading ? 'Loading events...' : error || emptyText}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
      {events.map((e) => (
        <div key={e.id} style={card}>
          <h3 style={{ color: '#fff', margin: '0 0 10px', fontSize: '1.2rem' }}>{e.name}</h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: '4px 0' }}>Organizer: {e.organizerName}</p>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: '4px 0' }}>Service needed: {e.serviceNeeded}</p>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: '4px 0' }}>Expected attendees: {e.attendees}</p>
          <p style={{ color: '#6C63FF', margin: '10px 0 0', fontWeight: 600 }}>{new Date(e.eventDate * 1000).toLocaleString()}</p>
          {renderAction && <div style={{ marginTop: '15px' }}>{renderAction(e)}</div>}
        </div>
      ))}
    </div>
  );
};

export const actionButton: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  borderRadius: '8px',
  border: 'none',
  background: 'linear-gradient(135deg, #6C63FF 0%, #5A52D5 100%)',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
};

export default EventList;
