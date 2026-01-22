import React from 'react';

const PopupAd = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 99999 }}>
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose}></div>

      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 overflow-hidden">
        <div className="p-0">
          <a href="https://example.com/popup-ad" target="_blank" rel="noreferrer">
            <img src="https://picsum.photos/seed/popup/800/400" alt="Popup Ad" className="w-full h-48 object-cover" />
          </a>
          <div className="p-4">
            <h3 className="text-lg font-semibold">Специальное предложение</h3>
            <p className="text-sm text-gray-600 mt-2">Купон 15% на товары в дорогу. Нажмите, чтобы подробнее.</p>
            <div className="mt-4 flex justify-end">
              <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Закрыть</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopupAd;
