import React from 'react';

const BannerBottom = ({ className = '' }) => {
  return (
    <div className={`w-full flex justify-center p-2 ${className}`} style={{ position: 'relative', zIndex: 1000 }}>
      <a href="https://example.com/bottom-ad" target="_blank" rel="noreferrer" className="w-full max-w-4xl">
        <img
          src="https://picsum.photos/seed/bottombanner/1200/150"
          alt="Bottom Ad"
          className="w-full h-20 object-cover rounded-md shadow-sm"
        />
      </a>
    </div>
  );
};

export default BannerBottom;
