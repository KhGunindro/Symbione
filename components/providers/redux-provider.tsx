'use client';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/lib/store/store';
import { useEffect, useState } from 'react';

interface ReduxProviderProps {
  children: React.ReactNode;
}

export default function ReduxProvider({ children }: ReduxProviderProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render anything until we're on the client
  if (!isClient) {
    return <div>{children}</div>;
  }

  return (
    <Provider store={store}>
      <PersistGate loading={<div>{children}</div>} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}