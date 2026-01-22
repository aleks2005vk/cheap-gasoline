import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentToken } from '../../features/auth/authSlice';

const AddStationPhoto = () => {
  const navigate = useNavigate();
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [attaching, setAttaching] = useState(false);
  const fileInputRef = useRef(null);
  const token = useSelector(selectCurrentToken);

  // Выбор файла
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setPreview(event.target?.result);
    reader.readAsDataURL(file);
  };

  // Upload image to backend for OCR and parsing
  const extractTextFromImage = async () => {
    if (!preview) {
      alert('Пожалуйста, выберите фотографию');
      return;
    }
    setLoading(true);
    try {
      // Convert dataURL to blob
      const res = await fetch(preview);
      const blob = await res.blob();
      const fd = new FormData();
      fd.append('file', blob, 'upload.jpg');

  const headers = token ? { Authorization: 'Bearer ' + token } : {}
      const resp = await fetch('/api/upload-photo', { method: 'POST', body: fd, headers });
      if (!resp.ok) throw new Error('Server error ' + resp.status);
      const json = await resp.json();
      setExtractedText(json.text || '');
      // Map backend prices format (array) to our parsedData shape
      const pricesArr = json.prices || [];
      const data = {
        brand: json.brand || json.source || 'Unknown',
        prices: {
          regular: pricesArr[0] || null,
          premium: pricesArr[1] || null,
          diesel: pricesArr[2] || null,
        },
        extractedAt: new Date().toLocaleString(),
      };
      setParsedData(data);
    } catch (error) {
      console.error('Upload/OCR error:', error);
      alert('Ошибка при распознавании на сервере: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // (parsing now occurs on the server; fallback parsing removed)

  // Attach parsed prices to a selected station (POST to backend)
  const attachToStation = async () => {
    if (!selectedStation) {
      alert('Пожалуйста, выберите станцию');
      return;
    }
    if (!parsedData) {
      alert('Нет распознанных данных');
      return;
    }
    setAttaching(true);
    try {
      const promises = [];
      const { prices } = parsedData;
  const tokenHeader = token ? { Authorization: 'Bearer ' + token } : {}
      if (prices.regular) {
        promises.push(fetch(`/api/stations/${selectedStation}/prices`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', ...tokenHeader },
          body: JSON.stringify({ fuel_type: 'regular', price: Number(prices.regular), source: 'photo', note: parsedData.brand })
        }));
      }
      if (prices.premium) {
        promises.push(fetch(`/api/stations/${selectedStation}/prices`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', ...tokenHeader },
          body: JSON.stringify({ fuel_type: 'premium', price: Number(prices.premium), source: 'photo', note: parsedData.brand })
        }));
      }
      if (prices.diesel) {
        promises.push(fetch(`/api/stations/${selectedStation}/prices`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', ...tokenHeader },
          body: JSON.stringify({ fuel_type: 'diesel', price: Number(prices.diesel), source: 'photo', note: parsedData.brand })
        }));
      }
      const results = await Promise.all(promises);
      const ok = results.every(r => r.ok);
      if (!ok) throw new Error('One or more POSTs failed');
      alert('✓ Цены успешно отправлены и привязаны к станции');

      // reset
      setPreview(null);
      setExtractedText('');
      setParsedData(null);
      setSelectedStation(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      } catch {
      alert('Ошибка при привязке цен.');
    } finally {
      setAttaching(false);
    }
  };

  // fetch stations for selection
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/stations');
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setStations(data.slice(0, 1000));
      } catch {
        // ignore
      }
    })();
    return () => { mounted = false };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate('/')} className="mb-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
          ← Назад на карту
        </button>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-4">📸 Добавить фотографию заправки</h1>
          <p className="text-gray-600 mb-6">Загрузите фото ценника или доски с ценами. Система автоматически распознает бренд и цены.</p>

          <div className="mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>

          {preview && (
            <div className="mb-6">
              <p className="text-sm font-semibold mb-2">Предпросмотр:</p>
              <img src={preview} alt="preview" className="max-w-full max-h-64 rounded border" />
            </div>
          )}

          <button
            onClick={extractTextFromImage}
            disabled={!preview || loading}
            className="w-full mb-4 px-4 py-3 bg-blue-600 text-white rounded font-semibold
              hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Распознание текста...' : '🔍 Распознать цены'}
          </button>

          {extractedText && (
            <div className="mb-6 p-4 bg-gray-100 rounded">
              <p className="text-sm font-semibold mb-2">Распознанный текст:</p>
              <p className="text-xs text-gray-700 max-h-24 overflow-y-auto whitespace-pre-wrap">{extractedText}</p>
            </div>
          )}

          {parsedData && (
            <div className="mb-6 p-4 bg-green-50 border-2 border-green-300 rounded">
              <p className="text-sm font-semibold mb-3 text-green-800">✓ Распознанные данные:</p>
              <div className="space-y-2 text-sm">
                <p><strong>Бренд:</strong> {parsedData.brand}</p>
                <p><strong>Цена (обычный):</strong> {parsedData.prices.regular || '-'}</p>
                <p><strong>Цена (премиум):</strong> {parsedData.prices.premium || '-'}</p>
                <p><strong>Цена (дизель):</strong> {parsedData.prices.diesel || '-'}</p>
                <p className="text-xs text-gray-600">{parsedData.extractedAt}</p>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Выберите станцию для привязки</label>
                <select
                  value={selectedStation || ''}
                  onChange={(e) => setSelectedStation(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">-- выбрать станцию --</option>
                  {stations.map(s => (
                    <option key={s.id} value={s.id}>{s.name || `${s.lat},${s.lng}`}</option>
                  ))}
                </select>
                <button
                  onClick={attachToStation}
                  disabled={attaching || !selectedStation}
                  className="w-full mt-3 px-4 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700 disabled:bg-gray-400"
                >
                  {attaching ? 'Отправка...' : '✅ Привязать цены к станции'}
                </button>
              </div>
            </div>
          )}

          <div className="p-4 bg-blue-50 rounded text-sm text-gray-700">
            <p className="font-semibold mb-2">💡 Советы:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Фото должно быть четким и хорошо освещено</li>
              <li>Ценник должен быть полностью виден</li>
              <li>Поддерживаются бренды: WISSOL, SOCAR, Lukoil, Gulf, BP, Shell, Total, Rompetrol</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStationPhoto;
