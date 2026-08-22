import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'admin' | 'guest';

interface AuthContextType {
  role: UserRole;
  isAdmin: boolean;
  isGuest: boolean;
  loginAsAdmin: (password: string) => boolean;
  logoutToGuest: () => void;
  updateAdminPassword: (oldPwd: string, newPwd: string) => boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const DEFAULT_ADMIN_PASSWORD = 'admin888';
const STORAGE_ADMIN_SESSION_KEY = 'tagmesh_admin_session_active';
const STORAGE_ADMIN_PWD_KEY = 'tagmesh_custom_admin_password';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to 'guest' role unless admin session exists
  const [role, setRole] = useState<UserRole>(() => {
    try {
      const active = sessionStorage.getItem(STORAGE_ADMIN_SESSION_KEY);
      return active === 'true' ? 'admin' : 'guest';
    } catch {
      return 'guest';
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const getStoredPassword = (): string => {
    try {
      return localStorage.getItem(STORAGE_ADMIN_PWD_KEY) || DEFAULT_ADMIN_PASSWORD;
    } catch {
      return DEFAULT_ADMIN_PASSWORD;
    }
  };

  const loginAsAdmin = (password: string): boolean => {
    const validPwd = getStoredPassword();
    if (password === validPwd) {
      setRole('admin');
      try {
        sessionStorage.setItem(STORAGE_ADMIN_SESSION_KEY, 'true');
      } catch {
        // ignore
      }
      setIsAuthModalOpen(false);
      return true;
    }
    return false;
  };

  const logoutToGuest = () => {
    setRole('guest');
    try {
      sessionStorage.removeItem(STORAGE_ADMIN_SESSION_KEY);
    } catch {
      // ignore
    }
    setIsAuthModalOpen(false);
  };

  const updateAdminPassword = (oldPwd: string, newPwd: string): boolean => {
    const validPwd = getStoredPassword();
    if (oldPwd === validPwd && newPwd.trim().length >= 4) {
      try {
        localStorage.setItem(STORAGE_ADMIN_PWD_KEY, newPwd.trim());
        return true;
      } catch {
        return false;
      }
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        isAdmin: role === 'admin',
        isGuest: role === 'guest',
        loginAsAdmin,
        logoutToGuest,
        updateAdminPassword,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
