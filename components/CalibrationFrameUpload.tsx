import React, { useState } from 'react';

interface CalibrationFrameUploadProps {
  projectId: string;
  onSuccess?: (frameId: string) => void;
  onError?: (error: string) => void;
}

const CalibrationFrameUpload: React.FC<CalibrationFrameUploadProps> = ({ projectId, onSuccess, onError }) => {
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState('bias');
  const [metadata, setMetadata] = useState({ camera: '', exposure: '', iso: '', temperature: '', filter: '', date: '' });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMetadata({ ...metadata, [e.target.name]: e.target.value });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setType(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setError(null);
    setSuccess(null);
    if (!file) {
      setError('Please select a file.');
      setUploading(false);
      if (onError) onError('Please select a file.');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    formData.append('metadata', JSON.stringify(metadata));
    try {
      const res = await fetch(`/api/projects/${projectId}/calibration-frames/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        throw new Error('Upload failed');
      }
      const data = await res.json();
      setSuccess(`Upload successful! Frame ID: ${data.id}`);
      setFile(null);
      if (onSuccess) onSuccess(data.id);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-8">
      <h2 className="text-xl font-bold mb-4">Upload Calibration Frame</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Frame Type</label>
          <select value={type} onChange={handleTypeChange} className="border rounded px-2 py-1 w-full">
            <option value="bias">Bias</option>
            <option value="dark">Dark</option>
            <option value="flat">Flat</option>
            <option value="flat_dark">Flat Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">FITS/RAW File</label>
          <input type="file" accept=".fits,.fit,.fts,.raw,.cr2,.nef,.arw,.dng" onChange={handleFileChange} className="border rounded px-2 py-1 w-full" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input name="camera" placeholder="Camera" value={metadata.camera} onChange={handleMetadataChange} className="border rounded px-2 py-1" />
          <input name="exposure" placeholder="Exposure (s)" value={metadata.exposure} onChange={handleMetadataChange} className="border rounded px-2 py-1" />
          <input name="iso" placeholder="ISO/Gain" value={metadata.iso} onChange={handleMetadataChange} className="border rounded px-2 py-1" />
          <input name="temperature" placeholder="Temperature (°C)" value={metadata.temperature} onChange={handleMetadataChange} className="border rounded px-2 py-1" />
          <input name="filter" placeholder="Filter" value={metadata.filter} onChange={handleMetadataChange} className="border rounded px-2 py-1" />
          <input name="date" placeholder="Date" value={metadata.date} onChange={handleMetadataChange} className="border rounded px-2 py-1" />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload'}</button>
        {error && <div className="text-red-600">{error}</div>}
        {success && <div className="text-green-600">{success}</div>}
      </form>
    </div>
  );
};

export default CalibrationFrameUpload; 