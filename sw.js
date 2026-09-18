/* Service worker aplikacji "Co teraz".
   Robi dwie rzeczy: pozwala Chrome zainstalować stronę jako aplikację
   i trzyma jej kopię, żeby działała bez internetu.
   Po każdej podmianie index.html podbij numer w CACHE — inaczej
   telefon będzie uparcie pokazywał starą wersję.                      */
const CACHE = "co-teraz-v1";
const FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(FILES); })
          .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        if(k !== CACHE) return caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

/* Najpierw sieć, w razie braku — kopia z pamięci.
   Dzięki temu po wgraniu poprawki widzisz ją od razu, a w metrze
   bez zasięgu aplikacja i tak się otwiera.                            */
self.addEventListener("fetch", function(e){
  if(e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).then(function(res){
      if(res && res.status === 200 && res.type === "basic"){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
      }
      return res;
    }).catch(function(){
      return caches.match(e.request).then(function(hit){
        return hit || caches.match("./index.html");
      });
    })
  );
});
