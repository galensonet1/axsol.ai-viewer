import React from 'react';
import './CzmlUploader.css';

const CzmlUploader = ({ onCzmlLoaded }) => {
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const czmlData = JSON.parse(e.target.result);
        onCzmlLoaded(czmlData);
        alert('Archivo CZML cargado y visualizado con éxito.');
      } catch (error) {
        console.error('Error parsing CZML file:', error);
        alert('Error: El archivo no es un CZML válido en formato JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="czml-uploader-container">
      <label htmlFor="czml-upload" className="czml-uploader-label">Cargar CZML Local</label>
      <input 
        id="czml-upload"
        type="file" 
        accept=".czml" 
        onChange={handleFileChange} 
        className="czml-uploader-input"
      />
    </div>
  );
};

export default CzmlUploader;
