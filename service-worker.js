const CACHE_NAME = "blue-heart-v6";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./timetable.js",
    "./manifest.json",
    "./icon/icon-192.png",
    "./icon/icon-512.png"
];


/* =========================================================
   FIREBASE
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
   BACKGROUND NOTIFICATIONS
========================================================= */

messaging.onBackgroundMessage(
    payload => {

        console.log(
            "Blue Heart push:",
            payload
        );

        const title =
            payload.notification?.title ||
            payload.data?.title ||
            "Blue Heart 🩵";


        const options = {

            body:
                payload.notification?.body ||
                payload.data?.body ||
                "You have a reminder.",

            icon:
                "./icon/icon-192.png",

            badge:
                "./icon/icon-192.png",

            data: {
                url:
                    payload.data?.url ||
                    "./"
            }

        };


        return self.registration.showNotification(
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
                    cache.addAll(FILES_TO_CACHE)
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
                .match(event.request)
                .then(cached => {

                    if (cached) {
                        return cached;
                    }

                    return fetch(event.request);
                })
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
            clients.openWindow(
                event.notification?.data?.url ||
                "./"
            )
        );
    }
);
