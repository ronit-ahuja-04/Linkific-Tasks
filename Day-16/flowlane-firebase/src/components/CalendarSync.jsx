import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, RefreshCw, LogIn } from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useLanguage } from '../context/LanguageContext';

export default function CalendarSync() {
  const { t } = useLanguage();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsAuth, setNeedsAuth] = useState(false);
  
  const fetchCalendarEvents = async () => {
    if (!auth.currentUser) return;
    
    setLoading(true);
    setError('');
    
    try {
      // 1. Check for token in localStorage
      const token = localStorage.getItem('googleAccessToken');
      if (!token) {
        setNeedsAuth(true);
        setLoading(false);
        return;
      }

      // 2. Fetch real data
      const now = new Date();
      const timeMin = now.toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      const timeMax = endOfDay.toISOString();
      
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&maxResults=10&singleEvents=true&orderBy=startTime`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        // Token expired
        setNeedsAuth(true);
        localStorage.removeItem('googleAccessToken');
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error("Failed to fetch calendar");
      }

      const data = await response.json();
      
      if (data.items) {
        setEvents(data.items.map(item => ({
          id: item.id,
          title: item.summary,
          time: item.start.dateTime ? new Date(item.start.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : t('chat.calendar.allDay'),
          date: item.start.dateTime ? new Date(item.start.dateTime).toLocaleDateString() : new Date(item.start.date).toLocaleDateString()
        })));
      } else {
        setEvents([]);
      }
      setLoading(false);
      setNeedsAuth(false);
      
    } catch (err) {
      console.error(err);
      setError(t('chat.calendar.syncFailed'));
      setLoading(false);
    }
  };

  const handleReconnect = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential && credential.accessToken) {
        localStorage.setItem('googleAccessToken', credential.accessToken);
        setNeedsAuth(false);
        fetchCalendarEvents();
      }
    } catch (err) {
      console.error("Failed to re-authenticate with Google", err);
    }
  };

  useEffect(() => {
    fetchCalendarEvents();
  }, []);

  return (
    <div style={{ marginTop: '32px', padding: '0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <a 
          href="https://calendar.google.com/calendar/u/0/r/day"
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', margin: 0, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          {t('chat.calendar.today')} <span style={{fontSize: 10}}>↗</span>
        </a>
        <button 
          onClick={fetchCalendarEvents} 
          style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
          disabled={loading}
          title={t('chat.calendar.refresh')}
        >
          <RefreshCw size={12} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {needsAuth ? (
        <div style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>{t('chat.calendar.disconnected')}</p>
          <button 
            onClick={handleReconnect}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 500 }}
          >
            <LogIn size={14} /> {t('chat.calendar.reconnect')}
          </button>
        </div>
      ) : loading && events.length === 0 ? (
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('chat.calendar.syncing')}</p>
      ) : error ? (
        <p style={{ fontSize: '12px', color: 'var(--tag-high-text)' }}>{error}</p>
      ) : events.length === 0 ? (
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('chat.calendar.noMeetings')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {events.map(event => (
            <a 
              key={event.id} 
              href="https://calendar.google.com/calendar/u/0/r/day"
              target="_blank"
              rel="noreferrer"
              style={{ 
                background: 'var(--bg-card)', 
                padding: '10px 12px', 
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '12px',
                textDecoration: 'none',
                display: 'block'
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {event.title}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                <CalendarIcon size={10} /> {event.date} • {event.time}
              </div>
            </a>
          ))}
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
