import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext(null);

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const value = {
    user,
    setUser,
    loadingUser,
    setLoadingUser,
    // Conveniencia para chequear roles
    hasRole: (role) => {
      console.log('[UserContext] Checking role:', role, 'User:', user);
      console.log('[UserContext] User roles:', user?.roles);
      console.log('[UserContext] User role_name:', user?.role_name);
      
      // Verificar tanto en roles array como en role_name
      const hasRoleInArray = user?.roles?.includes(role) ?? false;
      const hasRoleInName = user?.role_name === role;
      
      console.log('[UserContext] hasRoleInArray:', hasRoleInArray, 'hasRoleInName:', hasRoleInName);
      
      return hasRoleInArray || hasRoleInName;
    },
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
