import React, { useEffect } from "react";

/**
 * Компонент Google AdSense
 *
 * Использование:
 * <GoogleAd
 *   slot="1234567890"
 *   format="auto"
 *   responsive={true}
 * />
 *
 * Как подключить:
 * 1. Зарегистрируйте сайт в Google AdSense (adsense.google.com)
 * 2. Получите ваш Client ID (выглядит как ca-pub-XXXXXXXXXXXXXXXX)
 * 3. Добавьте в index.html <head>:
 *    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
 *      crossorigin="anonymous"></script>
 * 4. Укажите slot (ID объявления) из вашего AdSense аккаунта
 */

const GoogleAd = ({ slot, format = "auto", responsive = true }) => {
  useEffect(() => {
    // Проверяем есть ли скрипт AdSense
    if (window.adsbygoogle) {
      try {
        window.adsbygoogle.push({});
      } catch (err) {
        console.log("AdSense не инициализирован. Добавьте script в index.html");
      }
    }
  }, []);

  return (
    <div className="w-full flex justify-center my-4">
      <ins
        className="adsbygoogle"
        style={{
          display: "block",
          textAlign: "center",
          minHeight: "100px",
        }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot={slot || "9999999999"}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      ></ins>
    </div>
  );
};

export default GoogleAd;
