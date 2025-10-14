import React from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Box, Button, Stack } from '@mui/material';

export default function ImageCropper({ src, onSave, onCancel }) {
  const [crop, setCrop] = React.useState({ unit: '%', width: 80, aspect: undefined });
  const imgRef = React.useRef(null);
  const [cropping, setCropping] = React.useState(false);

  const onImageLoaded = (img) => {
    imgRef.current = img;
  };

  const getCroppedBlobUrl = async (image, crop) => {
    if (!crop || !image) return null;
    const canvas = document.createElement('canvas');
    const pixelRatio = window.devicePixelRatio || 1;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const width = Math.round(crop.width * scaleX);
    const height = Math.round(crop.height * scaleY);

    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      width,
      height
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(null);
          const url = URL.createObjectURL(blob);
          resolve({ blob, url });
        },
        'image/jpeg',
        0.95
      );
    });
  };

  const handleSave = async () => {
    if (!imgRef.current) return;
    setCropping(true);
    try {
      const out = await getCroppedBlobUrl(imgRef.current, crop);
      if (out && onSave) onSave(out);
    } finally {
      setCropping(false);
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', p: 2, boxSizing: 'border-box' }}>
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
        <ReactCrop crop={crop} onChange={(c) => setCrop(c)} onComplete={(c) => setCrop(c)}>
          <img src={src} alt="to-crop" onLoad={(e) => onImageLoaded(e.currentTarget)} style={{ maxWidth: '100%', maxHeight: '100%' }} />
        </ReactCrop>
      </Box>
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', mt: 2 }}>
        <Button onClick={onCancel} variant="outlined">Cancelar</Button>
        <Button onClick={handleSave} variant="contained" disabled={cropping}>Guardar</Button>
      </Stack>
    </Box>
  );
}
