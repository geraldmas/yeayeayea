import { PercentCrop } from 'react-image-crop';

export interface ImageCrop extends PercentCrop {
  unit: '%';
}

export const saveCropData = (imageId: string, cropData: ImageCrop) => {
  const key = `crop_${imageId}`;
  localStorage.setItem(key, JSON.stringify(cropData));
};

export const getCropData = (imageId: string): ImageCrop | null => {
  const key = `crop_${imageId}`;
  const data = localStorage.getItem(key);
  if (data) {
    return JSON.parse(data);
  }
  return null;
};