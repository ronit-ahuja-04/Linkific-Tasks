import { useState, useEffect, useRef } from 'react';
import { Trash2, X, AlignLeft, Tag, Users, CheckSquare, Edit3 } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { saveTask, assignTaskUsers } from '../store/slices/boardSlice';
import '../index.css';
import { useLanguage } from '../context/LanguageContext';
import GitHubBadge from './GitHubBadge';

export default function TaskPanel({ isOpen, onClose, task, handleCreateDraftTask, handleDeleteTask, isOwner, projectMembers, usersMap }) {
  // REDUX: useDispatch returns the store's dispatch; thunks and plain actions are sent through it
  const dispatch = useDispatch();
  const { t } = useLanguage();
  // We determine initial mode based on whether it's a draft
  const [mode, setMode] = useState('view');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  
  const isReadOnly = !isOwner;
  
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const assigneeDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target)) {
        setIsAssigneeDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset the form when the panel opens or a different task is shown. It must NOT run when the
  // same task changes (e.g. someone is assigned), or whatever you had typed would be wiped.
  useEffect(() => {
    if (task) {
      setTitle(task.content || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'medium');
      setMode(task._isDraft ? 'edit' : 'view');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, task?.id]);

  if (!isOpen || !task) return null;

  const handleSave = async () => {
    if (isReadOnly || task._isDraft) return;
    const updatedTask = {
      ...task,
      content: title,
      description,
      priority
    };
    // REDUX: saveTask thunk updates the board optimistically, writes to Firestore, rolls back on failure
    dispatch(saveTask(updatedTask));
  };

  const handleUpdateClick = () => {
    handleSave();
    setMode('view');
  };

  const handleClose = () => {
    onClose();
  };
  
  const onSubmitDraft = () => {
    if (!title.trim()) return;
    const updatedTask = {
      ...task,
      content: title,
      description,
      priority
    };
    handleCreateDraftTask(updatedTask);
    onClose();
  };

  const onDelete = () => {
    handleDeleteTask(task.id);
    onClose();
  };

  const toggleAssignee = (uid) => {
    if (isReadOnly) return;
    const currentUsers = task.users || [];
    const isAssigned = currentUsers.includes(uid);
    let newUsers;

    if (isAssigned) {
      newUsers = currentUsers.filter(u => u !== uid);
    } else {
      newUsers = [...currentUsers, uid];
    }

    // REDUX: assignTaskUsers thunk does the optimistic update, notification write and Firestore update
    dispatch(assignTaskUsers({ task, users: newUsers, assignedUid: isAssigned ? null : uid, title }));
  };

  return (
    <>
      <div className="modal-overlay" onClick={handleClose} role="presentation" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
        <div 
          className="modal-content" 
          role="dialog"
          aria-modal="true"
          aria-label={task._isDraft ? t('task.dialog.new') : t('task.dialog.details')}
          onClick={e => e.stopPropagation()} 
          style={{
            maxWidth: 600, 
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '24px 32px', borderBottom: '1px solid var(--border-color)'}}>
            <div style={{flex: 1, marginRight: 16}}>
              {mode === 'view' ? (
                <h2 style={{margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3}}>
                  {title || t('task.untitled')}
                </h2>
              ) : (
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('task.title.placeholder')}
                  disabled={isReadOnly}
                  style={{
                    width: '100%', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', 
                    background: 'transparent', border: 'none', borderBottom: '2px solid var(--primary-color)',
                    outline: 'none', padding: '4px 0', marginBottom: 4
                  }}
                  autoFocus
                />
              )}
            </div>
            <button 
              onClick={handleClose}
              aria-label={t('task.close.aria')}
              title={t('task.close.title')}
              style={{background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.2s', flexShrink: 0}}
              onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'var(--bg-main)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div style={{padding: '32px', overflowY: 'auto', flex: 1}}>
            <div className="task-meta-grid" style={{marginBottom: 32}}>
              {/* Status */}
              <div className="meta-row">
                <div className="meta-label"><CheckSquare size={14} /> {t('task.status')}</div>
                <div className="meta-value">
                  <span className="status-badge" style={{background: 'var(--bg-card)', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: '1px solid var(--border-color)'}}>
                    {task._isDraft ? t('task.status.new') : t('task.status.tracked')}
                  </span>
                </div>
              </div>
              
              {/* Assignees */}
              <div className="meta-row">
                <div className="meta-label"><Users size={14} /> {t('task.assignees')}</div>
                <div className="meta-value">
                  <div className="avatar-group" style={{position: 'relative'}} ref={assigneeDropdownRef}>
                    {(task.users || []).map(uid => {
                      const user = usersMap[uid];
                      const photo = user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || user?.email || uid}&background=random`;
                      return (
                        <img key={uid} src={photo} style={{width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--bg-secondary)', marginLeft: -8}} title={user?.displayName || user?.email || uid} />
                      );
                    })}
                    {!isReadOnly && mode === 'edit' && (
                      <button 
                        onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
                        style={{width: 28, height: 28, borderRadius: '50%', border: '1px dashed var(--text-tertiary)', background: 'transparent', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginLeft: (task.users?.length ? -8 : 0), zIndex: 1}}
                      >
                        +
                      </button>
                    )}
                    {mode === 'view' && task.users?.length === 0 && (
                      <span style={{fontSize: 13, color: 'var(--text-tertiary)'}}>{t('task.unassigned')}</span>
                    )}
                    
                    {isAssigneeDropdownOpen && (
                      <div style={{
                        position: 'absolute', top: 32, left: 0, background: 'var(--bg-card)', 
                        border: '1px solid var(--border-color)', borderRadius: 8, padding: 8, 
                        zIndex: 10, minWidth: 200, boxShadow: 'var(--shadow-md)'
                      }}>
                        <h4 style={{fontSize: 12, color: 'var(--text-tertiary)', margin: '4px 8px 8px'}}>{t('task.assignTo')}</h4>
                        {projectMembers.map(uid => {
                          const user = usersMap[uid];
                          if (!user) return null;
                          const isAssigned = (task.users || []).includes(uid);
                          return (
                            <div 
                              key={uid}
                              onClick={() => toggleAssignee(uid)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 8, padding: '8px',
                                cursor: 'pointer', borderRadius: 4, 
                                background: isAssigned ? 'var(--bg-main)' : 'transparent'
                              }}
                            >
                              <input type="checkbox" checked={isAssigned} readOnly />
                              <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email}&background=random`} style={{width: 24, height: 24, borderRadius: '50%'}} />
                              <span style={{fontSize: 13}}>{user.displayName || user.email}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Priority */}
              <div className="meta-row">
                <div className="meta-label"><Tag size={14} /> {t('task.priority')}</div>
                <div className="meta-value">
                  {mode === 'view' ? (
                    <span style={{
                      fontSize: 12, fontWeight: 700, textTransform: 'uppercase', padding: '4px 8px', borderRadius: 4,
                      background: priority === 'high' ? 'rgba(239, 68, 68, 0.1)' : priority === 'medium' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: priority === 'high' ? 'var(--danger-text)' : priority === 'medium' ? 'var(--priority-medium-text)' : 'var(--priority-low-text)'
                    }}>
                      {['low', 'medium', 'high'].includes(priority) ? t(`task.priority.${priority}.view`) : priority}
                    </span>
                  ) : (
                    <select 
                      aria-label={t('task.priority')}
                      className="clean-input" 
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      disabled={isReadOnly}
                      style={{padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-primary)'}}
                    >
                      <option value="low">{t('task.priority.low')}</option>
                      <option value="medium">{t('task.priority.medium')}</option>
                      <option value="high">{t('task.priority.high')}</option>
                    </select>
                  )}
                </div>
              </div>
            </div>

            {task.source?.type === 'github' && (
              <div style={{marginBottom: 24}}>
                <GitHubBadge source={task.source} />
              </div>
            )}

            {/* Description */}
            <div className="task-section">
              <h4 style={{display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', marginBottom: 12, fontSize: 14, fontWeight: 600}}>
                <AlignLeft size={16} /> {t('task.description')}
              </h4>
              {mode === 'view' ? (
                <div style={{
                  color: description ? 'var(--text-primary)' : 'var(--text-tertiary)', 
                  fontSize: 15, lineHeight: 1.6, whiteSpace: 'pre-wrap',
                  background: 'var(--bg-main)', padding: 16, borderRadius: 8, border: '1px solid var(--border-color)'
                }}>
                  {description || t('task.description.empty')}
                </div>
              ) : (
                <textarea 
                  className="task-desc-input" 
                  placeholder={t('task.description.placeholder')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isReadOnly}
                  style={{
                    width: '100%', minHeight: 120, padding: 16, borderRadius: 8, border: '1px solid var(--border-color)',
                    background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: 15, lineHeight: 1.6,
                    resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit'
                  }}
                />
              )}
            </div>
          </div>

          {/* Footer / Actions */}
          <div style={{padding: '24px 32px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-main)', display: 'flex', justifyContent: 'flex-end', gap: 12}}>
            {task._isDraft ? (
              <>
                <button 
                  onClick={handleClose}
                  style={{padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer'}}
                >
                  {t('task.cancel')}
                </button>
                <button 
                  onClick={onSubmitDraft}
                  disabled={!title.trim()}
                  style={{
                    padding: '10px 20px', background: 'var(--primary-strong)', color: '#fff', 
                    border: 'none', borderRadius: 8, fontWeight: 600, cursor: title.trim() ? 'pointer' : 'not-allowed',
                    opacity: title.trim() ? 1 : 0.5
                  }}
                >
                  {t('task.create')}
                </button>
              </>
            ) : mode === 'view' && !isReadOnly ? (
              <>
                <button 
                  onClick={onDelete}
                  style={{padding: '10px 20px', borderRadius: 8, border: '1px solid var(--danger-text)', background: 'transparent', color: 'var(--danger-text)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8}}
                >
                  <Trash2 size={16} /> {t('task.delete')}
                </button>
                <button 
                  onClick={() => setMode('edit')}
                  style={{padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--primary-strong)', color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8}}
                >
                  <Edit3 size={16} /> {t('task.edit')}
                </button>
              </>
            ) : mode === 'edit' && !isReadOnly ? (
              <>
                <button 
                  onClick={() => {
                    setTitle(task.content || '');
                    setDescription(task.description || '');
                    setPriority(task.priority || 'medium');
                    setMode('view');
                  }}
                  style={{padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer'}}
                >
                  {t('task.cancel')}
                </button>
                <button 
                  onClick={handleUpdateClick}
                  disabled={!title.trim()}
                  style={{
                    padding: '10px 20px', background: 'var(--primary-strong)', color: '#fff', 
                    border: 'none', borderRadius: 8, fontWeight: 600, cursor: title.trim() ? 'pointer' : 'not-allowed',
                    opacity: title.trim() ? 1 : 0.5
                  }}
                >
                  {t('task.update')}
                </button>
              </>
            ) : (
              <button 
                onClick={handleClose}
                style={{padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer'}}
              >
                {t('task.close')}
              </button>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}
