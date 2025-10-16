import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import api from '../config/api';

export const useProjectPermissions = (projectId) => {
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!projectId || !user?.id) {
        setLoading(false);
        return;
      }

      try {
        console.log('[ProjectPermissions] Fetching permissions for project:', projectId, 'user:', user.id);
        
        // Verificar permisos específicos del proyecto
        const response = await api.get(`/api/projects/${projectId}/permissions`);
        const projectPermissions = response.data;
        
        console.log('[ProjectPermissions] Project permissions:', projectPermissions);
        setPermissions(projectPermissions);
      } catch (error) {
        console.error('[ProjectPermissions] Error fetching permissions:', error);
        setPermissions(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [projectId, user?.id]);

  // Función para verificar si el usuario puede editar el proyecto
  const canEditProject = () => {
    if (!user) return false;
    
    // 1. Verificar roles globales (Superadmin o Admin)
    const isSuperadmin = user?.roleIds?.includes(6) || user?.roles?.includes('Superadmin');
    const isAdmin = user?.roleIds?.includes(5) || user?.roles?.includes('Admin');
    
    if (isSuperadmin || isAdmin) {
      console.log('[ProjectPermissions] User has global admin role');
      return true;
    }
    
    // 2. Verificar permisos específicos del proyecto
    const hasProjectAdminPermission = permissions?.permission_level === 'admin';
    
    if (hasProjectAdminPermission) {
      console.log('[ProjectPermissions] User has project admin permission');
      return true;
    }
    
    console.log('[ProjectPermissions] User does not have edit permissions');
    return false;
  };

  return {
    permissions,
    loading,
    canEditProject,
  };
};
