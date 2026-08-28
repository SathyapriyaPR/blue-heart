"use strict";

/* =========================================================
   BLUE HEART V6 🩵
   FIREBASE PUSH REGISTRATION
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


/* =========================================================
   FIREBASE CONFIG
========================================================= */

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


/* =========================================================
   STATUS
========================================================= */

function setPushStatus(message) {

    const status =
        document.getElementById(
            "blueHeartPushStatus"
        );

    if (status) {
        status.innerHTML = message;
    }
}


function showPushError(error) {

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
   WAIT UNTIL THIS SERVICE WORKER IS ACTIVE
========================================================= */

function waitForActiveServiceWorker(
    registration
) {

    return new Promise(
        (resolve, reject) => {

            let finished =
                false;


            const timeout =
                setTimeout(
                    () => {

                        if (finished) {
                            return;
                        }

                        finished =
                            true;

                        reject(
                            new Error(
                                "Blue Heart service worker did not become active within 20 seconds."
                            )
                        );

                    },
                    20000
                );


            function finish() {

                if (finished) {
                    return;
                }

                finished =
                    true;

                clearTimeout(
                    timeout
                );

                resolve(
                    registration
                );
            }


            function watchWorker(
                worker
            ) {

                if (!worker) {
                    return;
                }


                setPushStatus(
                    "Service worker: " +
                    worker.state
                );


                if (
                    worker.state ===
                    "activated"
                ) {

                    finish();

                    return;
                }


                worker.addEventListener(
                    "statechange",
                    () => {

                        setPushStatus(
                            "Service worker: " +
                            worker.state
                        );


                        if (
                            worker.state ===
                            "activated"
                        ) {

                            finish();
                        }


                        /*
                           If an old worker becomes
                           redundant, DON'T fail.

                           Chrome may already be
                           replacing it with a newer
                           worker.
                        */

                        if (
                            worker.state ===
                            "redundant"
                        ) {

                            const replacement =
                                registration.installing ||
                                registration.waiting ||
                                registration.active;

                            if (replacement) {

                                watchWorker(
                                    replacement
                                );
                            }
                        }

                    }
                );
            }


            /*
               Maybe it is already active.
            */

            if (
                registration.active
            ) {

                setPushStatus(
                    "Service worker active ✓"
                );

                finish();

                return;
            }


            /*
               Watch whatever Chrome currently has.
            */

            watchWorker(
                registration.installing
            );

            watchWorker(
                registration.waiting
            );


            /*
               IMPORTANT:
               A registration can briefly exist
               with no worker attached.

               Instead of throwing "No service
               worker available", wait for Chrome's
               updatefound event.
            */

            registration.addEventListener(
                "updatefound",
                () => {

                    const worker =
                        registration.installing;

                    if (worker) {

                        watchWorker(
                            worker
                        );
                    }

                }
            );


            /*
               Poll as a fallback because some
               Android Chrome versions can change
               registration state between events.
            */

            const poll =
                setInterval(
                    () => {

                        if (finished) {

                            clearInterval(
                                poll
                            );

                            return;
                        }


                        if (
                            registration.active
                        ) {

                            clearInterval(
                                poll
                            );

                            finish();

                            return;
                        }


                        const worker =
                            registration.installing ||
                            registration.waiting;


                        if (worker) {

                            setPushStatus(
                                "Service worker: " +
                                worker.state
                            );
                        }

                    },
                    500
                );

        }
    );
}


/* =========================================================
   REGISTER BLUE HEART SERVICE WORKER
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
        "Installing Blue Heart service worker…"
    );


    /*
       Always ask Chrome to register the current
       Blue Heart worker.

       ?v=6fix2 forces Chrome to fetch the newest
       service-worker.js rather than reusing an
       older script response.
    */

    const registration =
        await navigator.serviceWorker
            .register(
                ""./service-worker.js?v=6fix3"",
                {

                    scope:
                        "./",

                    updateViaCache:
                        "none"

                }
            );


    setPushStatus(
        "Waiting for service worker to activate…"
    );


    return await waitForActiveServiceWorker(
        registration
    );
}


/* =========================================================
   CONNECT PUSH
========================================================= */

async function connectBlueHeartPush() {

    const button =
        document.getElementById(
            "connectBlueHeartPush"
        );


    try {

        if (button) {

            button.disabled =
                true;
        }


        /* -------------------------------------
           HTTPS
        ------------------------------------- */

        if (
            !window.isSecureContext
        ) {

            throw new Error(
                "Open Blue Heart using its HTTPS GitHub Pages address."
            );
        }


        /* -------------------------------------
           NOTIFICATION SUPPORT
        ------------------------------------- */

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


        /* -------------------------------------
           FIREBASE SUPPORT
        ------------------------------------- */

        setPushStatus(
            "Checking Firebase support…"
        );


        const supported =
            await isSupported();


        if (!supported) {

            throw new Error(
                "Firebase Cloud Messaging is not supported on this browser."
            );
        }


        /* -------------------------------------
           PERMISSION
        ------------------------------------- */

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


        /* -------------------------------------
           SERVICE WORKER
        ------------------------------------- */

        const serviceWorkerRegistration =
            await getBlueHeartServiceWorker();


        setPushStatus(
            "Service worker ready ✓"
        );


        /* -------------------------------------
           FIREBASE INITIALISE
        ------------------------------------- */

        const app =
            initializeApp(
                firebaseConfig
            );


        const messaging =
            getMessaging(
                app
            );


        let registrationReceived =
            false;


        /* -------------------------------------
           RECEIVE FIREBASE INSTALLATION ID
        ------------------------------------- */

        onRegistered(
            messaging,
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
                        This phone is registered
                        for Blue Heart push notifications.
                    </span>

                `);


                if (button) {

                    button.textContent =
                        "Reconnect notifications";
                }

            }
        );


        /* -------------------------------------
           REGISTER WITH FIREBASE
        ------------------------------------- */

        setPushStatus(
            "Registering phone with Firebase…"
        );


        await register(
            messaging,
            {

                vapidKey:
                    VAPID_KEY,

                serviceWorkerRegistration:
                    serviceWorkerRegistration

            }
        );


        setPushStatus(
            "Firebase registration accepted. Waiting for device ID…"
        );


        /*
           onRegistered() should now supply FID.
        */

        setTimeout(
            () => {

                if (
                    !registrationReceived
                ) {

                    setPushStatus(`

                        <strong>
                            ⚠️ Firebase accepted registration
                        </strong>

                        <br>

                        <span
                            style="
                                font-size:13px;
                            "
                        >
                            Waiting for Firebase device ID.
                        </span>

                    `);
                }

            },
            12000
        );

    }

    catch (error) {

        showPushError(
            error
        );

    }

    finally {

        if (button) {

            button.disabled =
                false;
        }
    }
}


/* =========================================================
   CONNECT EXISTING BUTTON
========================================================= */

function initialiseBlueHeartPushButton() {

    const button =
        document.getElementById(
            "connectBlueHeartPush"
        );


    if (!button) {

        console.error(
            "Blue Heart push button not found."
        );

        return;
    }


    button.addEventListener(
        "click",
        connectBlueHeartPush
    );


    const savedFID =
        localStorage.getItem(
            "blueheart_firebase_installation_id"
        );


    if (savedFID) {

        setPushStatus(
            "<strong>✅ Connected</strong>"
        );


        button.textContent =
            "Reconnect notifications";
    }
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
        initialiseBlueHeartPushButton
    );

}
else {

    initialiseBlueHeartPushButton();
}
