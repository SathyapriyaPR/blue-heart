"use strict";

/* =========================================================
   BLUE HEART V6 🩵
   FIREBASE PUSH NOTIFICATIONS
========================================================= */


/* =========================================================
   FIREBASE CONFIGURATION
========================================================= */

const BLUE_HEART_FIREBASE_CONFIG = {

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
};


/* =========================================================
   FIREBASE WEB PUSH VAPID KEY
========================================================= */

const BLUE_HEART_VAPID_KEY =
    "BIKYDxIVFU5Gyn4ahRwc6s2SSTvuSKJguMr_YCMPs0W-spvGKPboi8GwG1WYE0TXfDrK-52JMt3rwsvx73JUsbk";


/* =========================================================
   STATUS DISPLAY
========================================================= */

function setBlueHeartPushStatus(message) {

    const status =
        document.getElementById(
            "blueHeartPushStatus"
        );

    if (status) {
        status.innerHTML = message;
    }
}


/* =========================================================
   ERROR DISPLAY
========================================================= */

function showBlueHeartPushError(error) {

    console.error(
        "Blue Heart Push Error:",
        error
    );


    const message =
        error?.message ||
        String(error);


    const code =
        error?.code
            ? `<br><small>${error.code}</small>`
            : "";


    setBlueHeartPushStatus(`

        <strong>
            ❌ Could not connect
        </strong>

        <div
            style="
                margin-top:8px;
                font-size:13px;
                line-height:1.5;
                word-break:break-word;
            "
        >
            ${message}
            ${code}
        </div>

    `);
}


/* =========================================================
   LOAD FIREBASE
========================================================= */

async function loadBlueHeartFirebase() {

    setBlueHeartPushStatus(
        "Loading Firebase…"
    );


    const firebaseAppModule =
        await import(
            "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js"
        );


    setBlueHeartPushStatus(
        "Firebase App loaded ✓"
    );


    const firebaseMessagingModule =
        await import(
            "https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging.js"
        );


    setBlueHeartPushStatus(
        "Firebase Messaging loaded ✓"
    );


    return {

        firebaseAppModule,
        firebaseMessagingModule

    };
}


/* =========================================================
   SERVICE WORKER
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


    setBlueHeartPushStatus(
        "Registering Blue Heart service worker…"
    );


    /*
        Register Blue Heart's own service worker.

        updateViaCache: "none"
        tells Chrome to check GitHub for the current
        service-worker.js instead of relying on an
        older cached copy.
    */

    const registration =
        await navigator.serviceWorker.register(
            "./service-worker.js?v=6final1",
            {

                scope:
                    "./",

                updateViaCache:
                    "none"

            }
        );


    setBlueHeartPushStatus(
        "Waiting for service worker…"
    );


    /*
        Wait for an active worker.

        If one is already active, we can immediately
        continue.
    */

    if (
        registration.active
    ) {

        setBlueHeartPushStatus(
            "Service worker ready ✓"
        );

        return registration;
    }


    /*
        Otherwise wait for Chrome to activate it.
    */

    const readyRegistration =
        await Promise.race([

            navigator.serviceWorker.ready,

            new Promise(
                (_, reject) => {

                    setTimeout(
                        () => {

                            reject(
                                new Error(
                                    "Blue Heart service worker did not become ready within 20 seconds."
                                )
                            );

                        },
                        20000
                    );

                }
            )

        ]);


    setBlueHeartPushStatus(
        "Service worker ready ✓"
    );


    return readyRegistration;
}


/* =========================================================
   CONNECT BLUE HEART PUSH
========================================================= */

async function connectBlueHeartPush() {

    const button =
        document.getElementById(
            "connectBlueHeartPush"
        );


    try {

        /* -----------------------------------------
           BUTTON STATE
        ----------------------------------------- */

        if (button) {

            button.disabled =
                true;

            button.textContent =
                "Connecting…";
        }


        /* -----------------------------------------
           HTTPS CHECK
        ----------------------------------------- */

        if (
            !window.isSecureContext
        ) {

            throw new Error(
                "Blue Heart must be opened using its HTTPS GitHub Pages address."
            );
        }


        /* -----------------------------------------
           NOTIFICATION SUPPORT
        ----------------------------------------- */

        if (
            !(
                "Notification"
                in window
            )
        ) {

            throw new Error(
                "Notifications are not supported by this browser."
            );
        }


        /* -----------------------------------------
           LOAD FIREBASE
        ----------------------------------------- */

        const {

            firebaseAppModule,
            firebaseMessagingModule

        } =
            await loadBlueHeartFirebase();


        const {
            initializeApp,
            getApps
        } =
            firebaseAppModule;


        const {
            getMessaging,
            isSupported,
            register,
            onRegistered
        } =
            firebaseMessagingModule;


        /* -----------------------------------------
           FIREBASE SUPPORT
        ----------------------------------------- */

        setBlueHeartPushStatus(
            "Checking Firebase support…"
        );


        const supported =
            await isSupported();


        if (
            !supported
        ) {

            throw new Error(
                "Firebase Cloud Messaging is not supported by this browser."
            );
        }


        /* -----------------------------------------
           NOTIFICATION PERMISSION
        ----------------------------------------- */

        setBlueHeartPushStatus(
            "Checking notification permission…"
        );


        let permission =
            Notification.permission;


        if (
            permission !==
            "granted"
        ) {

            permission =
                await Notification.requestPermission();
        }


        if (
            permission !==
            "granted"
        ) {

            throw new Error(
                "Notification permission was not granted."
            );
        }


        setBlueHeartPushStatus(
            "Notifications allowed ✓"
        );


        /* -----------------------------------------
           SERVICE WORKER
        ----------------------------------------- */

        const serviceWorkerRegistration =
            await getBlueHeartServiceWorker();


        /* -----------------------------------------
           INITIALISE FIREBASE
        ----------------------------------------- */

        setBlueHeartPushStatus(
            "Starting Firebase…"
        );


        let firebaseApp;


        const existingApps =
            getApps();


        if (
            existingApps.length > 0
        ) {

            firebaseApp =
                existingApps[0];

        }
        else {

            firebaseApp =
                initializeApp(
                    BLUE_HEART_FIREBASE_CONFIG
                );
        }


        const messaging =
            getMessaging(
                firebaseApp
            );


        /* -----------------------------------------
           FIREBASE INSTALLATION ID CALLBACK
        ----------------------------------------- */

        try {

            onRegistered(
                messaging,
                installationId => {

                    console.log(
                        "Blue Heart Firebase Installation ID:",
                        installationId
                    );


                    if (
                        installationId
                    ) {

                        localStorage.setItem(
                            "blueheart_firebase_installation_id",
                            installationId
                        );
                    }

                }
            );

        }
        catch (callbackError) {

            /*
                Registration can still succeed even
                if this optional callback isn't
                immediately available.
            */

            console.warn(
                "Blue Heart registration callback:",
                callbackError
            );
        }


        /* -----------------------------------------
           REGISTER WITH FIREBASE CLOUD MESSAGING
        ----------------------------------------- */

        setBlueHeartPushStatus(
            "Registering phone with Firebase…"
        );


        await register(
            messaging,
            {

                vapidKey:
                    BLUE_HEART_VAPID_KEY,

                serviceWorkerRegistration:
                    serviceWorkerRegistration

            }
        );


        /* -----------------------------------------
           SAVE SUCCESS LOCALLY
        ----------------------------------------- */

        localStorage.setItem(
            "blueheart_push_registered",
            "true"
        );


        localStorage.setItem(
            "blueheart_push_registered_at",
            new Date().toISOString()
        );


        /* -----------------------------------------
           SUCCESS
        ----------------------------------------- */

        setBlueHeartPushStatus(`

            <strong>
                ✅ Connected
            </strong>

            <br>

            <span
                style="
                    font-size:13px;
                    line-height:1.5;
                "
            >
                Firebase accepted this phone
                for Blue Heart push notifications.
            </span>

        `);


        if (
            button
        ) {

            button.textContent =
                "Reconnect notifications";
        }


        console.log(
            "Blue Heart push registration successful 🩵"
        );

    }

    catch (error) {

        showBlueHeartPushError(
            error
        );


        if (
            button
        ) {

            button.textContent =
                "Try connecting again";
        }

    }

    finally {

        if (
            button
        ) {

            button.disabled =
                false;
        }
    }
}


/* =========================================================
   RESTORE SAVED CONNECTION STATUS
========================================================= */

function restoreBlueHeartPushStatus() {

    const registered =
        localStorage.getItem(
            "blueheart_push_registered"
        );


    if (
        registered ===
        "true"
    ) {

        setBlueHeartPushStatus(`

            <strong>
                ✅ Connected
            </strong>

            <br>

            <span
                style="
                    font-size:13px;
                "
            >
                Blue Heart push is registered
                on this phone.
            </span>

        `);


        const button =
            document.getElementById(
                "connectBlueHeartPush"
            );


        if (
            button
        ) {

            button.textContent =
                "Reconnect notifications";
        }
    }
    else {

        setBlueHeartPushStatus(
            "Ready to connect."
        );
    }
}


/* =========================================================
   INITIALISE BUTTON
========================================================= */

function initialiseBlueHeartPush() {

    const button =
        document.getElementById(
            "connectBlueHeartPush"
        );


    if (
        !button
    ) {

        console.error(
            "Blue Heart push button was not found."
        );

        return;
    }


    /*
        onclick instead of addEventListener prevents
        duplicate handlers while we're upgrading V6.
    */

    button.onclick =
        connectBlueHeartPush;


    restoreBlueHeartPushStatus();
}


/* =========================================================
   START
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initialiseBlueHeartPush
    );

}
else {

    initialiseBlueHeartPush();
}
