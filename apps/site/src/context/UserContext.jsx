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
    // Conveniencia para chequear roles y permisos
    hasRole: (role) => {
      console.log('[UserContext] Checking role:', role, 'User:', user);
      console.log('[UserContext] User roles:', user?.roles);
      console.log('[UserContext] User roleIds:', user?.roleIds);
      
      // Si es Admin, verificar:
      // 1. Rol Superadmin (roleId 6) o Admin (roleId 5)
      // 2. Rol en array de strings
      // 3. TODO: Verificar project_permissions para permission_level=admin
      if (role === 'Admin') {
        const isSuperadmin = user?.roleIds?.includes(6) || user?.roles?.includes('Superadmin');
        const isAdmin = user?.roleIds?.includes(5) || user?.roles?.includes('Admin');
        const hasAdminRole = isSuperadmin || isAdmin;
        
        console.log('[UserContext] isSuperadmin:', isSuperadmin, 'isAdmin:', isAdmin, 'hasAdminRole:', hasAdminRole);
        return hasAdminRole;
      }
      
      // Para otros roles, verificar en array de strings
      const hasRoleInArray = user?.roles?.includes(role) ?? false;
      console.log('[UserContext] hasRoleInArray:', hasRoleInArray);
      
      return hasRoleInArray;
    },
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
