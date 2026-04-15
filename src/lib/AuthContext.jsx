import React, { createContext, useContext } from 'react';

// Auth is completely bypassed — app runs locally with no login required

const AuthContext = createContext();

const LOCAL_USER = {
  id: 'local-user',
  email: 'local@fintrack.app',
  full_name: 'Local User',
};

export const AuthProvider = ({ children }) => {
  const value = {
    user: LOCAL_USER,
    isAuthenticated: true,
    isLoadingAuth: false,
    isLoadingPublicSettings: false,
    authError: null,
    appPublicSettings: { id: 'local', public_settings: {} },
    logout: () => {},
    navigateToLogin: () => {},
    checkAppState: () => {},
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
