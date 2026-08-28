"use strict";

/* =========================================================
   BLUE HEART V6 🩵
   FIREBASE PUSH + TEST TOKEN
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
   WEB PUSH VAPID KEY
========================================================= */

const BLUE_HEART_VAPID_KEY =
    "BIKYDxIVFU5Gyn4ahRwc6s2SSTvuSKJguMr_YCMPs0W-spvGKPboi8GwG1WYE0TXfDrK-52JMt3rwsvx73JUsbk";


let blueHeartMessaging = null;
let blueHeartServiceWorker = null;
let firebaseMessagingModule = null;


/* =========================================================
   STATUS
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
   ERROR
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
   FIREBASE SDK
========================================================= */

async function loadBlueHeartFirebase() {

    const firebaseAppModule =
        await import(
            "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js"
        );


    firebaseMessagingModule =
        await import(
            "https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging.js"
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
        "Checking Blue Heart service worker…"
    );


    const registration =
        await navigator.serviceWorker.register(
            "./service-worker.js?v=6pushfix1",
            {
                scope: "./",
                updateViaCache: "none"
            }
        );


    if (
        registration.active
    ) {

        blueHeartServiceWorker =
            registration;

        return registration;
    }


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


    blueHeartServiceWorker =
        readyRegistration;


    return readyRegistration;
}


/* =========================================================
   FIREBASE INITIALISATION
========================================================= */

async function initialiseBlueHeartFirebase() {

    const {
        firebaseAppModule,
        firebaseMessagingModule:
            messagingModule
    } =
        await loadBlueHeartFirebase();


    const {
        initializeApp,
        getApps
    } =
        firebaseAppModule;


    const {
        getMessaging,
        isSupported
    } =
        messagingModule;


    const supported =
        await isSupported();


    if (!supported) {

        throw new Error(
            "Firebase Cloud Messaging is not supported by this browser."
        );
    }


    let app;


    if (
        getApps().length > 0
    ) {

        app =
            getApps()[0];

    }
    else {

        app =
            initializeApp(
                BLUE_HEART_FIREBASE_CONFIG
            );
    }


    blueHeartMessaging =
        getMessaging(
            app
        );


    return blueHeartMessaging;
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

        if (button) {

            button.disabled =
                true;

            button.textContent =
                "Connecting…";
        }


        if (
            !window.isSecureContext
        ) {

            throw new Error(
                "Blue Heart must be opened using its HTTPS GitHub Pages address."
            );
        }


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
            "Preparing Firebase…"
        );


        const messaging =
            await initialiseBlueHeartFirebase();


        const serviceWorkerRegistration =
            await getBlueHeartServiceWorker();


        const {
            register,
            onRegistered
        } =
            firebaseMessagingModule;


        try {

            onRegistered(
                messaging,
                installationId => {

                    if (
                        installationId
                    ) {

                        localStorage.setItem(
                            "blueheart_firebase_installation_id",
                            installationId
                        );


                        console.log(
                            "Blue Heart FID:",
                            installationId
                        );
                    }

                }
            );

        }
        catch (error) {

            console.warn(
                "FID callback unavailable:",
                error
            );
        }


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


        localStorage.setItem(
            "blueheart_push_registered",
            "true"
        );


        localStorage.setItem(
            "blueheart_push_registered_at",
            new Date().toISOString()
        );


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
                Blue Heart is registered for
                push notifications.
            </span>

        `);


        if (button) {

            button.textContent =
                "Reconnect notifications";
        }


        showTestTokenControls();

    }
    catch (error) {

        showBlueHeartPushError(
            error
        );


        if (button) {

            button.textContent =
                "Try connecting again";
        }

    }
    finally {

        if (button) {

            button.disabled =
                false;
        }
    }
}


/* =========================================================
   TEST TOKEN UI
========================================================= */

function showTestTokenControls() {

    const card =
        document.getElementById(
            "blueHeartPushCard"
        );


    if (
        !card ||
        document.getElementById(
            "blueHeartTestTokenArea"
        )
    ) {

        return;
    }


    const area =
        document.createElement(
            "div"
        );


    area.id =
        "blueHeartTestTokenArea";


    area.style.marginTop =
        "16px";


    area.innerHTML = `

        <hr
            style="
                opacity:0.2;
                margin:16px 0;
            "
        >

        <p class="eyebrow">
            FIREBASE TEST
        </p>

        <p
            class="muted"
            style="
                font-size:13px;
            "
        >
            Generate a temporary FCM token
            so we can send a test notification
            from Firebase Console.
        </p>

        <button
            id="generateBlueHeartToken"
            class="secondary full"
            type="button"
            style="
                margin-top:10px;
            "
        >
            Generate test token
        </button>

        <div
            id="blueHeartTokenResult"
            style="
                margin-top:12px;
                font-size:12px;
                word-break:break-all;
            "
        ></div>

    `;


    card.appendChild(
        area
    );


    document
        .getElementById(
            "generateBlueHeartToken"
        )
        ?.addEventListener(
            "click",
            generateBlueHeartTestToken
        );
}


/* =========================================================
   GENERATE LEGACY TEST TOKEN
========================================================= */

async function generateBlueHeartTestToken() {

    const result =
        document.getElementById(
            "blueHeartTokenResult"
        );


    const button =
        document.getElementById(
            "generateBlueHeartToken"
        );


    try {

        if (button) {

            button.disabled =
                true;

            button.textContent =
                "Generating…";
        }


        if (result) {

            result.textContent =
                "Requesting Firebase test token…";
        }


        if (
            !blueHeartMessaging
        ) {

            await initialiseBlueHeartFirebase();
        }


        if (
            !blueHeartServiceWorker
        ) {

            await getBlueHeartServiceWorker();
        }


        const {
            getToken
        } =
            firebaseMessagingModule;


        const token =
            await getToken(
                blueHeartMessaging,
                {

                    vapidKey:
                        BLUE_HEART_VAPID_KEY,

                    serviceWorkerRegistration:
                        blueHeartServiceWorker

                }
            );


        if (!token) {

            throw new Error(
                "Firebase did not return a test token."
            );
        }


        localStorage.setItem(
            "blueheart_fcm_test_token",
            token
        );


        if (result) {

            result.innerHTML = `

                <strong>
                    Test token ready ✓
                </strong>

                <textarea
                    id="blueHeartTokenText"
                    readonly
                    style="
                        width:100%;
                        min-height:120px;
                        margin-top:10px;
                        padding:10px;
                        box-sizing:border-box;
                    "
                >${token}</textarea>

                <button
                    id="copyBlueHeartToken"
                    class="secondary full"
                    type="button"
                    style="
                        margin-top:8px;
                    "
                >
                    Copy test token
                </button>

            `;
        }


        document
            .getElementById(
                "copyBlueHeartToken"
            )
            ?.addEventListener(
                "click",
                copyBlueHeartTestToken
            );


        if (button) {

            button.textContent =
                "Generate again";
        }

    }
    catch (error) {

        console.error(
            "Blue Heart token error:",
            error
        );


        if (result) {

            result.innerHTML = `

                <strong>
                    ❌ Token failed
                </strong>

                <br>

                ${error?.message || String(error)}

            `;
        }


        if (button) {

            button.textContent =
                "Try again";
        }

    }
    finally {

        if (button) {

            button.disabled =
                false;
        }
    }
}


/* =========================================================
   COPY TOKEN
========================================================= */

async function copyBlueHeartTestToken() {

    const token =
        document.getElementById(
            "blueHeartTokenText"
        )?.value;


    if (!token) {
        return;
    }


    try {

        await navigator.clipboard.writeText(
            token
        );


        const button =
            document.getElementById(
                "copyBlueHeartToken"
            );


        if (button) {

            button.textContent =
                "Copied ✓";
        }

    }
    catch (error) {

        console.error(
            "Copy failed:",
            error
        );


        alert(
            "Select the token text and copy it manually."
        );
    }
}


/* =========================================================
   RESTORE EXISTING CONNECTION
========================================================= */

function restoreBlueHeartPushState() {

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


        if (button) {

            button.textContent =
                "Reconnect notifications";
        }


        showTestTokenControls();
    }
    else {

        setBlueHeartPushStatus(
            "Ready to connect."
        );
    }
}


/* =========================================================
   START
========================================================= */

function initialiseBlueHeartPush() {

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


    button.onclick =
        connectBlueHeartPush;


    restoreBlueHeartPushState();
}


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
