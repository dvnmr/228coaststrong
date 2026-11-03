/* Share the public site address. No storage or network requests. */
(() => {
  const button = document.querySelector('[data-share-site]');
  const status = document.getElementById('shareStatus');
  if (!button || !status) return;

  const messages = {
    en: {
      text: 'Neighbors protecting our coast. Find your way to help with Coast Strong.',
      shared: 'Sharing completed on your device.',
      copied: 'Site link copied. Paste it into a message.',
      canceled: 'Sharing canceled. You can use the site link below.',
      unavailable: 'Sharing is unavailable here. Select and copy the site link below.'
    },
    es: {
      text: 'Vecinos que protegen nuestra costa. Encuentra cómo ayudar con Costa Fuerte.',
      shared: 'Se ha completado la acción de compartir en tu dispositivo.',
      copied: 'Enlace del sitio copiado. Pégalo en un mensaje.',
      canceled: 'Se canceló la acción de compartir. Puedes usar el enlace de abajo.',
      unavailable: 'Aquí no se puede compartir. Selecciona y copia el enlace de abajo.'
    },
    vi: {
      text: 'Hàng xóm cùng bảo vệ bờ biển. Tìm cách góp sức cùng Bờ Biển Vững Mạnh.',
      shared: 'Đã hoàn tất thao tác chia sẻ trên thiết bị của bạn.',
      copied: 'Đã sao chép liên kết trang web. Hãy dán vào tin nhắn.',
      canceled: 'Đã hủy chia sẻ. Bạn có thể dùng liên kết bên dưới.',
      unavailable: 'Không thể chia sẻ tại đây. Hãy chọn và sao chép liên kết bên dưới.'
    },
    de: {
      text: 'Nachbarn schützen unsere Küste. Finde heraus, wie du Starke Küste unterstützen kannst.',
      shared: 'Das Teilen wurde auf deinem Gerät abgeschlossen.',
      copied: 'Website-Link kopiert. Füge ihn in eine Nachricht ein.',
      canceled: 'Teilen abgebrochen. Du kannst den Website-Link unten verwenden.',
      unavailable: 'Teilen ist hier nicht verfügbar. Wähle den Website-Link unten aus und kopiere ihn.'
    },
    pl: {
      text: 'Sąsiedzi chronią nasze wybrzeże. Sprawdź, jak możesz pomóc Silne Wybrzeże.',
      shared: 'Udostępnianie na Twoim urządzeniu zostało zakończone.',
      copied: 'Link do strony został skopiowany. Wklej go do wiadomości.',
      canceled: 'Udostępnianie anulowane. Możesz użyć linku do strony poniżej.',
      unavailable: 'Udostępnianie jest tutaj niedostępne. Zaznacz i skopiuj link do strony poniżej.'
    },
    fr: {
      text: 'Des voisins protègent notre littoral. Trouvez comment aider avec Côte Forte.',
      shared: 'L’action de partage est terminée sur votre appareil.',
      copied: 'Lien du site copié. Collez-le dans un message.',
      canceled: 'Partage annulé. Vous pouvez utiliser le lien ci-dessous.',
      unavailable: 'Le partage est indisponible ici. Sélectionnez et copiez le lien ci-dessous.'
    }
  };
  const lang = Object.hasOwn(messages, document.documentElement.lang) ? document.documentElement.lang : 'en';
  const copy = messages[lang];
  const brand = {"en": "Coast Strong", "es": "Costa Fuerte", "vi": "Bờ Biển Vững Mạnh", "fr": "Côte Forte", "de": "Starke Küste", "pl": "Silne Wybrzeże"}[lang];
  const url = 'https://228coaststrong.com/' + (lang === 'en' ? '' : lang + '/');
  button.hidden = false;

  button.addEventListener('click', async () => {
    if (button.disabled) return;
    button.disabled = true;
    status.textContent = '';
    try {
      if (typeof navigator.share === 'function') {
        try {
          await navigator.share({ title: brand, text: copy.text, url });
          status.textContent = copy.shared;
          return;
        } catch (error) {
          if (error && error.name === 'AbortError') {
            status.textContent = copy.canceled;
            return;
          }
        }
      }
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(url);
        status.textContent = copy.copied;
      } else {
        status.textContent = copy.unavailable;
      }
    } catch (_) {
      status.textContent = copy.unavailable;
    } finally {
      button.disabled = false;
    }
  });
})();
