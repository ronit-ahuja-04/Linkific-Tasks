import { useState } from 'react';
import PageHeader from '../../components/layout/PageHeader.jsx';
import { Directory } from '../../components/directory/Directory.jsx';
import { UserPosts } from '../../components/directory/UserPosts.jsx';

export default function DirectoryPage() {
  // Local for now: M2 moves the selected user into the URL (/directory/:userId?)
  const [selectedUserId, setSelectedUserId] = useState(null);

  return (
    <div className="station-view station-directory">
      <PageHeader breadcrumb="DIRECTORY" title="Attendee Directory" pill="Live API" />

      <div className="station-live-grid">
        <Directory selectedUserId={selectedUserId} onSelectUser={setSelectedUserId} />
        <UserPosts userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      </div>
    </div>
  );
}
