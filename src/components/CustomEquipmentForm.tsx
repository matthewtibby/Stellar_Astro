"use client";

import { useState } from 'react';
import { X } from 'lucide-react';
import { Telescope, Camera, addCustomTelescope, addCustomCamera } from '@/src/data/equipmentDatabase';

interface CustomEquipmentFormProps {
  type: 'telescope' | 'camera';
  onSave: (equipment: Telescope | Camera) => void;
  onCancel: () => void;
}

export default function CustomEquipmentForm({ type, onSave, onCancel }: CustomEquipmentFormProps) {
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [description, setDescription] = useState('');
  
  // Telescope specific fields
  const [aperture, setAperture] = useState('');
  const [focalLength, setFocalLength] = useState('');
  const [telescopeType, setTelescopeType] = useState<'refractor' | 'reflector' | 'catadioptric'>('refractor');
  const [mount, setMount] = useState<'altazimuth' | 'equatorial' | 'german equatorial' | 'dobsonian'>('equatorial');
  
  // Camera specific fields
  const [sensor, setSensor] = useState('');
  const [resolution, setResolution] = useState('');
  const [pixelSize, setPixelSize] = useState('');
  const [sensorSize, setSensorSize] = useState('');
  const [cooling, setCooling] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (type === 'telescope') {
      const newTelescope: Telescope = {
        id: `custom-telescope-${Date.now()}`,
        brand,
        model,
        aperture: Number(aperture),
        focalLength: Number(focalLength),
        type: telescopeType,
        mount,
        description
      };
      // Add to database
      const savedTelescope = addCustomTelescope(newTelescope);
      onSave(savedTelescope);
    } else {
      const newCamera: Camera = {
        id: `custom-camera-${Date.now()}`,
        brand,
        model,
        sensor,
        resolution,
        pixelSize: Number(pixelSize),
        sensorSize,
        cooling,
        description
      };
      // Add to database
      const savedCamera = addCustomCamera(newCamera);
      onSave(savedCamera);
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-white">Add Custom {type === 'telescope' ? 'Telescope' : 'Camera'}</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="brand" className="block text-sm font-medium text-gray-300 mb-1">
              Brand
            </label>
            <input
              type="text"
              id="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter brand name"
              required
            />
          </div>
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-300 mb-1">
              Model
            </label>
            <input
              type="text"
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter model name"
              required
            />
          </div>
        </div>
        
        {type === 'telescope' ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="aperture" className="block text-sm font-medium text-gray-300 mb-1">
                  Aperture (mm)
                </label>
                <input
                  type="number"
                  id="aperture"
                  value={aperture}
                  onChange={(e) => setAperture(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter aperture in mm"
                  required
                />
              </div>
              <div>
                <label htmlFor="focalLength" className="block text-sm font-medium text-gray-300 mb-1">
                  Focal Length (mm)
                </label>
                <input
                  type="number"
                  id="focalLength"
                  value={focalLength}
                  onChange={(e) => setFocalLength(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter focal length in mm"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="telescopeType" className="block text-sm font-medium text-gray-300 mb-1">
                  Type
                </label>
                <select
                  id="telescopeType"
                  value={telescopeType}
                  onChange={(e) => setTelescopeType(e.target.value as 'refractor' | 'reflector' | 'catadioptric')}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="refractor">Refractor</option>
                  <option value="reflector">Reflector</option>
                  <option value="catadioptric">Catadioptric</option>
                </select>
              </div>
              <div>
                <label htmlFor="mount" className="block text-sm font-medium text-gray-300 mb-1">
                  Mount
                </label>
                <select
                  id="mount"
                  value={mount}
                  onChange={(e) => setMount(e.target.value as 'altazimuth' | 'equatorial' | 'german equatorial' | 'dobsonian')}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="altazimuth">Altazimuth</option>
                  <option value="equatorial">Equatorial</option>
                  <option value="german equatorial">German Equatorial</option>
                  <option value="dobsonian">Dobsonian</option>
                </select>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="sensor" className="block text-sm font-medium text-gray-300 mb-1">
                  Sensor
                </label>
                <input
                  type="text"
                  id="sensor"
                  value={sensor}
                  onChange={(e) => setSensor(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., CMOS, CCD"
                  required
                />
              </div>
              <div>
                <label htmlFor="resolution" className="block text-sm font-medium text-gray-300 mb-1">
                  Resolution
                </label>
                <input
                  type="text"
                  id="resolution"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 4144×2822"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="pixelSize" className="block text-sm font-medium text-gray-300 mb-1">
                  Pixel Size (μm)
                </label>
                <input
                  type="number"
                  id="pixelSize"
                  value={pixelSize}
                  onChange={(e) => setPixelSize(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter pixel size in microns"
                  required
                />
              </div>
              <div>
                <label htmlFor="sensorSize" className="block text-sm font-medium text-gray-300 mb-1">
                  Sensor Size
                </label>
                <input
                  type="text"
                  id="sensorSize"
                  value={sensorSize}
                  onChange={(e) => setSensorSize(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., APS-C, Full Frame"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={cooling}
                  onChange={(e) => setCooling(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                />
                <span className="text-sm font-medium text-gray-300">Cooling</span>
              </label>
            </div>
          </>
        )}
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter description"
            rows={3}
          />
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
} 