import React from 'react';
import useDeviceType from './hooks/useDeviceType';
import MobileShell from './mobile/MobileShell';
import UploadPage from './desktop/UploadPage';

export default function App() {
  const isMobile = useDeviceType();

  if (isMobile) {
    return <MobileShell />;
  }

  return <UploadPage />;
}
