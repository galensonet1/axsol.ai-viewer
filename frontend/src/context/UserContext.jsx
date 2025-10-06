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
    hasRole: (role) => user?.roles?.includes(role) ?? false,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
