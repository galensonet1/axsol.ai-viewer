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
        console.warn('[ProjectPermissions] Error fetching permissions (non-blocking):', error.response?.status, error.message);
        
        // En caso de error, establecer permisos por defecto basados en roles globales
        const defaultPermissions = {
          permission_level: 'viewer', // Por defecto viewer
          can_edit: false,
          error: true,
          errorMessage: `Error ${error.response?.status || 'unknown'}: ${error.message}`
        };
        
        setPermissions(defaultPermissions);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [projectId, user?.id]);

  // Función para verificar si el usuario puede editar el proyecto
  const canEditProject = () => {
    if (!user) {
      console.log('[ProjectPermissions] No user found');
      return false;
    }
    
    // 1. Verificar roles globales (Superadmin o Admin) - estos siempre tienen acceso
    const isSuperadmin = user?.roleIds?.includes(6) || user?.roles?.includes('Superadmin');
    const isAdmin = user?.roleIds?.includes(5) || user?.roles?.includes('Admin');
    
    if (isSuperadmin || isAdmin) {
      console.log('[ProjectPermissions] User has global admin role (Superadmin:', isSuperadmin, 'Admin:', isAdmin, ')');
      return true;
    }
    
    // 2. Si hay error en permisos, denegar acceso pero no bloquear la UI
    if (permissions?.error) {
      console.log('[ProjectPermissions] Permissions error, denying edit access:', permissions.errorMessage);
      return false;
    }
    
    // 3. Verificar permisos específicos del proyecto
    const hasProjectAdminPermission = permissions?.permission_level === 'admin';
    const hasProjectEditPermission = permissions?.can_edit === true;
    
    if (hasProjectAdminPermission || hasProjectEditPermission) {
      console.log('[ProjectPermissions] User has project edit permission (admin:', hasProjectAdminPermission, 'edit:', hasProjectEditPermission, ')');
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
