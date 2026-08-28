const CACHE_NAME =
    "blue-heart-v6-debug";


/* =========================================================
   INSTALL
========================================================= */

self.addEventListener(
    "install",
    event => {

        console.log(
            "Blue Heart service worker installing"
        );

        self.skipWaiting();
    }
);


/* =========================================================
   ACTIVATE
========================================================= */

self.addEventListener(
    "activate",
    event => {

        console.log(
            "Blue Heart service worker activating"
        );

        event.waitUntil(
            self.clients.claim()
        );
    }
);


/* =========================================================
   FETCH
========================================================= */

self.addEventListener(
    "fetch",
    event => {

        if (
            event.request.method !==
            "GET"
        ) {
            return;
        }

        /*
           Network only for this diagnostic test.
           No cache installation can fail.
        */

        event.respondWith(
            fetch(
                event.request
            )
        );
    }
);


/* =========================================================
   NOTIFICATION CLICK
========================================================= */

self.addEventListener(
    "notificationclick",
    event => {

        event.notification.close();

        event.waitUntil(
            clients.openWindow("./")
        );
    }
);
