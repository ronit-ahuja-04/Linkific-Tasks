import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Send } from 'lucide-react';
import '../index.css';

export default function Chat({ projectId, isDirectMessage = false, directMessageUserId = null, notifyProjectMembers }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const getChatId = (uid1, uid2) => {
    return [uid1, uid2].sort().join('_');
  };

  const getBaseRef = () => {
    if (isDirectMessage && directMessageUserId && auth.currentUser) {
      const chatId = getChatId(auth.currentUser.uid, directMessageUserId);
      return doc(db, 'direct_messages', chatId);
    } else if (projectId && !isDirectMessage) {
      return doc(db, 'projects', projectId);
    }
    return null;
  };

  useEffect(() => {
    const baseRef = getBaseRef();
    if (!baseRef) return;

    const messagesRef = collection(baseRef, 'messages');

    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsub = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(fetchedMessages);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });

    // Listen for typing status
    const typingRef = collection(baseRef, 'typing');
    const unsubTyping = onSnapshot(typingRef, (snapshot) => {
      const typing = [];
      snapshot.docs.forEach(doc => {
        if (doc.id !== auth.currentUser?.uid && doc.data().isTyping) {
          // Check if timestamp is recent (within last 5 seconds) to prevent stuck typing indicators
          const updatedAt = doc.data().updatedAt?.toDate();
          if (updatedAt && (new Date() - updatedAt) < 5000) {
            typing.push(doc.data().displayName || 'Someone');
          }
        }
      });
      setTypingUsers(typing);
    });

    return () => {
      unsub();
      unsubTyping();
    };
  }, [projectId, directMessageUserId, isDirectMessage, auth.currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const updateTypingStatus = async (isTyping) => {
    const baseRef = getBaseRef();
    if (!baseRef || !auth.currentUser) return;
    try {
      await setDoc(doc(baseRef, 'typing', auth.currentUser.uid), {
        isTyping,
        displayName: auth.currentUser.displayName || auth.currentUser.email,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.error(e);
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // Start typing
    updateTypingStatus(true);

    // Clear previous timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    // Set new timeout to stop typing after 2s of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(false);
    }, 2000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const baseRef = getBaseRef();
    if (!baseRef) return;

    try {
      const messagesRef = collection(baseRef, 'messages');
      const textToSend = newMessage;
      
      setNewMessage('');
      updateTypingStatus(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      await addDoc(messagesRef, {
        text: textToSend,
        uid: auth.currentUser.uid,
        senderName: auth.currentUser.displayName || auth.currentUser.email,
        senderPhoto: auth.currentUser.photoURL || `https://ui-avatars.com/api/?name=${auth.currentUser.displayName || auth.currentUser.email}&background=random`,
        createdAt: serverTimestamp()
      });

      if (isDirectMessage && directMessageUserId) {
        try {
          await updateDoc(doc(db, 'users', directMessageUserId), {
            unreadMessages: increment(1)
          });
          
          await setDoc(doc(collection(db, 'users', directMessageUserId, 'notifications')), {
            message: `${auth.currentUser.displayName || auth.currentUser.email} sent you a message: ${textToSend.substring(0, 50)}${textToSend.length > 50 ? '...' : ''}`,
            createdAt: serverTimestamp(),
            read: false
          });
        } catch (updateErr) {
          console.error("Failed to increment unread counter (maybe user doc doesn't exist yet)", updateErr);
        }
      } else if (!isDirectMessage && notifyProjectMembers) {
        notifyProjectMembers(`${auth.currentUser.displayName || auth.currentUser.email} sent a message: ${textToSend.substring(0, 50)}${textToSend.length > 50 ? '...' : ''}`, projectId);
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <div 
      className="chat-container" 
      style={isDirectMessage ? { margin: 0, height: '100%', border: 'none', borderRadius: 0 } : {}}
    >
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">No messages yet. Say hi!</div>
        ) : (
          messages.map(msg => {
            const isMe = msg.uid === auth.currentUser?.uid;
            return (
              <div key={msg.id} className={`chat-message ${isMe ? 'chat-message-me' : ''}`}>
                {!isMe && <img src={msg.senderPhoto} alt={msg.senderName} className="chat-avatar" style={{objectFit: 'cover', marginTop: 2}} />}
                <div className="chat-bubble-container" style={{display: 'flex', flexDirection: 'column'}}>
                  {!isMe && <span className="chat-sender-name">{msg.senderName}</span>}
                  <div className="chat-bubble">
                    {msg.text}
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4, alignSelf: isMe ? 'flex-end' : 'flex-start', padding: '0 4px' }}>
                    {msg.createdAt 
                      ? (typeof msg.createdAt.toDate === 'function' 
                          ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                          : new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
                      : 'Sending...'}
                  </span>
                </div>
              </div>
            );
          })
        )}
        
        {typingUsers.length > 0 && (
          <div className="chat-message">
            <div className="chat-bubble-container">
              <span className="chat-sender-name">{typingUsers.join(', ')} {typingUsers.length > 1 ? 'are' : 'is'} typing...</span>
              <div className="chat-bubble" style={{display: 'inline-block'}}>
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <form className="chat-input-container" onSubmit={handleSendMessage}>
        <input 
          type="text" 
          value={newMessage}
          onChange={handleInputChange}
          placeholder="Type a message..."
          className="chat-input"
        />
        <button type="submit" className="chat-send-btn" disabled={!newMessage.trim()} aria-label="Send message" title="Send message">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
