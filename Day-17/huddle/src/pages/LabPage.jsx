import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../context/ToastContext';
import LabExample from '../components/lab/LabExample';
import { EXAMPLES, GROUPS, cleanupScratch } from '../lib/lab/examples';
import '../styles/lab.css';

export default function LabPage() {
  const { client, user } = useAuth();
  const toast = useToast();
  const [group, setGroup] = useState('all');
  const [cleaning, setCleaning] = useState(false);
  const ctx = useMemo(() => ({ client, userId: user?.id }), [client, user?.id]);

  useEffect(() => { document.title = 'Query lab · Huddle'; }, []);

  const cleanUp = async () => {
    setCleaning(true);
    const { error } = await cleanupScratch(client, user.id);
    setCleaning(false);
    if (error) toast.error(error.message);
    else toast.success('Scratch notes removed');
  };

  const visible = EXAMPLES.filter((example) => group === 'all' || example.group === group);

  return (
    <div className="lab-page">
      <h1 className="page-title">Query lab</h1>
      <p className="page-sub">{EXAMPLES.length} runnable supabase-js examples. Each one shows the code, the SQL it becomes, and the real result from your local database, as you.</p>
      <div className="alert alert-info lab-safe" role="note">
        Safe to play with: examples only touch notes titled "lab-scratch-..." that belong to you, and delete them right after.
        <button type="button" className="btn btn-sm" onClick={cleanUp} disabled={cleaning}>{cleaning ? 'Cleaning...' : 'Remove leftover scratch notes'}</button>
      </div>
      <div className="lab-filters" role="group" aria-label="Filter examples by topic">
        <button type="button" className="btn btn-sm lab-chip" aria-pressed={group === 'all'} onClick={() => setGroup('all')}>All ({EXAMPLES.length})</button>
        {GROUPS.map((entry) => (
          <button key={entry.id} type="button" className="btn btn-sm lab-chip" aria-pressed={group === entry.id} onClick={() => setGroup(entry.id)}>
            {entry.label} ({EXAMPLES.filter((example) => example.group === entry.id).length})
          </button>
        ))}
      </div>
      <div className="lab-list">
        {visible.map((example) => <LabExample key={example.id} example={example} ctx={ctx} />)}
      </div>
    </div>
  );
}
