"use strict";

/* =========================================================
   BLUE HEART V6 🩵
   FIREBASE PUSH REGISTRATION
========================================================= */

const BLUE_HEART_FIREBASE_CONFIG = {

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


const BLUE_HEART_VAPID_KEY =
    "BIKYDxIVFU5Gyn4ahRwc6s2SSTvuSKJguMr_YCMPs0W-spvGKPboi8GwG1WYE0TXfDrK-52JMt3rwsvx73JUsbk";


let blueHeartMessaging =
    null;


/* =========================================================
   SCRIPT LOADER
========================================================= */

function loadFirebaseScript(src) {

    return new Promise(
        (resolve, reject) => {

            const existing =
                document.querySelector(
                    `script[src="${src}"]`
                );

            if (existing) {

                if (
                    window.firebase
                ) {
                    resolve();
                    return;
                }

                existing.addEventListener(
                    "load",
                    resolve,
                    {
                        once: true
                    }
                );

                existing.addEventListener(
                    "error",
                    reject,
                    {
                        once: true
                    }
                );

                return;
            }


            const script =
                document.createElement(
                    "script"
                );


            script.src =
                src;


            script.onload =
                resolve;


            script.onerror =
                reject;


            document.head.appendChild(
                script
            );

        }
    );

}


/* =========================================================
   LOAD FIREBASE
========================================================= */

async function initialiseBlueHeartFirebase() {

    try {

        await loadFirebaseScript(
            "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js"
        );


        await loadFirebaseScript(
            "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js"
        );


        if (
            !window.firebase
        ) {

            throw new Error(
                "Firebase SDK did not load."
            );

        }


        if (
            !firebase.apps.length
        ) {

            firebase.initializeApp(
                BLUE_HEART_FIREBASE_CONFIG
            );

        }


        blueHeartMessaging =
            firebase.messaging();


        console.log(
            "Blue Heart Firebase ready 🩵"
        );


        return true;

    }

    catch (error) {

        console.error(
            "Blue Heart Firebase failed:",
            error
        );


        return false;

    }

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
            "Service workers are not supported."
        );

    }


    /*
       Reuse Blue Heart's EXISTING service worker.
       Do not create a second competing worker.
    */

    let registration =
        await navigator
            .serviceWorker
            .getRegistration("./");


    if (
        !registration
    ) {

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
   REQUEST PUSH REGISTRATION
========================================================= */

async function enableBlueHeartPush() {

    const status =
        document.getElementById(
            "blueHeartPushStatus"
        );


    try {

        if (
            !(
                "Notification"
                in window
            )
        ) {

            throw new Error(
                "Notifications are not supported on this device."
            );

        }


        if (
            !window.isSecureContext
        ) {

            throw new Error(
                "Blue Heart must be opened through HTTPS."
            );

        }


        if (
            status
        ) {

            status.textContent =
                "Connecting…";

        }


        /*
           This happens from a button press,
           so the browser is allowed to
           show its notification permission prompt.
        */

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

            if (
                status
            ) {

                status.textContent =
                    "Notifications are not allowed.";

            }


            return;

        }


        const firebaseReady =
            await initialiseBlueHeartFirebase();


        if (
            !firebaseReady
        ) {

            throw new Error(
                "Firebase could not start."
            );

        }


        const registration =
            await getBlueHeartServiceWorker();


        /*
           Firebase registration token.
           Used for our first end-to-end push test.
        */

        const token =
            await blueHeartMessaging
                .getToken({

                    vapidKey:
                        BLUE_HEART_VAPID_KEY,

                    serviceWorkerRegistration:
                        registration

                });


        if (
            !token
        ) {

            throw new Error(
                "Firebase did not return a registration token."
            );

        }


        /*
           Keep the token locally for now.

           NO student information is being
           uploaded here.
        */

        localStorage.setItem(
            "blueheart_fcm_token",
            token
        );


        localStorage.setItem(
            "blueheart_fcm_registered_at",
            new Date()
                .toISOString()
        );


        if (
            status
        ) {

            status.innerHTML =
                `
                <strong>
                    Connected ✓
                </strong>
                <br>
                This phone/browser can receive
                Blue Heart push notifications.
                `;

        }


        console.log(
            "Blue Heart FCM token:",
            token
        );


        alert(
            "Blue Heart push notifications are connected 🩵"
        );

    }

    catch (error) {

        console.error(
            "Blue Heart push registration failed:",
            error
        );


        if (
            status
        ) {

            status.textContent =
                "Could not connect. Check the browser console.";

        }


        alert(
            "Blue Heart couldn't connect push notifications yet."
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


    if (
        !settingsView
    ) {

        return;

    }


    const card =
        document.createElement(
            "section"
        );


    card.id =
        "blueHeartPushCard";


    card.className =
        "card";


    const alreadyConnected =
        Boolean(
            localStorage.getItem(
                "blueheart_fcm_token"
            )
        );


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
            Connect this device so Blue Heart
            can receive reminders even when
            the app is not open.
        </p>


        <div
            id="blueHeartPushStatus"
            style="
                margin-top:14px;
                margin-bottom:14px;
            "
        >

            ${
                alreadyConnected

                    ? `
                        <strong>
                            Connected ✓
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
                alreadyConnected

                    ? "Reconnect notifications"

                    : "Connect lock-screen notifications"
            }

        </button>

    `;


    /*
       Put it near the top of Settings.
    */

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

        /*
           The rest of Blue Heart may still
           be building dynamic settings UI,
           so give it a moment.
        */

        setTimeout(
            createBlueHeartPushCard,
            400
        );

    }
);
