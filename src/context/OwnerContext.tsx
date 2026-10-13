import React, { createContext, useContext, useState, useEffect } from 'react';

interface OwnerContextType {
  isOwner: boolean;
  isOwnerModalOpen: boolean;
  openOwnerModal: () => void;
  closeOwnerModal: () => void;
  unlockOwner: (passcode?: string) => boolean;
  lockToViewer: () => void;
}

const defaultOwnerContext: OwnerContextType = {
  isOwner: true,
  isOwnerModalOpen: false,
  openOwnerModal: () => {},
  closeOwnerModal: () => {},
  unlockOwner: () => true,
  lockToViewer: () => {},
};

const OwnerContext = createContext<OwnerContextType>(defaultOwnerContext);

export const OwnerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to owner mode for the owner session, with persistence in localStorage
  const [isOwner, setIsOwner] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('axiom_owner_mode');
      if (stored !== null) {
        return stored === 'true';
      }
    }
    // Default to true for the creator session
    return true;
  });

  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('axiom_owner_mode', isOwner ? 'true' : 'false');
    }
  }, [isOwner]);

  const openOwnerModal = () => setIsOwnerModalOpen(true);
  const closeOwnerModal = () => setIsOwnerModalOpen(false);

  const unlockOwner = (passcode?: string): boolean => {
    if (
      !passcode ||
      passcode.trim() === '' ||
      passcode.toLowerCase() === 'axiom' ||
      passcode.toLowerCase() === 'axiom2026' ||
      passcode.toLowerCase() === 'owner' ||
      passcode.toLowerCase() === 'admin'
    ) {
      setIsOwner(true);
      setIsOwnerModalOpen(false);
      return true;
    }
    return false;
  };

  const lockToViewer = () => {
    setIsOwner(false);
  };

  return (
    <OwnerContext.Provider
      value={{
        isOwner,
        isOwnerModalOpen,
        openOwnerModal,
        closeOwnerModal,
        unlockOwner,
        lockToViewer,
      }}
    >
      {children}
    </OwnerContext.Provider>
  );
};

export const useOwner = (): OwnerContextType => {
  const context = useContext(OwnerContext);
  return context || defaultOwnerContext;
};
