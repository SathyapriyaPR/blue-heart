"use strict";

/* =========================================================
   BLUE HEART V6 🩵
   FIREBASE CLOUD MESSAGING
   Current Firebase Installation ID registration
========================================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getMessaging,
    isSupported,
    register,
    onRegistered
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging.js";


const firebaseConfig = {

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
        "1:550837365984:web:2ce4f764699de294fb3485",

    measurementId:
        "G-W22JWZS13J"
};


const VAPID_KEY =
    "BIKYDxIVFU5Gyn4ahRwc6s2SSTvuSKJguMr_YCMPs0W-spvGKPboi8GwG1WYE0TXfDrK-52JMt3rwsvx73JUsbk";


let messaging = null;


/* =========================================================
   DISPLAY STATUS
========================================================= */

function setPushStatus(message) {

    const status =
        document.getElementById(
            "blueHeartPushStatus"
        );

    if (status) {

        status.innerHTML =
            message;

    }

}


/* =========================================================
   DISPLAY ERROR DIRECTLY IN BLUE HEART
========================================================= */

function showPushError(error) {

    console.error(
        "Blue Heart Firebase error:",
        error
    );


    const message =
        error?.message ||
        String(error);


    const code =
        error?.code
            ? `<br><small>${error.code}</small>`
            : "";


    setPushStatus(`

        <strong>
            ❌ Could not connect
        </strong>

        <div
            style="
                margin-top:8px;
                font-size:13px;
                word-break:break-word;
            "
        >
            ${message}
            ${code}
        </div>

    `);

}


/* =========================================================
   FIREBASE
========================================================= */

async function startFirebase() {

    const supported =
        await isSupported();


    if (!supported) {

        throw new Error(
            "Firebase push notifications are not supported by this browser."
        );

    }


    const app =
        initializeApp(
            firebaseConfig
        );


    messaging =
        getMessaging(
            app
        );


    return messaging;

}


/* =========================================================
   GET BLUE HEART SERVICE WORKER
========================================================= */

async function getBlueHeartServiceWorker() {

    if (
        !(
            "serviceWorker"
            in navigator
        )
    ) {

        throw new Error(
            "This browser does not support service workers."
        );

    }


    setPushStatus(
        "Checking Blue Heart service worker…"
    );


    let registration =
        await navigator
            .serviceWorker
            .getRegistration();


    if (!registration) {

        setPushStatus(
            "Installing Blue Heart service worker…"
        );


        registration =
            await navigator
                .serviceWorker
                .register(
                    "./service-worker.js"
                );

    }


    await navigator
        .serviceWorker
        .ready;


    return registration;

}


/* =========================================================
   CONNECT PUSH
========================================================= */

async function enableBlueHeartPush() {

    try {

        setPushStatus(
            "Starting…"
        );


        /* -----------------------------------------
           HTTPS
        ----------------------------------------- */

        if (!window.isSecureContext) {

            throw new Error(
                "Blue Heart must be opened from its HTTPS GitHub Pages address."
            );

        }


        /* -----------------------------------------
           NOTIFICATIONS
        ----------------------------------------- */

        if (
            !(
                "Notification"
                in window
            )
        ) {

            throw new Error(
                "This browser does not support notifications."
            );

        }


        setPushStatus(
            "Checking notification permission…"
        );


        let permission =
            Notification.permission;


        if (
            permission !==
            "granted"
        ) {

            permission =
                await Notification
                    .requestPermission();

        }


        if (
            permission !==
            "granted"
        ) {

            throw new Error(
                "Notification permission was not granted."
            );

        }


        /* -----------------------------------------
           SERVICE WORKER
        ----------------------------------------- */

        const serviceWorkerRegistration =
            await getBlueHeartServiceWorker();


        /* -----------------------------------------
           FIREBASE
        ----------------------------------------- */

        setPushStatus(
            "Connecting to Firebase…"
        );


        const currentMessaging =
            await startFirebase();


        /*
         * Firebase now delivers the Firebase
         * Installation ID through onRegistered().
         */

        let registrationReceived =
            false;


        const unsubscribe =
            onRegistered(
                currentMessaging,
                installationId => {

                    registrationReceived =
                        true;


                    console.log(
                        "Blue Heart Firebase Installation ID:",
                        installationId
                    );


                    localStorage.setItem(
                        "blueheart_firebase_installation_id",
                        installationId
                    );


                    localStorage.setItem(
                        "blueheart_fcm_registered_at",
                        new Date()
                            .toISOString()
                    );


                    setPushStatus(`

                        <strong>
                            ✅ Connected
                        </strong>

                        <br>

                        <span
                            style="
                                font-size:13px;
                            "
                        >
                            Blue Heart is registered
                            for push notifications.
                        </span>

                    `);


                    const button =
                        document.getElementById(
                            "connectBlueHeartPush"
                        );


                    if (button) {

                        button.textContent =
                            "Reconnect notifications";

                    }


                    setTimeout(
                        () => {

                            unsubscribe();

                        },
                        2000
                    );

                }
            );


        /* -----------------------------------------
           REGISTER WITH FCM
        ----------------------------------------- */

        setPushStatus(
            "Registering this phone with Firebase…"
        );


        await register(
            currentMessaging,
            {

                vapidKey:
                    VAPID_KEY,

                serviceWorkerRegistration:
                    serviceWorkerRegistration

            }
        );


        /*
         * onRegistered should normally fire
         * shortly after register().
         */

        setPushStatus(
            "Firebase accepted the registration. Waiting for device ID…"
        );


        /*
         * Don't leave the user staring at
         * 'Connecting' forever.
         */

        setTimeout(
            () => {

                if (
                    !registrationReceived
                ) {

                    setPushStatus(`

                        <strong>
                            ⚠️ Registration started
                        </strong>

                        <br>

                        <span
                            style="
                                font-size:13px;
                            "
                        >
                            Firebase has not returned the
                            device ID yet. Reopen Blue Heart
                            once and try again.
                        </span>

                    `);

                }

            },
            15000
        );

    }

    catch (error) {

        showPushError(
            error
        );

    }

}


/* =========================================================
   SETTINGS CARD
========================================================= */

function createBlueHeartPushCard() {

    if (
        document.getElementById(
            "blueHeartPushCard"
        )
    ) {

        return;

    }


    const settingsView =
        document.getElementById(
            "view-settings"
        );


    if (!settingsView) {

        return;

    }


    const savedFID =
        localStorage.getItem(
            "blueheart_firebase_installation_id"
        );


    const card =
        document.createElement(
            "section"
        );


    card.id =
        "blueHeartPushCard";


    card.className =
        "card";


    card.innerHTML = `

        <p class="eyebrow">
            LOCK-SCREEN NOTIFICATIONS
        </p>


        <h3>
            🔔 Blue Heart Push
        </h3>


        <p
            class="muted"
            style="
                margin-top:8px;
            "
        >
            Connect this phone so Blue Heart
            can receive push reminders.
        </p>


        <div
            id="blueHeartPushStatus"
            style="
                margin-top:14px;
                margin-bottom:14px;
            "
        >

            ${
                savedFID

                ? `
                    <strong>
                        ✅ Connected
                    </strong>
                  `

                : `
                    Not connected yet.
                  `
            }

        </div>


        <button
            id="connectBlueHeartPush"
            class="primary full"
            type="button"
        >

            ${
                savedFID

                ? "Reconnect notifications"

                : "Connect lock-screen notifications"
            }

        </button>

    `;


    settingsView.prepend(
        card
    );


    document
        .getElementById(
            "connectBlueHeartPush"
        )
        ?.addEventListener(
            "click",
            enableBlueHeartPush
        );

}


/* =========================================================
   START
========================================================= */

window.addEventListener(
    "DOMContentLoaded",
    () => {

        setTimeout(
            createBlueHeartPushCard,
            400
        );

    }
);
