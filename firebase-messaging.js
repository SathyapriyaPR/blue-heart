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


function showError(error) {

    console.error(
        "Blue Heart Push Error:",
        error
    );

    const message =
        error?.message ||
        String(error);

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
        </div>

    `);
}


/* =========================================================
   WAIT FOR SERVICE WORKER
========================================================= */

function waitForServiceWorker(
    registration
) {

    return new Promise(
        (resolve, reject) => {

            if (
                registration.active
            ) {

                resolve(
                    registration
                );

                return;
            }


            let worker =
                registration.installing ||
                registration.waiting;


            if (!worker) {

                reject(
                    new Error(
                        "No service worker is available."
                    )
                );

                return;
            }


            const timeout =
                setTimeout(
                    () => {

                        reject(
                            new Error(
                                "Service worker did not activate within 15 seconds."
                            )
                        );

                    },
                    15000
                );


            const checkState =
                () => {

                    setPushStatus(
                        "Service worker: " +
                        worker.state
                    );


                    if (
                        worker.state ===
                        "activated"
                    ) {

                        clearTimeout(
                            timeout
                        );

                        resolve(
                            registration
                        );
                    }


                    if (
                        worker.state ===
                        "redundant"
                    ) {

                        clearTimeout(
                            timeout
                        );

                        reject(
                            new Error(
                                "Service worker installation failed."
                            )
                        );
                    }
                };


            worker.addEventListener(
                "statechange",
                checkState
            );


            checkState();

        }
    );
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
        await navigator.serviceWorker
            .getRegistration("./");


    if (!registration) {

        setPushStatus(
            "Installing Blue Heart service worker…"
        );


        registration =
            await navigator.serviceWorker
                .register(
                    "./service-worker.js",
                    {
                        scope: "./"
                    }
                );
    }


    /*
       Ask Chrome to check whether GitHub
       has a newer service-worker.js.
    */

    try {

        await registration.update();

    } catch (error) {

        console.log(
            "Service worker update check skipped:",
            error
        );
    }


    setPushStatus(
        "Waiting for service worker…"
    );


    return await waitForServiceWorker(
        registration
    );
}


/* =========================================================
   CONNECT FIREBASE
========================================================= */

async function connectBlueHeartPush() {

    const button =
        document.getElementById(
            "connectBlueHeartPush"
        );


    try {

        if (button) {
            button.disabled = true;
        }


        /* -----------------------------
           HTTPS
        ----------------------------- */

        if (
            !window.isSecureContext
        ) {

            throw new Error(
                "Open Blue Heart using its HTTPS GitHub Pages address."
            );
        }


        /* -----------------------------
           BROWSER SUPPORT
        ----------------------------- */

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


        const supported =
            await isSupported();


        if (!supported) {

            throw new Error(
                "Firebase Cloud Messaging is not supported by this browser."
            );
        }


        /* -----------------------------
           PERMISSION
        ----------------------------- */

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


        /* -----------------------------
           SERVICE WORKER
        ----------------------------- */

        const swRegistration =
            await getBlueHeartServiceWorker();


        setPushStatus(
            "Service worker ready ✓"
        );


        /* -----------------------------
           FIREBASE
        ----------------------------- */

        const firebaseApp =
            initializeApp(
                firebaseConfig
            );


        const messaging =
            getMessaging(
                firebaseApp
            );


        let gotFID =
            false;


        onRegistered(
            messaging,
            installationId => {

                gotFID = true;


                localStorage.setItem(
                    "blueheart_firebase_installation_id",
                    installationId
                );


                localStorage.setItem(
                    "blueheart_fcm_registered_at",
                    new Date()
                        .toISOString()
                );


                console.log(
                    "Blue Heart Firebase Installation ID:",
                    installationId
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
                        with Blue Heart Push.
                    </span>

                `);


                if (button) {

                    button.textContent =
                        "Reconnect notifications";
                }
            }
        );


        setPushStatus(
            "Registering phone with Firebase…"
        );


        await register(
            messaging,
            {

                vapidKey:
                    VAPID_KEY,

                serviceWorkerRegistration:
                    swRegistration

            }
        );


        /*
           FID arrives through onRegistered().
        */

        setTimeout(
            () => {

                if (!gotFID) {

                    setPushStatus(`

                        <strong>
                            ⚠️ Firebase registration started
                        </strong>

                        <br>

                        <span
                            style="
                                font-size:13px;
                            "
                        >
                            Waiting for the device ID.
                            Try the button once more if
                            this remains here.
                        </span>

                    `);
                }

            },
            12000
        );

    }

    catch (error) {

        showError(
            error
        );

    }

    finally {

        if (button) {
            button.disabled = false;
        }
    }
}


/* =========================================================
   CONNECT EXISTING HTML BUTTON
========================================================= */

function initialiseBlueHeartPushButton() {

    const button =
        document.getElementById(
            "connectBlueHeartPush"
        );


    if (!button) {

        console.error(
            "Blue Heart push button was not found."
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

} else {

    initialiseBlueHeartPushButton();
}
