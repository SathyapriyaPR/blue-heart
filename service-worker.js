const CACHE_NAME =
    "blue-heart-v6";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./timetable.js",
    "./firebase-messaging.js",
    "./manifest.json",
    "./icon/icon-192.png",
    "./icon/icon-512.png"
];


/* =========================================================
   NOTIFICATION CLICK
========================================================= */

self.addEventListener(
    "notificationclick",
    event => {

        event.notification.close();

        const targetUrl =
            event.notification?.data?.url ||
            "./";

        event.waitUntil(
            clients
                .matchAll({
                    type: "window",
                    includeUncontrolled: true
                })
                .then(windowClients => {

                    for (const client of windowClients) {

                        if ("focus" in client) {

                            client.focus();

                            if ("navigate" in client) {
                                client.navigate(targetUrl);
                            }

                            return;
                        }
                    }

                    if (clients.openWindow) {
                        return clients.openWindow(targetUrl);
                    }
                })
        );
    }
);


/* =========================================================
   FIREBASE MESSAGING
========================================================= */

importScripts(
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js"
);

importScripts(
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js"
);


firebase.initializeApp({

    apiKey:
        "AIzaSyCjBBNpq62munJxIUXYRdAaiLn1oh666is",

    authDomain:
        "blue-heart-a78ed.firebaseapp.com",

    projectId:
        "blue-heart-a78ed",

    storageBucket:
        "blue-heart-a78ed.firebasestorage.app",

    messagingSenderId:
        "550837365984",

    appId:
        "1:550837365984:web:2ce4f764699de294fb3485"

});


const messaging =
    firebase.messaging();


/* =========================================================
   BACKGROUND PUSH
========================================================= */

messaging.onBackgroundMessage(
    payload => {

        console.log(
            "Blue Heart background push:",
            payload
        );


        const notification =
            payload.notification || {};


        const data =
            payload.data || {};


        const title =
            notification.title ||
            data.title ||
            "Blue Heart 🩵";


        const options = {

            body:
                notification.body ||
                data.body ||
                "You have a reminder.",

            icon:
                "./icon/icon-192.png",

            badge:
                "./icon/icon-192.png",

            tag:
                data.tag ||
                "blue-heart-reminder",

            renotify:
                true,

            data: {
                url:
                    data.url ||
                    "./"
            }
        };


        return self.registration
            .showNotification(
                title,
                options
            );
    }
);


/* =========================================================
   INSTALL
========================================================= */

self.addEventListener(
    "install",
    event => {

        event.waitUntil(
            caches
                .open(CACHE_NAME)
                .then(cache =>
                    cache.addAll(
                        FILES_TO_CACHE
                    )
                )
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

        event.waitUntil(
            caches
                .keys()
                .then(keys =>
                    Promise.all(
                        keys
                            .filter(
                                key =>
                                    key !== CACHE_NAME
                            )
                            .map(
                                key =>
                                    caches.delete(key)
                            )
                    )
                )
        );

        self.clients.claim();
    }
);


/* =========================================================
   FETCH
========================================================= */

self.addEventListener(
    "fetch",
    event => {

        if (
            event.request.method !== "GET"
        ) {
            return;
        }


        event.respondWith(
            caches
                .match(
                    event.request
                )
                .then(cached => {

                    if (cached) {
                        return cached;
                    }

                    return fetch(
                        event.request
                    );
                })
        );
    }
);
