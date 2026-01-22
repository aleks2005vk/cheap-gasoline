import React from 'react';

const BannerLeft = ({ className = '' }) => {
  return (
    <div
      className={`hidden lg:flex flex-col items-center p-2 ${className}`}
      style={{ width: 140, height: '100%', position: 'relative', zIndex: 1000 }}
    >
      <a href="https://example.com/left-ad" target="_blank" rel="noreferrer">
        <img
          src="https://picsum.photos/seed/leftbanner/300/800"
          alt="Left Ad"
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}
        />
      </a>
    </div>
  );
};

export default BannerLeft;
