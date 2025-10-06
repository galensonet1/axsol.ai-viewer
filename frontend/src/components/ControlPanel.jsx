import React from 'react';
import LayerSelector from './LayerSelector';
import CzmlUploader from './CzmlUploader';
import { useUser } from '../context/UserContext.jsx';
import './ControlPanel.css';

import { useProject } from '../context/ProjectContext';

const ControlPanel = ({ layerVisibility, onLayerVisibilityChange }) => {
  const { hasRole } = useUser();
  const { loadLocalCzml } = useProject();

  return (
    <div className="control-panel">
      <LayerSelector
        layerVisibility={layerVisibility}
        onLayerVisibilityChange={onLayerVisibilityChange}
      />

      {hasRole('Admin') && (
        <div className="control-panel-admin">
          <CzmlUploader onCzmlLoaded={loadLocalCzml} />
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
