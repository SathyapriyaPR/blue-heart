"use strict";

/* =========================================================
   BLUE HEART PUSH DIAGNOSTIC
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
            ${error?.message || String(error)}
        </div>

    `);
}


/* =========================================================
   BUTTON
========================================================= */

async function connectBlueHeartPush() {

    try {

        setPushStatus(
            "Button works ✓ Loading Firebase…"
        );


        /* -----------------------------------------
           LOAD FIREBASE ONLY AFTER BUTTON PRESS
        ----------------------------------------- */

        const firebaseAppModule =
            await import(
                "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js"
            );


        setPushStatus(
            "Firebase App loaded ✓"
        );


        const firebaseMessagingModule =
            await import(
                "https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging.js"
            );


        setPushStatus(
            "Firebase Messaging loaded ✓"
        );


        const {
            initializeApp
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
           SUPPORT
        ----------------------------------------- */

        const supported =
            await isSupported();


        if (!supported) {

            throw new Error(
                "Firebase Messaging is not supported by this browser."
            );
        }


        setPushStatus(
            "Firebase supported ✓ Checking notifications…"
        );


        /* -----------------------------------------
           PERMISSION
        ----------------------------------------- */

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


        setPushStatus(
            "Notifications allowed ✓ Checking service worker…"
        );


        /* -----------------------------------------
           SERVICE WORKER
        ----------------------------------------- */

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


        const registration =
            await navigator
                .serviceWorker
                .register(
                    "./service-worker.js?v=6debug4",
                    {
                        scope: "./",
                        updateViaCache: "none"
                    }
                );


        setPushStatus(
            "Service worker registered. Waiting for activation…"
        );


        const readyRegistration =
            await Promise.race([

                navigator.serviceWorker.ready,

                new Promise(
                    (_, reject) =>
                        setTimeout(
                            () =>
                                reject(
                                    new Error(
                                        "Service worker did not become ready within 15 seconds."
                                    )
                                ),
                            15000
                        )
                )

            ]);


        setPushStatus(
            "Service worker ready ✓ Connecting Firebase…"
        );


        /* -----------------------------------------
           FIREBASE
        ----------------------------------------- */

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
                "1:550837365984:web:2ce4f764699de294fb3485"
        };


        const VAPID_KEY =
            "BIKYDxIVFU5Gyn4ahRwc6s2SSTvuSKJguMr_YCMPs0W-spvGKPboi8GwG1WYE0TXfDrK-52JMt3rwsvx73JUsbk";


        const app =
            initializeApp(
                firebaseConfig
            );


        const messaging =
            getMessaging(
                app
            );


        onRegistered(
            messaging,
            installationId => {

                localStorage.setItem(
                    "blueheart_firebase_installation_id",
                    installationId
                );


                setPushStatus(`

                    <strong>
                        ✅ Connected
                    </strong>

                    <br>

                    Blue Heart push registration succeeded.

                `);

            }
        );


        setPushStatus(
            "Registering with Firebase…"
        );


        await register(
            messaging,
            {
                vapidKey:
                    VAPID_KEY
            }
        );


        setPushStatus(
            "Firebase registration accepted. Waiting for device ID…"
        );

    }

    catch (error) {

        showPushError(
            error
        );
    }
}


/* =========================================================
   ATTACH BUTTON
========================================================= */

function startBlueHeartPush() {

    const button =
        document.getElementById(
            "connectBlueHeartPush"
        );


    if (!button) {

        console.error(
            "Blue Heart push button missing."
        );

        return;
    }


    button.onclick =
        connectBlueHeartPush;


    setPushStatus(
        "Ready to connect."
    );
}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        startBlueHeartPush
    );

}
else {

    startBlueHeartPush();
}
