import React, { createContext, useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import useApi from '../hooks/useApi';

const ProjectContext = createContext();

export const useProject = () => useContext(ProjectContext);

export const ProjectProvider = ({ children }) => {
  const { projectId } = useParams();

  // Hooks para cargar todos los datos del proyecto
  const { data: projectData, loading: projectLoading, error: projectError } = useApi(`/projects/${projectId}`);
  const { data: layoutData, loading: layoutLoading, error: layoutError } = useApi(`/projects/${projectId}/layout`);
  const { data: externalAssets, loading: assetsLoading, error: assetsError } = useApi(`/projects/${projectId}/assets`);
  const { data: config, loading: configLoading, error: configError } = useApi('/config');

  const [loadedCzml, setLoadedCzml] = useState(null);

  const loadLocalCzml = (czmlData) => {
    setLoadedCzml(czmlData);
  };

  const value = {
    loadLocalCzml,
    loadedCzml,
    projectId,
    projectData,
    layoutData,
    externalAssets,
    config,
    projectLoading,
    layoutLoading,
    assetsLoading,
    configLoading,
    projectError,
    layoutError,
    assetsError,
    configError,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};
