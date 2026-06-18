import { useState } from 'react';
import useDeviceType from './hooks/useDeviceType';
import MobileShell from './mobile/MobileShell';
import UploadPage from './desktop/UploadPage';

export default function App() {
  const isMobile = useDeviceType();
  const [session, setSession] = useState(() => {
    const savedSession = localStorage.getItem('rp_session');
    if (savedSession) {
      try {
        return JSON.parse(savedSession);
      } catch (e) {
        console.error('Failed to parse saved session', e);
      }
    }
    return null;
  });

  const handleAuthSuccess = (newSession) => {
    setSession(newSession);
  };

  const handleLogOut = () => {
    localStorage.removeItem('rp_session');
    setSession(null);
  };

  if (isMobile) {
    return (
      <MobileShell 
        session={session} 
        onAuthSuccess={handleAuthSuccess} 
        onLogOut={handleLogOut} 
      />
    );
  }

  return (
    <UploadPage 
      session={session} 
      onAuthSuccess={handleAuthSuccess} 
      onLogOut={handleLogOut} 
    />
  );
}
