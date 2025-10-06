import React from 'react';
import ProjectLayout from '../components/ProjectLayout';
import { ProjectProvider } from '../context/ProjectContext';

const ProjectDetailPage = () => {
  // Envolvemos el layout con el ProjectProvider para que todos los componentes
  // hijos tengan acceso al contexto del proyecto (datos, estado de carga, etc.)
  return (
    <ProjectProvider>
      <ProjectLayout />
    </ProjectProvider>
  );
};

export default ProjectDetailPage;
