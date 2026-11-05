import { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { createDraftTask } from '../lib/board';
import { errorMessageOf } from '../lib/serialize';
import { useProjectSync, useUserSync } from '../store/useFirebaseSync';
import { selectUser, signOutUser } from '../store/slices/authSlice';
import { selectTheme, toggleTheme as toggleThemeThunk } from '../store/slices/themeSlice';
import { selectUsersById } from '../store/slices/usersSlice';
import { createProject, deleteProject, makeSelectProject, selectProjects, selectProjectsLoading } from '../store/slices/projectsSlice';
import { createTask, deleteTask, dragTask, selectBoard, selectBoardError, boardErrorCleared, taskUpdated } from '../store/slices/boardSlice';
import { acceptInvite, declineInvite, selectInvitations, sendInvite } from '../store/slices/invitationsSlice';
import {
  clearUnreadMessages, dismissAllNotifications, dismissNotification, notifyProjectMembers as notifyProjectMembersThunk,
  selectNotifications, selectToasts, selectUnreadMessages, toastDismissed, toastsCleared,
} from '../store/slices/notificationsSlice';
import {
  errorDismissed, errorShown, modalClosed, modalOpened, selectActiveTab, selectErrorMessage, selectHasNewActivity,
  selectModals, selectSuccessMessage, selectTaskPanel, successDismissed, successShown, tabChanged,
  taskPanelClosed, taskPanelOpened,
} from '../store/slices/uiSlice';
import { 
  LayoutDashboard, 
  Briefcase, 
  CheckSquare, 
  Calendar, 
  MessageSquare,
  Users,
  Settings,
  Hash,
  Search,
  Bell,
  Sun,
  Moon,
  Plus,
  MoreHorizontal,
  Paperclip,
  Trash,
  Edit2
} from 'lucide-react';
import Logo from '../components/Logo';
import CalendarSync from '../components/CalendarSync';
import Modal from '../components/Modal';
import Chat from '../components/Chat';
import TaskPanel from '../components/TaskPanel';
import MessagesView from '../components/MessagesView';
import '../index.css';

function Dashboard() {
  // REDUX: useSelector subscribes this component to slices of the store, and useDispatch returns
  // the function that sends actions. All the shared state that used to be ~25 useState calls
  // (board, projects, users, invites, notifications, theme, modals, task panel) now lives in Redux.
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const theme = useSelector(selectTheme);
  const data = useSelector(selectBoard);
  const projects = useSelector(selectProjects);
  const isProjectsLoading = useSelector(selectProjectsLoading);
  const usersMap = useSelector(selectUsersById);
  const invites = useSelector(selectInvitations);
  const notifications = useSelector(selectNotifications);
  const toasts = useSelector(selectToasts);
  const unreadMessages = useSelector(selectUnreadMessages);
  const activeTab = useSelector(selectActiveTab);
  const hasNewActivity = useSelector(selectHasNewActivity);
  const modals = useSelector(selectModals);
  const errorModalMsg = useSelector(selectErrorMessage);
  const successModalMsg = useSelector(selectSuccessMessage);
  const { open: isTaskPanelOpen, task: selectedTask } = useSelector(selectTaskPanel);
  const boardError = useSelector(selectBoardError);

  const navigate = useNavigate();
  const location = useLocation();

  // Extract projectId from URL path manually since we use '/*' in App.jsx
  const match = location.pathname.match(/^\/projects\/([a-zA-Z0-9_-]+)/);
  const urlProjectId = match ? match[1] : null;

  // Use URL param for selected project, fallback to null
  const selectedProjectId = urlProjectId || null;

  // Determine current view from URL
  const currentPath = location.pathname;
  let globalView = 'projects';
  if (currentPath.includes('/messages')) globalView = 'messages';
  if (currentPath.includes('/settings')) globalView = 'settings';
  if (currentPath.includes('/profile')) globalView = 'profile';
  if (currentPath.includes('/notifications')) globalView = 'notifications';

  // Local state is kept only for form fields that nothing else needs
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectAssignerEmail, setNewProjectAssignerEmail] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const inviteDropdownRef = useRef(null);

  // Start the Firestore listeners. They dispatch snapshots into the store (see store/listeners.js).
  useUserSync(user);
  useProjectSync(selectedProjectId, user?.uid);

  // A selector factory: only re-render when THIS project changes, not when any project does
  const selectActiveProject = useMemo(() => makeSelectProject(selectedProjectId), [selectedProjectId]);
  const activeProject = useSelector(selectActiveProject);
  const isOwner = user?.uid === activeProject?.owner;

  // Route redirect effect
  useEffect(() => {
    if (projects.length > 0 && !isProjectsLoading) {
      if (currentPath === '/') {
        navigate(`/projects/${projects[0].id}`, { replace: true });
      } else if (urlProjectId && !projects.find(p => p.id === urlProjectId)) {
        navigate(`/projects/${projects[0].id}`, { replace: true });
      }
    }
  }, [currentPath, urlProjectId, projects, isProjectsLoading, navigate]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Close the invite dropdown when clicking outside it
  useEffect(() => {
    function handleClickOutside(event) {
      if (inviteDropdownRef.current && !inviteDropdownRef.current.contains(event.target)) {
        dispatch(modalClosed('invite'));
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dispatch]);

  // Auto-dismiss toasts after 3 seconds
  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => dispatch(toastsCleared()), 3000);
      return () => clearTimeout(timer);
    }
  }, [toasts, dispatch]);

  // A failed optimistic write (e.g. a drag) was rolled back by the board slice: tell the user
  useEffect(() => {
    if (boardError) {
      dispatch(errorShown(boardError));
      dispatch(boardErrorCleared());
    }
  }, [boardError, dispatch]);

  const toggleTheme = () => dispatch(toggleThemeThunk());

  // Passed to Chat, which still writes its own messages
  const notifyProjectMembers = (message, projectId) =>
    dispatch(notifyProjectMembersThunk({ message, projectId }));

  const handleCreateNewProject = async (e) => {
    e?.preventDefault();
    if (!newProjectName.trim()) return;
    try {
      // unwrap() turns a rejected thunk into a thrown error so we can use try/catch
      const { id } = await dispatch(
        createProject({ name: newProjectName, ownerEmail: newProjectAssignerEmail })
      ).unwrap();
      dispatch(successShown(`Created project "${newProjectName}"!`));
      dispatch(modalClosed('newProject'));
      setNewProjectName('');
      setNewProjectAssignerEmail('');
      navigate(`/projects/${id}`);
    } catch (err) {
      dispatch(errorShown(errorMessageOf(err)));
    }
  };

  const handleDismissNotification = (notifId) => dispatch(dismissNotification(notifId));

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail || !selectedProjectId || !activeProject) return;
    try {
      const { displayName } = await dispatch(sendInvite({ email: inviteEmail, projectId: selectedProjectId })).unwrap();
      dispatch(modalClosed('invite'));
      setInviteEmail('');
      dispatch(successShown(`Invitation sent to ${displayName}!`));
    } catch (err) {
      dispatch(errorShown(errorMessageOf(err)));
    }
  };

  const handleAcceptInvite = async (invite) => {
    try {
      await dispatch(acceptInvite(invite)).unwrap();
      dispatch(successShown(`You joined ${invite.projectName}!`));
    } catch (err) {
      dispatch(errorShown(errorMessageOf(err, 'Failed to join project.')));
    }
  };

  const handleDeclineInvite = (inviteId) => dispatch(declineInvite(inviteId));

  // Drag and drop: the dragTask thunk moves the card at once and writes to Firestore, and the
  // board slice puts the card back if the write fails (optimistic update with rollback).
  const onDragEnd = ({ source, destination, draggableId }) => {
    dispatch(dragTask({ source, destination, draggableId }));
  };

  const handleAddTask = (columnId) => {
    if (!selectedProjectId) return;
    // Open the panel on a draft task; it is only saved when the user submits it
    dispatch(taskPanelOpened(createDraftTask({ columnId, uid: user?.uid })));
  };

  const handleCreateDraftTask = (task) => {
    if (!selectedProjectId) return;
    dispatch(createTask({ task, columnId: task._columnId }));
  };

  const handleDeleteTask = (taskId) => {
    if (!selectedProjectId) return;
    dispatch(deleteTask(taskId));
  };

  const updateTaskInState = (updatedTask) => dispatch(taskUpdated(updatedTask));

  const handleDeleteProject = () => {
    if (!isOwner || !selectedProjectId) return;
    dispatch(modalOpened('deleteProject'));
  };

  const confirmDeleteProject = async () => {
    try {
      await dispatch(deleteProject(selectedProjectId)).unwrap();
      dispatch(modalClosed('deleteProject'));
      navigate('/'); // Go back to dashboard/home
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Failed to delete project. Please try again.');
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo" style={{ marginBottom: '32px', cursor: 'pointer' }} onClick={() => {
          if (projects.length > 0) navigate(`/projects/${projects[0].id}`);
          else navigate('/');
        }}>
          <Logo size={28} />
          FlowLane
        </div>
        
        <p style={{fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '12px', paddingLeft: '16px'}}>Main Menu</p>
        <ul className="nav-menu" style={{marginBottom: '24px'}}>
          <li 
            className={`nav-item ${globalView === 'messages' ? 'active' : ''}`}
            onClick={() => {
              navigate('/messages');
              dispatch(clearUnreadMessages());
            }}
            style={{ position: 'relative' }}
          >
            <MessageSquare size={18} /> Messages
            {unreadMessages > 0 && (
              <span style={{
                position: 'absolute', right: 16, background: '#FF5630', color: '#FFF', 
                fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10,
                minWidth: 18, textAlign: 'center'
              }}>
                {unreadMessages > 9 ? '9+' : unreadMessages}
              </span>
            )}
          </li>
        </ul>

        <p style={{fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '12px', paddingLeft: '16px'}}>Your Projects</p>
        <ul className="nav-menu">
          {projects.map(project => (
            <li 
              key={project.id}
              className={`nav-item ${selectedProjectId === project.id && globalView === 'projects' ? 'active' : ''}`}
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <Briefcase size={18} /> {project.name}
            </li>
          ))}
          <li className="nav-item" onClick={() => dispatch(modalOpened('newProject'))} style={{color: 'var(--primary-color)'}}>
            <Plus size={18} /> New Project
          </li>
        </ul>

        <CalendarSync />

        <div style={{marginTop: 'auto'}}>
          <ul className="nav-menu">
            <li className={`nav-item ${globalView === 'settings' ? 'active' : ''}`} onClick={() => navigate('/settings')}><Settings size={18} /> Settings</li>
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-actions">
            <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button className="icon-btn" onClick={() => navigate('/notifications')}><Bell size={20} /></button>
            {user && (
               <div 
                 onClick={() => navigate('/profile')}
                 style={{width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--border-color)', backgroundImage: `url(${user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`})`, backgroundSize: 'cover', cursor: 'pointer'}} 
               />
            )}
          </div>
        </header>

        {globalView === 'settings' && (
          <div style={{padding: '40px 60px', maxWidth: 800, margin: '0 auto', width: '100%'}}>
            <button 
              onClick={() => navigate(selectedProjectId ? `/projects/${selectedProjectId}` : '/')}
              style={{background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 32, fontSize: 14, fontWeight: 500, padding: 0}}
            >
              ← Back to Dashboard
            </button>
            <h2 style={{fontSize: 28, marginBottom: 32}}>Settings</h2>
            
            <div style={{background: 'var(--bg-secondary)', borderRadius: 12, padding: 24, border: '1px solid var(--border-color)', marginBottom: 24}}>
              <h3 style={{fontSize: 16, marginBottom: 16}}>Appearance</h3>
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <div>
                  <div style={{fontWeight: 600, fontSize: 15, marginBottom: 4}}>Dark Mode</div>
                  <div style={{color: 'var(--text-secondary)', fontSize: 13}}>Switch between light and dark themes.</div>
                </div>
                <button 
                  onClick={toggleTheme}
                  style={{
                    width: 48, height: 26, borderRadius: 13, border: 'none', 
                    background: theme === 'dark' ? 'var(--primary-color)' : 'var(--border-color)',
                    position: 'relative', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 3, left: theme === 'dark' ? 25 : 3, transition: 'all 0.2s'
                  }} />
                </button>
              </div>
            </div>
          </div>
        )}

        {globalView === 'profile' && (
          <div style={{padding: '40px 60px', maxWidth: 800, margin: '0 auto', width: '100%'}}>
            <button 
              onClick={() => navigate(selectedProjectId ? `/projects/${selectedProjectId}` : '/')}
              style={{background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 32, fontSize: 14, fontWeight: 500, padding: 0}}
            >
              ← Back to Dashboard
            </button>
            <h2 style={{fontSize: 28, marginBottom: 32}}>My Profile</h2>
            
            <div style={{background: 'var(--bg-secondary)', borderRadius: 16, padding: '48px 40px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, textAlign: 'center', boxShadow: '0 12px 32px rgba(0,0,0,0.08)'}}>
              <div style={{
                width: 120, height: 120, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-color), #f43f5e)', 
                color: '#fff', fontSize: 48, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(244, 63, 94, 0.3)'
              }}>
                {user?.email?.[0].toUpperCase()}
              </div>
              
              <div>
                <div style={{fontSize: 28, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)', letterSpacing: '-0.5px'}}>{user?.displayName || 'FlowLane User'}</div>
                <div style={{color: 'var(--text-secondary)', fontSize: 16}}>{user?.email}</div>
              </div>

              <div style={{width: '100%', height: 1, background: 'var(--border-color)', margin: '16px 0'}}></div>

              <button 
                onClick={() => dispatch(signOutUser())}
                style={{
                  padding: '14px 48px', borderRadius: 100, border: '2px solid #ef4444', 
                  background: 'transparent', color: '#ef4444', fontWeight: 700, cursor: 'pointer',
                  fontSize: 15, transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '1px'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ef4444'; }}
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {globalView === 'notifications' && (
          <div style={{padding: '40px 60px', maxWidth: 800, margin: '0 auto', width: '100%', height: '100vh', display: 'flex', flexDirection: 'column'}}>
            <button 
              onClick={() => navigate(selectedProjectId ? `/projects/${selectedProjectId}` : '/')}
              style={{background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 32, fontSize: 14, fontWeight: 500, padding: 0}}
            >
              ← Back to Dashboard
            </button>
            
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32}}>
              <h2 style={{fontSize: 28}}>Notifications Center</h2>
              {notifications.length > 0 && (
                <button 
                  onClick={() => dispatch(dismissAllNotifications())}
                  style={{background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600}}
                >
                  Clear All
                </button>
              )}
            </div>
            
            <div style={{flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 40}}>
              {notifications.length === 0 ? (
                <div style={{textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)'}}>
                  <div style={{fontSize: 48, marginBottom: 16}}>📭</div>
                  <div style={{fontSize: 18, fontWeight: 500, marginBottom: 8}}>You're all caught up!</div>
                  <div style={{fontSize: 14}}>No new notifications to show.</div>
                </div>
              ) : (
                notifications.map(notif => (
                  <div 
                    key={notif.id}
                    onClick={() => {
                      if (notif.projectId) navigate(`/projects/${notif.projectId}`);
                      handleDismissNotification(notif.id);
                    }}
                    style={{
                      background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', 
                      borderRadius: 12, padding: 20, cursor: 'pointer', transition: 'all 0.2s',
                      borderLeft: '4px solid var(--primary-color)'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary-color)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                  >
                    <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                      <span style={{fontSize: 12, fontWeight: 700, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.5px'}}>New Notification</span>
                      <span style={{fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.4}}>{notif.message}</span>
                      <span style={{fontSize: 12, color: 'var(--text-secondary)', marginTop: 4}}>Click to view project</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {globalView === 'projects' && (
          isProjectsLoading ? (
            <div style={{display: 'flex', flexDirection: 'column', height: '100%', width: '100%', justifyContent: 'center', alignItems: 'center', flex: 1}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <Logo size={32} />
                <span style={{fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px'}}>FlowLane</span>
              </div>
              <div style={{marginTop: '24px', width: '200px', height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden'}}>
                <div style={{width: '30%', height: '100%', background: '#FF5630', borderRadius: '2px', animation: 'load 1.5s ease-in-out infinite'}} />
              </div>
              <style>{`
                @keyframes load {
                  0% { transform: translateX(-100%); }
                  100% { transform: translateX(400%); }
                }
              `}</style>
            </div>
          ) : (
          <>
            {/* Project Header */}
            <div className="project-header">
              <div className="project-title-row">
                <div>
                  <h1>{activeProject?.name || "Loading..."}</h1>
                  <p>Syncs in real-time across your team.</p>
                </div>
                <div className="project-users">
                  <div className="task-avatars">
                    {activeProject?.members?.slice(0, 3).map((uid) => {
                      const user = usersMap[uid];
                      const fallbackName = user?.displayName || user?.email || 'User';
                      const avatarSrc = user?.photoURL || `https://ui-avatars.com/api/?name=${fallbackName}&background=random`;
                      return (
                        <img key={uid} src={avatarSrc} className="avatar" title={`${fallbackName}${user?.email ? ` (${user.email})` : ''}`} style={{objectFit: 'cover'}} />
                      );
                    })}
                  </div>

                  <div style={{position: 'relative', display: 'flex', alignItems: 'center', gap: 8}} ref={inviteDropdownRef}>
                    <button 
                      onClick={() => dispatch(modals.invite ? modalClosed('invite') : modalOpened('invite'))}
                      style={{display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--text-primary)', color: 'var(--bg-main)', border: 'none', borderRadius: 20, fontWeight: 600, cursor: 'pointer', fontSize: 13}}
                    >
                      <Plus size={16} /> Invite
                    </button>

                    {isOwner && (
                      <button
                        onClick={handleDeleteProject}
                        style={{display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: 20, fontWeight: 600, cursor: 'pointer', fontSize: 13, transition: 'all 0.2s'}}
                        onMouseOver={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <Trash size={16} /> Delete Project
                      </button>
                    )}
                    
                    {modals.invite && (
                      <div style={{position: 'absolute', top: 40, right: 0, background: 'var(--bg-card)', padding: 16, borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.1)', zIndex: 100, width: 250, border: '1px solid var(--border-color)'}}>
                        <h4 style={{marginBottom: 12, fontSize: 14}}>Invite Team Member</h4>
                        <form onSubmit={handleInvite} style={{display: 'flex', flexDirection: 'column', gap: 10}}>
                          <input 
                            type="email" 
                            placeholder="Email address" 
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            style={{padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-primary)'}}
                            required
                          />
                          <button type="submit" style={{padding: '8px', borderRadius: 8, background: 'var(--primary-color)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer'}}>
                            Send Invite
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="project-tabs">
                <div className={`tab ${activeTab === 'board' ? 'active' : ''}`} onClick={() => dispatch(tabChanged('board'))}><LayoutDashboard size={14} style={{marginRight: 6, verticalAlign: 'middle', marginTop: -2}} /> Board</div>
                <div className={`tab ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => dispatch(tabChanged('activity'))}>
                  <MessageSquare size={14} style={{marginRight: 6, verticalAlign: 'middle', marginTop: -2}} /> Activity
                  {hasNewActivity && <span style={{display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#ef4444', marginLeft: 6}} />}
                </div>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'board' && (
              <div className="board-container">
                <DragDropContext onDragEnd={onDragEnd}>
                  {data.columnOrder.map((columnId) => {
                    const column = data.columns[columnId];
                    const tasks = column.taskIds.map(taskId => data.tasks[taskId]);

                    return (
                    <div className="column" key={column.id} data-status={column.id}>
                      <div className="column-header">
                        <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                          <span className="column-title">{column.title}</span>
                          <span className="column-count">{tasks.length}</span>
                        </div>
                        {column.id === data.columnOrder[0] && isOwner && (
                          <button 
                            onClick={() => handleAddTask(column.id)}
                            style={{display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 11}}
                          >
                            <Plus size={12} /> Add Task
                          </button>
                        )}
                      </div>
                      
                      <Droppable droppableId={column.id}>
                        {(provided) => (
                          <div 
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            style={{minHeight: 100, flex: 1, overflowY: 'auto', paddingRight: 4}}
                          >
                            {tasks.map((task, index) => (
                              <Draggable key={task.id} draggableId={task.id} index={index}>
                                {(provided) => (
                                  <div
                                    className="task-card"
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => { dispatch(taskPanelOpened(task)); }}
                                    style={{
                                      ...provided.draggableProps.style,
                                      cursor: 'pointer'}}
                                  >
                                    <div className="task-meta">
                                      <div className="task-date">
                                        <Calendar size={12} /> {task.date}
                                      </div>
                                      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                        <div className={`task-priority priority-${task.priority}`}>
                                          {task.priority}
                                        </div>
                                        {isOwner && (
                                          <div style={{display: 'flex', gap: '4px'}} onClick={(e) => e.stopPropagation()}>
                                            <button 
                                              onClick={() => { dispatch(taskPanelOpened(task)); }} 
                                              style={{background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-tertiary)'}} 
                                              title="Edit Task"
                                            >
                                              <Edit2 size={14} />
                                            </button>
                                            <button 
                                              onClick={() => handleDeleteTask(task.id, column.id)} 
                                              style={{background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-tertiary)'}} 
                                              title="Delete Task"
                                            >
                                              <Trash size={14} />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="task-title">
                                      {task.content}
                                    </div>
                                    
                                    <div className="task-footer">
                                      <div className="task-avatars">
                                        {task.users.map(uid => {
                                          const user = usersMap[uid];
                                          const fallbackName = user?.displayName || user?.email || 'User';
                                          const avatarSrc = user?.photoURL || `https://ui-avatars.com/api/?name=${fallbackName}&background=random`;
                                          return (
                                            <img key={uid} src={avatarSrc} className="avatar" title={`${fallbackName}${user?.email ? ` (${user.email})` : ''}`} style={{objectFit: 'cover'}} />
                                          );
                                        })}
                                      </div>
                                      
                                      <div className="task-tags">
                                        {task.tags.map(tag => (
                                          <span key={tag.id} className={`tag tag-${tag.type}`}>
                                            {tag.text}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  );
                })}
                </DragDropContext>
              </div>
            )}

            {activeTab === 'activity' && (
              <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
                <Chat 
                  projectId={selectedProjectId} 
                  isDirectMessage={false} 
                  notifyProjectMembers={notifyProjectMembers}
                />
              </div>
            )}
          </>
          )
        )}
        
        {globalView === 'messages' && (
          <MessagesView />
        )}
      </main>

      {/* New Project Modal */}
      <Modal 
        isOpen={modals.newProject} 
        onClose={() => dispatch(modalClosed('newProject'))} 
        title="Create New Project"
      >
        <form onSubmit={handleCreateNewProject} style={{display: 'flex', flexDirection: 'column', gap: 16}}>
          <div>
            <label style={{display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)'}}>Project Name</label>
            <input 
              type="text" 
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="e.g. Website Redesign"
              style={{width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-primary)', boxSizing: 'border-box'}}
              autoFocus
              required
            />
          </div>
          <div>
            <label style={{display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)'}}>Assigner (Owner) Email <span style={{fontWeight: 'normal', opacity: 0.6}}>(Optional)</span></label>
            <input 
              type="email" 
              value={newProjectAssignerEmail}
              onChange={(e) => setNewProjectAssignerEmail(e.target.value)}
              placeholder="Leave blank to assign yourself"
              style={{width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-primary)', boxSizing: 'border-box'}}
            />
          </div>
          <div style={{display: 'flex', justifyContent: 'flex-end', gap: 12}}>
            <button 
              type="button" 
              onClick={() => dispatch(modalClosed('newProject'))}
              style={{padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600}}
            >
              Cancel
            </button>
            <button 
              type="submit"
              style={{padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--primary-color)', color: '#fff', cursor: 'pointer', fontWeight: 600}}
            >
              Create Project
            </button>
          </div>
        </form>
      </Modal>

      {/* Error Modal */}
      <Modal 
        isOpen={!!errorModalMsg} 
        onClose={() => dispatch(errorDismissed())} 
        title="Error"
      >
        <p style={{color: 'var(--tag-high-text)', marginBottom: 20}}>{errorModalMsg}</p>
        <div style={{display: 'flex', justifyContent: 'flex-end'}}>
          <button 
            onClick={() => dispatch(errorDismissed())}
            style={{padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--tag-high-text)', color: '#fff', cursor: 'pointer', fontWeight: 600}}
          >
            Okay
          </button>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal 
        isOpen={!!successModalMsg} 
        onClose={() => dispatch(successDismissed())} 
        title="Success"
      >
        <p style={{color: 'var(--tag-dev-text)', marginBottom: 20}}>{successModalMsg}</p>
        <div style={{display: 'flex', justifyContent: 'flex-end'}}>
          <button 
            onClick={() => dispatch(successDismissed())}
            style={{padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--primary-color)', color: '#fff', cursor: 'pointer', fontWeight: 600}}
          >
            Awesome
          </button>
        </div>
      </Modal>

      {/* Toasts Layer */}
      <div className="toast-container">
        {invites.map(invite => (
          <div key={invite.id} className="toast">
            <div className="toast-content">
              <strong>{invite.inviterName}</strong> invited you to <strong>{invite.projectName}</strong>
            </div>
            <div className="toast-actions">
              <button className="btn-decline" onClick={() => handleDeclineInvite(invite.id)}>Decline</button>
              <button className="btn-accept" onClick={() => handleAcceptInvite(invite)}>Accept</button>
            </div>
          </div>
        ))}

        {toasts.slice(0, 4).map((toastItem, idx) => (
          <div 
            key={toastItem.id || idx} 
            className="toast" 
            style={{
              borderLeft: '4px solid var(--primary-color)', 
              cursor: 'pointer', 
              transition: 'all 0.2s ease',
              padding: '16px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
            }}
            onClick={() => {
              if (toastItem.projectId) navigate(`/projects/${toastItem.projectId}`);
              dispatch(toastDismissed(toastItem.id));
            }}
          >
            <div className="toast-content" style={{display: 'flex', flexDirection: 'column', gap: 6}}>
              <span style={{fontSize: 11, fontWeight: 700, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.5px'}}>New Notification</span>
              <span style={{fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.4}}>{toastItem.message}</span>
            </div>
          </div>
        ))}
        {toasts.length > 4 && (
          <div className="toast" style={{textAlign: 'center', fontSize: 12, padding: 8, color: 'var(--text-secondary)'}}>
            +{toasts.length - 4} more notifications
          </div>
        )}
      </div>

      <TaskPanel 
        isOpen={isTaskPanelOpen}
        onClose={() => dispatch(taskPanelClosed())}
        task={selectedTask}
        projectId={selectedProjectId}
        isOwner={isOwner}
        updateTaskInState={updateTaskInState}
        handleCreateDraftTask={handleCreateDraftTask}
        handleDeleteTask={handleDeleteTask}
        projectMembers={activeProject?.members || []}
        usersMap={usersMap}
      />

      <Modal
        isOpen={modals.deleteProject}
        onClose={() => dispatch(modalClosed('deleteProject'))}
        title="Delete Project"
      >
        <div style={{ padding: '0 4px' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
            Are you sure you want to delete <strong>{activeProject?.name}</strong>? This action cannot be undone and all tasks will be lost.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button 
              onClick={() => dispatch(modalClosed('deleteProject'))}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button 
              onClick={confirmDeleteProject}
              style={{ padding: '8px 16px', borderRadius: '8px', background: '#ef4444', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer' }}
            >
              Delete Project
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Dashboard;
