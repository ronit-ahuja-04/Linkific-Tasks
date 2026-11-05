import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { MessageSquare, Search } from 'lucide-react';
import Chat from './Chat';
import '../index.css';

export default function MessagesView() {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all users we share a project with
  useEffect(() => {
    if (!auth.currentUser) return;
    
    // For simplicity right now, fetch all users. 
    // In production, we'd limit this to only users we share projects with.
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const fetchedUsers = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(u => u.uid !== auth.currentUser.uid); // exclude self
      
      setUsers(fetchedUsers);
    });

    return () => unsub();
  }, [auth.currentUser]);

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', background: 'var(--bg-main)' }}>
      {/* Messages Sidebar */}
      <div style={{ width: 300, borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 24, borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: 20, marginBottom: 16 }}>Messages</h2>
          <div className="header-search" style={{ margin: 0, width: '100%' }}>
            <Search size={16} color="var(--text-tertiary)" />
            <input 
              type="text" 
              placeholder="Search people..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 0' }}>
          {filteredUsers.length === 0 ? (
            <p style={{ padding: '0 24px', color: 'var(--text-tertiary)', fontSize: 13 }}>No users found.</p>
          ) : (
            filteredUsers.map(user => (
              <div 
                key={user.uid}
                onClick={() => setSelectedUserId(user.uid)}
                style={{
                  padding: '12px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  background: selectedUserId === user.uid ? 'var(--bg-card)' : 'transparent',
                  borderLeft: selectedUserId === user.uid ? '3px solid var(--primary-color)' : '3px solid transparent'
                }}
              >
                <img 
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email}&background=random`} 
                  alt={user.displayName}
                  style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{user.displayName || 'Unknown User'}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{user.email}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedUserId ? (
          <Chat 
            directMessageUserId={selectedUserId} 
            isDirectMessage={true} 
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-tertiary)' }}>
            <MessageSquare size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
            <p>Select a person to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}
