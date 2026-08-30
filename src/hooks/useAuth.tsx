import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginAdminRemote, verifyAuthRemote, setAuthToken, getAuthToken } from '../services/api';

export type UserRole = 'admin' | 'guest';

interface AuthContextType {
  role: UserRole;
  isAdmin: boolean;
  isGuest: boolean;
  loginAsAdmin: (password: string) => Promise<boolean>;
  logoutToGuest: () => void;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  authError: string | null;
  clearAuthError: () => void;
  isVerifying: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>(() => {
    // 检查本地是否存在已有 Token
    return getAuthToken() ? 'admin' : 'guest';
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // 页面初始化时向后端验证 Token 真实有效性（防止本地被伪造或过期）
  useEffect(() => {
    const existingToken = getAuthToken();
    if (existingToken) {
      setIsVerifying(true);
      verifyAuthRemote()
        .then((res) => {
          if (res.success && res.isAdmin) {
            setRole('admin');
          } else {
            setRole('guest');
            setAuthToken(null);
          }
        })
        .catch(() => {
          // 离线时保持现有状态
        })
        .finally(() => {
          setIsVerifying(false);
        });
    }
  }, []);

  /**
   * 馆长登录：通过服务端 /api/auth/login 校验密码并获取动态 HMAC Token
   */
  const loginAsAdmin = async (password: string): Promise<boolean> => {
    setAuthError(null);
    const cleanPwd = password.trim();

    if (!cleanPwd) {
      setAuthError('请输入馆长口令');
      return false;
    }

    const res = await loginAdminRemote(cleanPwd);
    if (res.success && res.token) {
      setRole('admin');
      setIsAuthModalOpen(false);
      setAuthError(null);
      return true;
    } else {
      setAuthError(res.error || '口令错误，请重试');
      return false;
    }
  };

  /**
   * 退出馆长模式，回归游客权限
   */
  const logoutToGuest = () => {
    setRole('guest');
    setAuthToken(null);
    setIsAuthModalOpen(false);
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        isAdmin: role === 'admin',
        isGuest: role === 'guest',
        loginAsAdmin,
        logoutToGuest,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => {
          setIsAuthModalOpen(false);
          setAuthError(null);
        },
        authError,
        clearAuthError: () => setAuthError(null),
        isVerifying,
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
