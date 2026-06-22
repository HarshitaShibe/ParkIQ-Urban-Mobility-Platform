import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, UploadCloud, X } from 'lucide-react';
import { api } from '../api';

export default function VideoUpload() {
  const [state, setState] = useState('idle');
  const [file, setFile] = useState(null);
  const [location, setLocation] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [modal, setModal] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const reference = useMemo(() => `PKQ-${Date.now().toString(36).toUpperCase().slice(-6)}`, [result]);

  useEffect(() => {
    let timer;
    if (state === 'uploading') {
      timer = setInterval(() => setProgress((p) => Math.min(92, p + 9)), 220);
    }
    return () => clearInterval(timer);
  }, [state]);

  function chooseFile(nextFile) {
    if (!nextFile) return;
    setFile(nextFile);
    setState('file_selected');
    setError('');
  }

  function locate() {
    setState('locating');
    if (!navigator.geolocation) {
      setError('Geolocation is not available in this browser.');
      setState(file ? 'file_selected' : 'idle');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setState(file ? 'file_selected' : 'idle');
      },
      () => {
        setError('Could not read your location. Please allow location access and retry.');
        setState(file ? 'file_selected' : 'idle');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function upload() {
    if (!file || !location) {
      setError('Select a video and confirm your location first.');
      return;
    }
    setState('uploading');
    setProgress(12);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('latitude', location.latitude);
      formData.append('longitude', location.longitude);
      const data = await api.uploadVideo(formData);
      setProgress(100);
      setState('processing');
      setTimeout(() => {
        setResult(data);
        setState('result');
      }, 800);
    } catch {
      setError('Upload failed. Please try again.');
      setState('file_selected');
    }
  }

  const detections = Array.isArray(result?.details) ? result.details : [];

  return (
    <div>
      <label
        className={`upload-zone ${dragging ? 'dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); chooseFile(e.dataTransfer.files?.[0]); }}
      >
        <input ref={inputRef} type="file" accept="video/*" capture="environment" onChange={(e) => chooseFile(e.target.files?.[0])} />
        <div>
          <UploadCloud size={46} color="#06B6D4" />
          <h2>{file ? file.name : 'Upload or record violation video'}</h2>
          <p className="page-subtitle">Drag and drop, or tap to open your camera/gallery.</p>
          {location && <p className="coord">Lat {location.latitude.toFixed(5)} | Lon {location.longitude.toFixed(5)}</p>}
        </div>
      </label>

      <div className="upload-actions">
        <button className="ghost-button" onClick={() => inputRef.current?.click()}>Choose Video</button>
        <button className="ghost-button" onClick={locate}><MapPin size={16} /> Use My Location</button>
        <button className="primary-button" onClick={upload} disabled={state === 'uploading' || state === 'processing'}>Analyze Video</button>
      </div>

      {error && <div className="error" style={{ marginTop: 16 }}>{error}</div>}
      {state === 'locating' && <div className="card chart-card" style={{ marginTop: 16 }}>Reading browser location...</div>}
      {state === 'uploading' && <div className="progress"><span style={{ width: `${progress}%` }} /></div>}
      {state === 'processing' && (
        <div className="card chart-card" style={{ marginTop: 16, textAlign: 'center' }}>
          <div className="spinner" />
          <h2>YOLOv8 Analyzing...</h2>
          <p className="page-subtitle">Detecting stationary vehicles and reading plates.</p>
        </div>
      )}

      {state === 'result' && (
        <div className="card chart-card" style={{ marginTop: 16 }}>
          <h2>Detection Result <span className="severity-badge" style={{ color: '#06B6D4' }}>{result?.violations_detected ?? detections.length} vehicles</span></h2>
          <div className="table-wrap" style={{ maxHeight: 320 }}>
            <table>
              <thead><tr><th>Type</th><th>Plate</th><th>Confidence</th><th>Stationary</th></tr></thead>
              <tbody>
                {detections.map((d, i) => (
                  <tr key={`${d.license_plate}-${i}`}>
                    <td>{d.vehicle_type}</td>
                    <td className="plate">{d.license_plate || 'PENDING'}</td>
                    <td className="number">{Math.round(Number(d.confidence || 0) * 100)}%</td>
                    <td>{d.is_stationary ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!detections.length && <div className="empty">No vehicle detections were returned.</div>}
          </div>
          <button className="primary-button" onClick={() => { setModal(true); setState('reported'); }} style={{ marginTop: 16 }}>Report to Police</button>
        </div>
      )}

      {modal && (
        <div className="modal-backdrop">
          <div className="card modal">
            <button className="close-button" onClick={() => setModal(false)}><X /></button>
            <h2>Your report has been submitted.</h2>
            <p>Authorities at Bengaluru Traffic Control Room have been notified.</p>
            <p className="coord">Lat {location?.latitude.toFixed(5)} | Lon {location?.longitude.toFixed(5)}</p>
            <p className="mono">Reference: {reference}</p>
            <p style={{ color: 'var(--accent-green)', fontWeight: 700 }}>Authorities Notified ✓</p>
          </div>
        </div>
      )}
    </div>
  );
}
