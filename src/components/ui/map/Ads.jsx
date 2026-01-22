import React from 'react';

// Simple Ads component using placeholder images (picsum.photos).
// Images are public placeholder images meant for demo purposes.
const ads = [
  {
    id: 1,
    title: 'Скидки на мойку 20% — АвтоПро',
    img: 'https://picsum.photos/seed/carwash/400/200',
    url: 'https://example.com/carwash'
  },
  {
    id: 2,
    title: 'Кофе по дороге — CofeShop',
    img: 'https://picsum.photos/seed/coffee/400/200',
    url: 'https://example.com/coffee'
  },
  {
    id: 3,
    title: 'Зимние шины со скидкой',
    img: 'https://picsum.photos/seed/tires/400/200',
    url: 'https://example.com/tires'
  }
];

const Ads = () => {
  return (
    <div className="p-3 space-y-3 bg-gradient-to-b from-yellow-50 to-white border rounded-md shadow-sm">
      <h4 className="text-sm font-semibold text-gray-800">Реклама</h4>
      <div className="grid grid-cols-1 gap-2">
        {ads.map((ad) => (
          <a
            key={ad.id}
            href={ad.url}
            target="_blank"
            rel="noreferrer"
            className="block overflow-hidden rounded-md bg-white border hover:shadow-md transition"
          >
            <img src={ad.img} alt={ad.title} className="w-full h-24 object-cover" />
            <div className="p-2">
              <p className="text-xs font-medium text-gray-700">{ad.title}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default Ads;
