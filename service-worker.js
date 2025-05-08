const CACHE_NAME = 'tram-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css'
];

// キャッシュのインストール
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('キャッシュを開きました');
        return cache.addAll(urlsToCache);
      })
  );
});

// アクティベート時に古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('古いキャッシュを削除: ', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// ネットワークリクエストの処理、キャッシュファーストのアプローチ
self.addEventListener('fetch', event => {
  // API呼び出しはキャッシュしない
  if (event.request.url.includes('api.openai.com')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュが見つかった場合はそれを返す
        if (response) {
          return response;
        }
        
        // キャッシュにない場合はネットワークリクエスト
        return fetch(event.request)
          .then(response => {
            // 無効なレスポンスはキャッシュしない
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // レスポンスをクローンしてキャッシュ（レスポンスは一度しか使用できないため）
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(error => {
            console.log('フェッチエラー:', error);
            // オフライン時のフォールバック対応が必要であれば追加
          });
      })
  );
}); 