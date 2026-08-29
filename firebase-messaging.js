"use strict";

/* =========================================================
   BLUE HEART V6 🩵
   FIREBASE PUSH REGISTRATION
   Firebase Installation ID (FID)
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
   LOCAL STORAGE KEYS
========================================================= */

const BLUE_HEART_PUSH_REGISTERED_KEY =
    "blueheart_push_registered";

const BLUE_HEART_PUSH_REGISTERED_AT_KEY =
    "blueheart_push_registered_at";

const BLUE_HEART_FIREBASE_FID_KEY =
    "blueheart_firebase_installation_id";


/* =========================================================
   STATE
========================================================= */

let blueHeartMessaging =
    null;

let blueHeartServiceWorkerRegistration =
    null;

let blueHeartMessagingModule =
    null;


/* =========================================================
   STATUS DISPLAY
========================================================= */

function setBlueHeartPushStatus(
    message
) {

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
   ERROR DISPLAY
========================================================= */

function showBlueHeartPushError(
    error
) {

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
   LOAD FIREBASE SDK
========================================================= */

async function loadBlueHeartFirebase() {

    setBlueHeartPushStatus(
        "Loading Firebase…"
    );


    const firebaseAppModule =
        await import(
            "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js"
        );


    blueHeartMessagingModule =
        await import(
            "https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging.js"
        );


    return {

        firebaseAppModule,

        messagingModule:
            blueHeartMessagingModule

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
        "Preparing Blue Heart service worker…"
    );


    /*
        This is the working Blue Heart push worker.

        updateViaCache: "none"
        prevents Chrome from relying on an old
        service-worker.js copy.
    */

    const registration =
        await navigator.serviceWorker.register(
            "./service-worker.js?v=6pushfix1",
            {

                scope:
                    "./",

                updateViaCache:
                    "none"

            }
        );


    /*
        If already active, use it immediately.
    */

    if (
        registration.active
    ) {

        blueHeartServiceWorkerRegistration =
            registration;


        return registration;

    }


    /*
        Otherwise wait for activation.
    */

    const readyRegistration =
        await Promise.race([

            navigator.serviceWorker.ready,


            new Promise(
                (
                    _,
                    reject
                ) => {

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


    blueHeartServiceWorkerRegistration =
        readyRegistration;


    return readyRegistration;

}


/* =========================================================
   INITIALISE FIREBASE
========================================================= */

async function initialiseBlueHeartFirebase() {

    const {

        firebaseAppModule,

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


    if (
        !supported
    ) {

        throw new Error(
            "Firebase Cloud Messaging is not supported by this browser."
        );

    }


    let firebaseApp;


    const currentApps =
        getApps();


    if (
        currentApps.length > 0
    ) {

        firebaseApp =
            currentApps[0];

    }
    else {

        firebaseApp =
            initializeApp(
                BLUE_HEART_FIREBASE_CONFIG
            );

    }


    blueHeartMessaging =
        getMessaging(
            firebaseApp
        );


    return blueHeartMessaging;

}


/* =========================================================
   SAVE FIREBASE INSTALLATION ID
========================================================= */

function saveBlueHeartFirebaseFid(
    installationId
) {

    if (
        !installationId
    ) {

        return;

    }


    localStorage.setItem(
        BLUE_HEART_FIREBASE_FID_KEY,
        installationId
    );


    console.log(
        "Blue Heart Firebase Installation ID:",
        installationId
    );


    /*
        Refresh the FID display immediately.
    */

    showBlueHeartFirebaseFid();

}


/* =========================================================
   CONNECT PUSH NOTIFICATIONS
========================================================= */

async function connectBlueHeartPush() {

    const button =
        document.getElementById(
            "connectBlueHeartPush"
        );


    try {

        /* -------------------------------------------------
           BUTTON STATE
        ------------------------------------------------- */

        if (
            button
        ) {

            button.disabled =
                true;


            button.textContent =
                "Connecting…";

        }


        /* -------------------------------------------------
           HTTPS CHECK
        ------------------------------------------------- */

        if (
            !window.isSecureContext
        ) {

            throw new Error(
                "Blue Heart must be opened using the HTTPS GitHub Pages address."
            );

        }


        /* -------------------------------------------------
           NOTIFICATION SUPPORT
        ------------------------------------------------- */

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


        /* -------------------------------------------------
           PERMISSION
        ------------------------------------------------- */

        let permission =
            Notification.permission;


        if (
            permission !==
            "granted"
        ) {

            setBlueHeartPushStatus(
                "Waiting for notification permission…"
            );


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


        /* -------------------------------------------------
           FIREBASE
        ------------------------------------------------- */

        setBlueHeartPushStatus(
            "Starting Firebase…"
        );


        const messaging =
            await initialiseBlueHeartFirebase();


        /* -------------------------------------------------
           SERVICE WORKER
        ------------------------------------------------- */

        const serviceWorkerRegistration =
            await getBlueHeartServiceWorker();


        const {

            register,

            onRegistered

        } =
            blueHeartMessagingModule;


        /* -------------------------------------------------
           FID CALLBACK

           Firebase calls this when registration finishes
           and whenever the FID changes.
        ------------------------------------------------- */

        onRegistered(
            messaging,
            installationId => {

                if (
                    installationId
                ) {

                    saveBlueHeartFirebaseFid(
                        installationId
                    );

                }

            }
        );


        /* -------------------------------------------------
           REGISTER APP INSTANCE WITH FCM
        ------------------------------------------------- */

        setBlueHeartPushStatus(
            "Registering this phone with Firebase…"
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


        /* -------------------------------------------------
           SAVE GENERAL SUCCESS STATE
        ------------------------------------------------- */

        localStorage.setItem(
            BLUE_HEART_PUSH_REGISTERED_KEY,
            "true"
        );


        localStorage.setItem(
            BLUE_HEART_PUSH_REGISTERED_AT_KEY,
            new Date().toISOString()
        );


        /* -------------------------------------------------
           SUCCESS MESSAGE

           FID callback may arrive just after register().
        ------------------------------------------------- */

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


        /*
            Give the asynchronous FID callback
            a moment to update the interface.
        */

        setTimeout(
            showBlueHeartFirebaseFid,
            1000
        );


        setTimeout(
            showBlueHeartFirebaseFid,
            3000
        );


        console.log(
            "Blue Heart Firebase registration successful 🩵"
        );

    }
    catch (
        error
    ) {

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
   FIREBASE DEVICE ID UI
========================================================= */

function ensureBlueHeartFirebaseFidArea() {

    const card =
        document.getElementById(
            "blueHeartPushCard"
        );


    if (
        !card
    ) {

        return null;

    }


    let area =
        document.getElementById(
            "blueHeartFidArea"
        );


    if (
        area
    ) {

        return area;

    }


    area =
        document.createElement(
            "div"
        );


    area.id =
        "blueHeartFidArea";


    area.style.marginTop =
        "16px";


    card.appendChild(
        area
    );


    return area;

}


/* =========================================================
   SHOW FIREBASE INSTALLATION ID
========================================================= */

function showBlueHeartFirebaseFid() {

    const area =
        ensureBlueHeartFirebaseFidArea();


    if (
        !area
    ) {

        return;

    }


    const fid =
        localStorage.getItem(
            BLUE_HEART_FIREBASE_FID_KEY
        );


    /*
        FID NOT AVAILABLE YET
    */

    if (
        !fid
    ) {

        area.innerHTML = `

            <hr
                style="
                    opacity:.2;
                    margin:16px 0;
                "
            >

            <p class="eyebrow">
                FIREBASE DEVICE ID
            </p>

            <p
                class="muted"
                style="
                    font-size:13px;
                    line-height:1.5;
                "
            >

                Device ID has not arrived yet.

                <br><br>

                Tap
                <strong>
                    Reconnect notifications
                </strong>
                once.

            </p>

        `;


        return;

    }


    /*
        FID AVAILABLE
    */

    area.innerHTML = `

        <hr
            style="
                opacity:.2;
                margin:16px 0;
            "
        >

        <p class="eyebrow">
            FIREBASE DEVICE ID
        </p>

        <p
            class="muted"
            style="
                font-size:13px;
                line-height:1.5;
            "
        >

            This identifies this Blue Heart
            installation for automatic reminders.

        </p>

        <textarea
            id="blueHeartFidText"
            readonly
            spellcheck="false"
            style="
                width:100%;
                min-height:90px;
                margin-top:10px;
                padding:10px;
                box-sizing:border-box;
                resize:none;
                font-size:12px;
                word-break:break-all;
            "
        ></textarea>

        <button
            id="copyBlueHeartFid"
            class="secondary full"
            type="button"
            style="
                margin-top:8px;
            "
        >

            Copy device ID

        </button>

    `;


    const textArea =
        document.getElementById(
            "blueHeartFidText"
        );


    if (
        textArea
    ) {

        textArea.value =
            fid;

    }


    const copyButton =
        document.getElementById(
            "copyBlueHeartFid"
        );


    if (
        copyButton
    ) {

        copyButton.onclick =
            copyBlueHeartFirebaseFid;

    }

}


/* =========================================================
   COPY FIREBASE INSTALLATION ID
========================================================= */

async function copyBlueHeartFirebaseFid() {

    const fid =
        localStorage.getItem(
            BLUE_HEART_FIREBASE_FID_KEY
        );


    if (
        !fid
    ) {

        return;

    }


    const button =
        document.getElementById(
            "copyBlueHeartFid"
        );


    try {

        await navigator.clipboard.writeText(
            fid
        );


        if (
            button
        ) {

            button.textContent =
                "Copied ✓";

        }

    }
    catch (
        error
    ) {

        console.error(
            "Could not copy Firebase device ID:",
            error
        );


        const textArea =
            document.getElementById(
                "blueHeartFidText"
            );


        if (
            textArea
        ) {

            textArea.focus();

            textArea.select();

        }


        alert(
            "The device ID is selected. Copy it manually."
        );

    }

}


/* =========================================================
   RESTORE EXISTING CONNECTION
========================================================= */

function restoreBlueHeartPushState() {

    const registered =
        localStorage.getItem(
            BLUE_HEART_PUSH_REGISTERED_KEY
        );


    const button =
        document.getElementById(
            "connectBlueHeartPush"
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


    showBlueHeartFirebaseFid();

}


/* =========================================================
   INITIALISE BLUE HEART PUSH UI
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
        Prevent duplicate click handlers.
    */

    button.onclick =
        connectBlueHeartPush;


    restoreBlueHeartPushState();

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
