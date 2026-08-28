"use strict";

/* =========================================================
   BLUE HEART V6 🩵
   FIREBASE BACKGROUND PUSH SERVICE WORKER
========================================================= */


/* ---------------------------------------------------------
   IMPORTANT:
   Register notification click handling BEFORE Firebase.
--------------------------------------------------------- */

self.addEventListener(
    "notificationclick",
    event => {

        event.notification.close();

        const targetUrl =
            event.notification?.data?.url || "./";

        event.waitUntil(

            clients
                .matchAll({
                    type: "window",
                    includeUncontrolled: true
                })
                .then(windowClients => {

                    for (const client of windowClients) {

                        if ("focus" in client) {
                            return client.focus();
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
   FIREBASE SDK
========================================================= */

importScripts(
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js"
);

importScripts(
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js"
);


/* =========================================================
   FIREBASE CONFIG
========================================================= */

firebase.initializeApp({

    apiKey:
        "AIzaSyCjBBNpq62muhJxIUxYRdAailn1oh666is",

    authDomain:
        "blue-heart-a78ed.firebaseapp.com",

    projectId:
        "blue-heart-a78ed",

    storageBucket:
        "blue-heart-a78ed.firebasestorage.app",

    messagingSenderId:
        "550837365984",

    appId:
        "1:550837365984:web:2ce4f764699de294fb3485",

    measurementId:
        "G-W22JWZS13J"

});


const messaging =
    firebase.messaging();


/* =========================================================
   INSTALL
========================================================= */

self.addEventListener(
    "install",
    event => {

        console.log(
            "Blue Heart V6 push worker installing"
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
            "Blue Heart V6 push worker active"
        );

        event.waitUntil(
            self.clients.claim()
        );

    }
);


/* =========================================================
   FIREBASE BACKGROUND MESSAGE
========================================================= */

messaging.onBackgroundMessage(
    payload => {

        console.log(
            "Blue Heart received Firebase push:",
            payload
        );


        /*
         * Explicitly display the notification.
         *
         * We use payload.notification when Firebase Console
         * sends a standard notification message.
         */

        const notification =
            payload.notification || {};


        const data =
            payload.data || {};


        const title =
            notification.title ||
            data.title ||
            "Blue Heart 🩵";


        const body =
            notification.body ||
            data.body ||
            "You have a gentle reminder.";


        const options = {

            body: body,

            icon:
                "./icon/icon-192.png",

            badge:
                "./icon/icon-192.png",

            tag:
                data.tag ||
                "blue-heart-firebase",

            data: {

                url:
                    data.url ||
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
   FETCH
   ---------------------------------------------------------
   Network only for now.

   This prevents the old stale-page problem while we verify
   Firebase push reliability.
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
            fetch(event.request)
        );

    }
);
