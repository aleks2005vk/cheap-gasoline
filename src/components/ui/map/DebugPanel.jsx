import React from 'react';

const DebugPanel = ({ userLocation, selectedPoint }) => {
  return (
    <div className="fixed top-4 right-4 z-50 bg-white bg-opacity-90 border rounded-md p-2 text-xs shadow">
      <div className="font-semibold text-sm">Debug</div>
      <div className="mt-1">User: {userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : 'n/a'}</div>
      <div className="mt-1">Selected: {selectedPoint ? selectedPoint.name : 'none'}</div>
    </div>
  );
};

export default DebugPanel;
