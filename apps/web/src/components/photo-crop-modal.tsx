'use client';

import { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { getCroppedImage } from '@/lib/utils/crop-image';
import { Button } from '@sistema-odontologico/ui';
import { Loader2 } from 'lucide-react';

interface PhotoCropModalProps {
  /** The image file selected by the user */
  imageFile: File;
  /** Called when the user confirms the crop with the resulting Blob */
  onConfirm: (croppedBlob: Blob) => void;
  /** Called when the user cancels the modal */
  onCancel: () => void;
  /** Whether the modal is open */
  open: boolean;
}

export function PhotoCropModal({ imageFile, onConfirm, onCancel, open }: PhotoCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // Create object URL when file changes or modal opens
  useEffect(() => {
    if (!open || !imageFile) {
      return;
    }

    const url = URL.createObjectURL(imageFile);
    setImageSrc(url);

    // Reset state for new image
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);

    return () => {
      URL.revokeObjectURL(url);
      setImageSrc(null);
    };
  }, [open, imageFile]);

  const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedImage(imageSrc, croppedAreaPixels);
      onConfirm(blob);
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setProcessing(false);
    }
  };

  if (!open || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      {/* Modal card */}
      <div className="bg-background w-full max-w-md rounded-xl p-6 shadow-lg">
        {/* Title */}
        <h2 className="mb-4 text-lg font-semibold text-foreground">Ajustar foto de perfil</h2>

        {/* Crop area */}
        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Zoom slider */}
        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="accent-primary h-2 w-full cursor-pointer"
            aria-label="Zoom"
          />
        </div>

        {/* Action buttons */}
        <div className="mt-5 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onCancel} disabled={processing}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={processing || !croppedAreaPixels}>
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              'Confirmar'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
