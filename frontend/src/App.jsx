import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProfileProvider } from './context/ProfileContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import TrendsPage from './pages/TrendsPage';
import TimelinePage from './pages/TimelinePage';
import Login from './pages/Login';
import UploadModal from './components/UploadModal';
import AddProfileModal from './components/AddProfileModal';
import EditProfileModal from './components/EditProfileModal';
import AIAssistantModal from './components/AIAssistantModal';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAddProfileOpen, setIsAddProfileOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--accent-sky)',
        fontWeight: 600
      }}>
        Initializing MediVault AI System...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <ProfileProvider>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar
          onOpenUpload={() => setIsUploadOpen(true)}
          onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <main style={{ flex: 1, maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '24px 16px' }}>
          {activeTab === 'dashboard' && (
            <Dashboard
              key={refreshKey}
              onOpenUpload={() => setIsUploadOpen(true)}
              onOpenAddProfile={() => setIsAddProfileOpen(true)}
              onOpenEditProfile={(profile) => setEditingProfile(profile)}
              onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'trends' && (
            <TrendsPage
              key={refreshKey}
              onOpenAddProfile={() => setIsAddProfileOpen(true)}
              onOpenEditProfile={(profile) => setEditingProfile(profile)}
            />
          )}

          {activeTab === 'timeline' && (
            <TimelinePage
              key={refreshKey}
              onOpenAddProfile={() => setIsAddProfileOpen(true)}
              onOpenEditProfile={(profile) => setEditingProfile(profile)}
            />
          )}

          {activeTab === 'documents' && (
            <Documents
              key={refreshKey}
              onOpenAddProfile={() => setIsAddProfileOpen(true)}
              onOpenEditProfile={(profile) => setEditingProfile(profile)}
            />
          )}
        </main>

        <UploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onSuccess={() => setRefreshKey(prev => prev + 1)}
        />

        <AddProfileModal
          isOpen={isAddProfileOpen}
          onClose={() => setIsAddProfileOpen(false)}
        />

        <EditProfileModal
          isOpen={!!editingProfile}
          profileToEdit={editingProfile}
          onClose={() => setEditingProfile(null)}
        />

        <AIAssistantModal
          isOpen={isAIAssistantOpen}
          onClose={() => setIsAIAssistantOpen(false)}
        />
      </div>
    </ProfileProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
