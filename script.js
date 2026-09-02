"use strict";

/* =========================================================
   BLUE HEART V4 🩵
   Students + Sessions + Follow-ups + Quick Capture
   + Gentle Reminder Centre
========================================================= */


/* =========================================================
   STORAGE
========================================================= */

const STORAGE = {
    PIN_HASH: "blueheart_pin_hash",
    SALT: "blueheart_salt",
    DATA: "blueheart_encrypted_data",
    BACKUP: "blueheart_encrypted_backup"
};


let currentPin = null;
let appData = createDefaultData();
let lastSessionStudentId = null;
let selectedQuickNoteId = null;


/* =========================================================
   DEFAULT DATA
========================================================= */

function createDefaultData() {

    return {

        students: [],
        sessions: [],
        followups: [],
        quickNotes: [],
        schoolLog: {},

        settings: {

            schoolReminderTime: "16:30",
            schoolAppUrl: "",

            notificationsEnabled: false,

            vitaminBReminderTime: "08:00",
            magnesiumReminderTime: "21:00",

            groceryReminderDay: "0",
            groceryReminderTime: "10:00",

            reminderHistory: {}

        },

        personal: {

            date: "",
            vitaminB: false,
            magnesium: false

        },

        groceries: {

            week: "",

            items: [

                {
                    id: makeId(),
                    name: "Vegetables",
                    done: false
                },

                {
                    id: makeId(),
                    name: "Fruits",
                    done: false
                }

            ]

        }

    };

}


/* =========================================================
   HELPERS
========================================================= */

function $(id) {
    return document.getElementById(id);
}


function makeId() {

    if (
        window.crypto &&
        crypto.randomUUID
    ) {
        return crypto.randomUUID();
    }

    return (
        Date.now().toString(36)
        +
        "-"
        +
        Math.random()
            .toString(36)
            .slice(2)
    );
}


function todayString() {

    const d = new Date();

    return (
        d.getFullYear()
        +
        "-"
        +
        String(
            d.getMonth() + 1
        ).padStart(2, "0")
        +
        "-"
        +
        String(
            d.getDate()
        ).padStart(2, "0")
    );
}


function addDays(dateString, days) {

    const date = new Date(
        dateString + "T00:00:00"
    );

    date.setDate(
        date.getDate() + days
    );

    return (
        date.getFullYear()
        +
        "-"
        +
        String(
            date.getMonth() + 1
        ).padStart(2, "0")
        +
        "-"
        +
        String(
            date.getDate()
        ).padStart(2, "0")
    );
}


function prettyDate(value) {

    if (!value) return "";

    return new Date(
        value + "T00:00:00"
    ).toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}


function prettyTime(iso) {

    if (!iso) return "";

    return new Date(iso)
        .toLocaleTimeString(
            "en-IN",
            {
                hour: "numeric",
                minute: "2-digit"
            }
        );
}


function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function priorityIcon(priority) {

    if (priority === "red") {
        return "🔴";
    }

    if (priority === "green") {
        return "🟢";
    }

    return "🟡";
}


function showToast(message) {

    const toast = $("toast");

    if (!toast) return;

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(
        showToast.timer
    );

    showToast.timer = setTimeout(
        () => {
            toast.classList.remove("show");
        },
        2200
    );
}


function openModal(id) {
    $(id)?.classList.remove("hidden");
}


function closeModal(id) {
    $(id)?.classList.add("hidden");
}


/* =========================================================
   ENCRYPTION
========================================================= */

function bytesToBase64(bytes) {

    let binary = "";

    bytes.forEach(
        byte => {
            binary += String.fromCharCode(byte);
        }
    );

    return btoa(binary);
}


function base64ToBytes(base64) {

    const binary = atob(base64);

    const bytes =
        new Uint8Array(
            binary.length
        );

    for (
        let i = 0;
        i < binary.length;
        i++
    ) {
        bytes[i] =
            binary.charCodeAt(i);
    }

    return bytes;
}


function randomBytes(length) {

    const bytes =
        new Uint8Array(length);

    crypto.getRandomValues(bytes);

    return bytes;
}


async function deriveKey(pin, salt) {

    const encoder =
        new TextEncoder();

    const material =
        await crypto.subtle.importKey(
            "raw",
            encoder.encode(pin),
            "PBKDF2",
            false,
            ["deriveKey"]
        );

    return crypto.subtle.deriveKey(

        {
            name: "PBKDF2",
            salt: salt,
            iterations: 150000,
            hash: "SHA-256"
        },

        material,

        {
            name: "AES-GCM",
            length: 256
        },

        false,

        [
            "encrypt",
            "decrypt"
        ]

    );
}


async function hashPin(pin, salt) {

    const encoder =
        new TextEncoder();

    const pinBytes =
        encoder.encode(pin);

    const combined =
        new Uint8Array(
            pinBytes.length +
            salt.length
        );

    combined.set(
        pinBytes,
        0
    );

    combined.set(
        salt,
        pinBytes.length
    );

    const hash =
        await crypto.subtle.digest(
            "SHA-256",
            combined
        );

    return bytesToBase64(
        new Uint8Array(hash)
    );
}


/* =========================================================
   SAVE DATA
========================================================= */

async function saveData() {

    if (!currentPin) return;

    const saltString =
        localStorage.getItem(
            STORAGE.SALT
        );

    if (!saltString) return;

    const salt =
        base64ToBytes(
            saltString
        );

    const key =
        await deriveKey(
            currentPin,
            salt
        );

    const iv =
        randomBytes(12);

    const encoded =
        new TextEncoder().encode(
            JSON.stringify(appData)
        );

    const encrypted =
        await crypto.subtle.encrypt(

            {
                name: "AES-GCM",
                iv: iv
            },

            key,

            encoded

        );

    const payload = {

        iv:
            bytesToBase64(iv),

        data:
            bytesToBase64(
                new Uint8Array(
                    encrypted
                )
            ),

        savedAt:
            new Date().toISOString()

    };


    const previous =
        localStorage.getItem(
            STORAGE.DATA
        );


    if (previous) {

        localStorage.setItem(
            STORAGE.BACKUP,
            previous
        );

    }


    localStorage.setItem(
        STORAGE.DATA,
        JSON.stringify(payload)
    );
}


/* =========================================================
   LOAD DATA
========================================================= */

async function decryptStoredPayload(
    encryptedString,
    pin
) {

    const saltString =
        localStorage.getItem(
            STORAGE.SALT
        );

    if (!saltString) {
        throw new Error(
            "Missing salt"
        );
    }

    const salt =
        base64ToBytes(
            saltString
        );

    const key =
        await deriveKey(
            pin,
            salt
        );

    const payload =
        JSON.parse(
            encryptedString
        );

    const decrypted =
        await crypto.subtle.decrypt(

            {
                name: "AES-GCM",
                iv:
                    base64ToBytes(
                        payload.iv
                    )
            },

            key,

            base64ToBytes(
                payload.data
            )

        );

    return JSON.parse(
        new TextDecoder().decode(
            decrypted
        )
    );
}


async function loadData(pin) {

    const main =
        localStorage.getItem(
            STORAGE.DATA
        );


    if (!main) {

        appData =
            createDefaultData();

        return true;

    }


    try {

        appData =
            await decryptStoredPayload(
                main,
                pin
            );

        normaliseData();

        return true;

    }

    catch (error) {

        console.warn(
            "Latest Blue Heart data could not be opened.",
            error
        );

    }


    const backup =
        localStorage.getItem(
            STORAGE.BACKUP
        );


    if (backup) {

        try {

            appData =
                await decryptStoredPayload(
                    backup,
                    pin
                );

            normaliseData();

            localStorage.setItem(
                STORAGE.DATA,
                backup
            );

            showToast(
                "Recovered previous saved data 🩵"
            );

            return true;

        }

        catch (error) {

            console.error(
                "Safety backup recovery failed.",
                error
            );

        }

    }


    return false;
}


/* =========================================================
   DATA COMPATIBILITY
========================================================= */

function normaliseData() {

    appData.students =
        Array.isArray(
            appData.students
        )
            ? appData.students
            : [];


    appData.sessions =
        Array.isArray(
            appData.sessions
        )
            ? appData.sessions
            : [];


    appData.followups =
        Array.isArray(
            appData.followups
        )
            ? appData.followups
            : [];


    appData.quickNotes =
        Array.isArray(
            appData.quickNotes
        )
            ? appData.quickNotes
            : [];


    appData.schoolLog =
        appData.schoolLog || {};


    appData.settings =
        appData.settings || {};


    appData.settings.schoolReminderTime =
        appData.settings.schoolReminderTime
        || "16:30";


    appData.settings.schoolAppUrl =
        appData.settings.schoolAppUrl
        || "";


    appData.settings.notificationsEnabled =
        Boolean(
            appData.settings
                .notificationsEnabled
        );


    appData.settings.vitaminBReminderTime =
        appData.settings
            .vitaminBReminderTime
        || "08:00";


    appData.settings.magnesiumReminderTime =
        appData.settings
            .magnesiumReminderTime
        || "21:00";


    appData.settings.groceryReminderDay =
        String(
            appData.settings
                .groceryReminderDay
            ?? "0"
        );


    appData.settings.groceryReminderTime =
        appData.settings
            .groceryReminderTime
        || "10:00";


    appData.settings.reminderHistory =
        appData.settings
            .reminderHistory
        || {};


    appData.personal =
        appData.personal || {

            date: "",
            vitaminB: false,
            magnesium: false

        };


    appData.groceries =
        appData.groceries || {

            week: "",
            items: []

        };


    if (
        !Array.isArray(
            appData.groceries.items
        )
    ) {

        appData.groceries.items = [];

    }


    if (
        !appData.groceries.items.length
    ) {

        appData.groceries.items = [

            {
                id: makeId(),
                name: "Vegetables",
                done: false
            },

            {
                id: makeId(),
                name: "Fruits",
                done: false
            }

        ];

    }

}
/* =========================================================
   PIN
========================================================= */

function validPin(pin) {

    return /^\d{4}$/.test(pin);

}


function updateLockScreen() {

    const hasPin =
        Boolean(
            localStorage.getItem(
                STORAGE.PIN_HASH
            )
        );


    $("confirmPinWrap")
        ?.classList
        .toggle(
            "hidden",
            hasPin
        );


    if ($("lockSubtitle")) {

        $("lockSubtitle")
            .textContent =

            hasPin
                ? "Enter your 4-digit PIN."
                : "Create a simple 4-digit PIN.";

    }


    if ($("pinSubmit")) {

        $("pinSubmit")
            .textContent =

            hasPin
                ? "Open Blue Heart"
                : "Create PIN";

    }


    if ($("confirmPin")) {

        $("confirmPin").required =
            !hasPin;

        $("confirmPin").value =
            "";

    }


    if ($("pinInput")) {

        $("pinInput").value =
            "";

    }


    if ($("lockError")) {

        $("lockError").textContent =
            "";

    }

}


async function handlePinSubmit(event) {

    event.preventDefault();

    const pin =
        $("pinInput")
            .value
            .trim();

    const savedHash =
        localStorage.getItem(
            STORAGE.PIN_HASH
        );


    if (!validPin(pin)) {

        $("lockError")
            .textContent =
            "Enter exactly 4 numbers.";

        return;

    }


    /* FIRST USE */

    if (!savedHash) {

        const confirmPin =
            $("confirmPin")
                .value
                .trim();


        if (
            !validPin(confirmPin)
            ||
            confirmPin !== pin
        ) {

            $("lockError")
                .textContent =
                "The two PINs don't match.";

            return;

        }


        const salt =
            randomBytes(16);


        localStorage.setItem(

            STORAGE.SALT,

            bytesToBase64(
                salt
            )

        );


        localStorage.setItem(

            STORAGE.PIN_HASH,

            await hashPin(
                pin,
                salt
            )

        );


        currentPin = pin;

        appData =
            createDefaultData();

        await saveData();

        unlockApp();

        showToast(
            "Blue Heart is ready 🩵"
        );

        return;

    }


    /* EXISTING PIN */

    const salt =
        base64ToBytes(

            localStorage.getItem(
                STORAGE.SALT
            )

        );


    const enteredHash =
        await hashPin(
            pin,
            salt
        );


    if (
        enteredHash !== savedHash
    ) {

        $("lockError")
            .textContent =
            "That PIN isn't correct.";

        $("pinInput").value =
            "";

        return;

    }


    const loaded =
        await loadData(pin);


    if (!loaded) {

        $("lockError")
            .textContent =
            "Blue Heart couldn't open the saved data.";

        return;

    }


    currentPin = pin;

    unlockApp();

}


/* =========================================================
   OPEN / LOCK
========================================================= */

function unlockApp() {

    $("lockScreen")
        ?.classList
        .add(
            "hidden"
        );


    $("app")
        ?.classList
        .remove(
            "hidden"
        );


    resetDaily();

    ensureQuickCaptureUI();

    ensureFollowupPrompt();

    renderEverything();

    navigate("today");

    startReminderEngine();

}


function lockApp() {

    stopReminderEngine();

    currentPin = null;

    $("app")
        ?.classList
        .add(
            "hidden"
        );

    $("lockScreen")
        ?.classList
        .remove(
            "hidden"
        );

    updateLockScreen();

}


/* =========================================================
   NAVIGATION
========================================================= */

function navigate(name) {

    document
        .querySelectorAll(
            ".view"
        )
        .forEach(
            view => {

                view.classList.remove(
                    "active"
                );

            }
        );


    $(
        `view-${name}`
    )
        ?.classList
        .add(
            "active"
        );


    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(
            button => {

                button.classList.toggle(

                    "active",

                    button.dataset.go === name

                );

            }
        );


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    renderEverything();

}


/* =========================================================
   STUDENT HELPERS
========================================================= */

function getStudent(id) {

    return appData.students.find(
        student =>
            student.id === id
    );

}


function openStudentForm(student = null) {

    $("studentForm").reset();

    $("studentEditId").value =
        student?.id || "";

    $("studentModalTitle")
        .textContent =
        student
            ? "Edit student"
            : "Add student";


    if (student) {

        $("studentName").value =
            student.name || "";

        $("studentClass").value =
            student.className || "";

        $("studentId").value =
            student.studentId || "";

        $("studentCategory").value =
            student.category || "Academic";

        $("studentPriority").value =
            student.priority || "yellow";

        $("studentNotes").value =
            student.notes || "";

    }


    openModal(
        "studentModal"
    );

}


/* =========================================================
   SAVE STUDENT
========================================================= */

async function saveStudent(event) {

    event.preventDefault();


    const editId =
        $("studentEditId").value;


    const name =
        $("studentName")
            .value
            .trim();


    if (!name) return;


    const existing =
        appData.students.find(
            student =>
                student.id === editId
        );


    const student = {

        id:
            editId || makeId(),

        name: name,

        className:
            $("studentClass")
                .value
                .trim(),

        studentId:
            $("studentId")
                .value
                .trim(),

        category:
            $("studentCategory")
                .value,

        priority:
            $("studentPriority")
                .value,

        notes:
            $("studentNotes")
                .value
                .trim(),

        createdAt:
            existing?.createdAt
            ||
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString()

    };


    if (existing) {

        const index =
            appData.students.findIndex(
                item =>
                    item.id === editId
            );

        appData.students[index] =
            student;

    }

    else {

        appData.students.push(
            student
        );

    }


    await saveData();

    closeModal(
        "studentModal"
    );

    renderEverything();

    showToast(
        existing
            ? "Student updated"
            : "Student added"
    );

}


/* =========================================================
   RENDER STUDENTS
========================================================= */

function renderStudents() {

    const list =
        $("studentList");


    if (!list) return;


    const search =
        $("studentSearch")
            ?.value
            .trim()
            .toLowerCase()
        || "";


    const students =
        appData.students

            .filter(
                student => {

                    const text =

                        `${student.name}
                         ${student.className}
                         ${student.studentId}
                         ${student.category}`

                            .toLowerCase();


                    return text.includes(
                        search
                    );

                }
            )

            .sort(
                (a, b) =>
                    a.name.localeCompare(
                        b.name
                    )
            );


    if (!students.length) {

        list.innerHTML = `

            <div class="empty-state">

                🩵

                <h3>
                    ${
                        search
                            ? "No match"
                            : "No students yet"
                    }
                </h3>

                <p class="muted">
                    ${
                        search
                            ? "Try another search."
                            : "Add a student when you need to."
                    }
                </p>

            </div>
        `;

        return;

    }


    list.innerHTML =

        students
            .map(
                student => `

                    <button
                        class="student-card"
                        type="button"
                        data-open-student="${student.id}"
                    >

                        <div class="student-main">

                            <div class="student-avatar">
                                ${priorityIcon(
                                    student.priority
                                )}
                            </div>

                            <div>

                                <strong>
                                    ${escapeHTML(
                                        student.name
                                    )}
                                </strong>

                                <p class="muted">

                                    ${
                                        escapeHTML(
                                            student.className
                                            ||
                                            "Class not added"
                                        )
                                    }

                                    ${
                                        student.studentId
                                            ? " · "
                                              +
                                              escapeHTML(
                                                  student.studentId
                                              )
                                            : ""
                                    }

                                </p>

                            </div>

                        </div>


                        <span class="student-category">

                            ${escapeHTML(
                                student.category
                                ||
                                "Other"
                            )}

                        </span>

                    </button>

                `
            )
            .join("");

}


/* =========================================================
   STUDENT DETAILS
========================================================= */

function openStudentDetails(id) {

    const student =
        getStudent(id);
        
        const counsellingSlots =
    getStudentCounsellingSlots(
        student.className
    );


    if (!student) return;


    const sessions =
        appData.sessions

            .filter(
                session =>
                    session.studentId === id
            )

            .sort(
                (a, b) =>
                    b.date.localeCompare(
                        a.date
                    )
            );


    const followups =
        appData.followups

            .filter(
                followup =>
                    followup.studentId === id
                    &&
                    !followup.completed
            )

            .sort(
                (a, b) =>
                    a.date.localeCompare(
                        b.date
                    )
            );



    $("studentDetail")
        .innerHTML = `

            <p class="eyebrow">
                STUDENT
            </p>


            <h2>
                ${escapeHTML(
                    student.name
                )}
            </h2>


            <p class="muted">

                ${priorityIcon(
                    student.priority
                )}

                ${
                    escapeHTML(
                        student.className
                        ||
                        "No class"
                    )
                }

                ${
                    student.studentId
                        ? " · "
                          +
                          escapeHTML(
                              student.studentId
                          )
                        : ""
                }

            </p>


            <div class="button-row">

                <button
                    class="secondary"
                    type="button"
                    data-edit-student="${student.id}"
                >
                    Edit
                </button>


                <button
                    class="secondary"
                    type="button"
                    data-session-student="${student.id}"
                >
                    Log session
                </button>


                <button
                    class="secondary"
                    type="button"
                    data-followup-student="${student.id}"
                >
                    Add follow-up
                </button>

            </div>


            <section class="detail-block">

                <p class="eyebrow">
                    CATEGORY
                </p>

                <p>
                    ${escapeHTML(
                        student.category
                        ||
                        "Other"
                    )}
                </p>

            </section>


            <section class="detail-block">

                <p class="eyebrow">
                    PRIVATE WORKING NOTE
                </p>

                <p class="preserve-lines">

                    ${
                        escapeHTML(
                            student.notes
                            ||
                            "No working note."
                        )
                    }

                </p>

            </section>


            <section class="detail-block">

                <p class="eyebrow">
                    OPEN FOLLOW-UPS
                </p>

                ${
                    followups.length

                        ? followups
                            .map(
                                followup => `

                                    <div class="mini-record">

                                        <strong>
                                            ${priorityIcon(
                                                followup.priority
                                            )}

                                            ${escapeHTML(
                                                followup.action
                                            )}
                                        </strong>

                                        <p class="muted">
                                            ${prettyDate(
                                                followup.date
                                            )}
                                        </p>

                                    </div>

                                `
                            )
                            .join("")

                        : `
                            <p class="muted">
                                Nothing waiting.
                            </p>
                        `
                }

            </section>


            <section class="detail-block">
            <section class="detail-block">

    <p class="eyebrow">
        COUNSELLING AVAILABILITY
    </p>

    <h3>
        🩵 Available school periods
    </h3>

    ${
        counsellingSlots.length

            ? counsellingSlots
                .map(
                    slot => `

                        <div class="mini-record">

                            <strong>

                                ${slot.day}
                                ·
                                ${slot.period}

                            </strong>

                            <p class="muted">

                                ${slot.time}

                            </p>

                        </div>

                    `
                )
                .join("")

            : `

                <p class="muted">

                    No counselling slot was found
                    for the saved class.

                </p>

              `
    }

</section>
                <p class="eyebrow">
                    RECENT SESSIONS
                </p>

                ${
                    sessions.length

                        ? sessions
                            .slice(0, 5)
                            .map(
                                session => `

                                    <div class="mini-record">

                                        <strong>
                                            ${prettyDate(
                                                session.date
                                            )}
                                        </strong>

                                        <p class="preserve-lines">

                                            ${
                                                escapeHTML(
                                                    session.summary
                                                    ||
                                                    "No summary."
                                                )
                                            }

                                        </p>

                                    </div>

                                `
                            )
                            .join("")

                        : `
                            <p class="muted">
                                No sessions logged yet.
                            </p>
                        `
                }

            </section>

        `;


    openModal(
        "studentDetailModal"
    );

}
/* =========================================================
   STUDENT SELECT OPTIONS
========================================================= */

function studentOptions(
    includeEmpty = false
) {

    let options =
        includeEmpty
            ? `
                <option value="">
                    No student selected
                </option>
              `
            : "";


    options +=
        appData.students

            .slice()

            .sort(
                (a, b) =>
                    a.name.localeCompare(
                        b.name
                    )
            )

            .map(
                student => `

                    <option
                        value="${student.id}"
                    >
                        ${escapeHTML(
                            student.name
                        )}

                        ${
                            student.className
                                ? " · "
                                  +
                                  escapeHTML(
                                      student.className
                                  )
                                : ""
                        }
                    </option>

                `
            )
            .join("");


    return options;

}


function populateStudentSelects() {

    if ($("sessionStudentSelect")) {

        $("sessionStudentSelect")
            .innerHTML =
            studentOptions();

    }


    if ($("followupStudentSelect")) {

        $("followupStudentSelect")
            .innerHTML =
            studentOptions();

    }


    if ($("quickNoteStudent")) {

        $("quickNoteStudent")
            .innerHTML =
            studentOptions(true);

    }

}


/* =========================================================
   SESSION
========================================================= */

function openSession(
    studentId = ""
) {

    if (!appData.students.length) {

        showToast(
            "Add a student first"
        );

        return;

    }


    $("sessionForm").reset();

    populateStudentSelects();


    $("sessionDate").value =
        todayString();


    if (studentId) {

        $("sessionStudentSelect")
            .value =
            studentId;

    }


    openModal(
        "sessionModal"
    );

}


async function saveSession(event) {

    event.preventDefault();


    const studentId =
        $("sessionStudentSelect")
            .value;


    if (!studentId) {

        showToast(
            "Choose a student"
        );

        return;

    }


    const session = {

        id:
            makeId(),

        studentId:
            studentId,

        date:
            $("sessionDate")
                .value
            ||
            todayString(),

        summary:
            $("sessionSummary")
                .value
                .trim(),

        nextAction:
            $("sessionNextAction")
                .value
                .trim(),

        createdAt:
            new Date()
                .toISOString()

    };


    appData.sessions.push(
        session
    );


    lastSessionStudentId =
        studentId;


    await saveData();


    closeModal(
        "sessionModal"
    );


    renderEverything();


    showFollowupPrompt(
        studentId
    );

}


/* =========================================================
   FAST FOLLOW-UP AFTER SESSION
========================================================= */

function ensureFollowupPrompt() {

    if ($("quickFollowupModal")) {

        return;

    }


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "quickFollowupModal";


    modal.className =
        "modal hidden";


    modal.innerHTML = `

        <div class="modal-card">

            <button
                id="closeQuickFollowup"
                class="close-btn"
                type="button"
            >
                ×
            </button>


            <p class="eyebrow">
                SESSION SAVED ✓
            </p>


            <h2>
                Need another check-in?
            </h2>


            <p class="muted">
                Choose one. That's all.
            </p>


            <div
                style="
                    display:grid;
                    gap:10px;
                    margin-top:18px;
                "
            >

                <button
                    class="primary"
                    data-followup-days="1"
                    type="button"
                >
                    Tomorrow
                </button>


                <button
                    class="secondary"
                    data-followup-days="3"
                    type="button"
                >
                    In 3 days
                </button>


                <button
                    class="secondary"
                    data-followup-days="7"
                    type="button"
                >
                    In 1 week
                </button>


                <button
                    id="customFollowupButton"
                    class="secondary"
                    type="button"
                >
                    Choose date
                </button>


                <button
                    id="noFollowupButton"
                    class="text-btn"
                    type="button"
                >
                    No follow-up
                </button>

            </div>


            <div
                id="customFollowupArea"
                class="hidden"
                style="
                    margin-top:15px;
                "
            >

                <label class="field-label">

                    Choose date

                    <input
                        id="customFollowupDate"
                        type="date"
                    >

                </label>


                <button
                    id="saveCustomFollowup"
                    class="primary full"
                    type="button"
                >
                    Save follow-up
                </button>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    $("closeQuickFollowup")
        .addEventListener(
            "click",
            () =>
                closeModal(
                    "quickFollowupModal"
                )
        );


    $("noFollowupButton")
        .addEventListener(
            "click",
            () => {

                closeModal(
                    "quickFollowupModal"
                );

                showToast(
                    "Session saved ✓"
                );

            }
        );


    modal
        .querySelectorAll(
            "[data-followup-days]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        await createQuickFollowup(

                            Number(
                                button.dataset
                                    .followupDays
                            )

                        );

                    }
                );

            }
        );


    $("customFollowupButton")
        .addEventListener(
            "click",
            () => {

                $("customFollowupArea")
                    .classList
                    .remove(
                        "hidden"
                    );


                $("customFollowupDate")
                    .value =
                    addDays(
                        todayString(),
                        1
                    );

            }
        );


    $("saveCustomFollowup")
        .addEventListener(
            "click",
            async () => {

                const date =
                    $("customFollowupDate")
                        .value;


                if (!date) {

                    showToast(
                        "Choose a date"
                    );

                    return;

                }


                await createQuickFollowup(
                    null,
                    date
                );

            }
        );

}


function showFollowupPrompt(
    studentId
) {

    ensureFollowupPrompt();


    lastSessionStudentId =
        studentId;


    $("customFollowupArea")
        ?.classList
        .add(
            "hidden"
        );


    openModal(
        "quickFollowupModal"
    );

}


async function createQuickFollowup(
    days = null,
    exactDate = null
) {

    const studentId =
        lastSessionStudentId;


    if (!studentId) {

        return;

    }


    const date =
        exactDate
        ||
        addDays(
            todayString(),
            days
        );


    const student =
        getStudent(
            studentId
        );


    appData.followups.push({

        id:
            makeId(),

        studentId:
            studentId,

        date:
            date,

        priority:
            student?.priority
            ||
            "yellow",

        action:
            "Check-in",

        note:
            "",

        completed:
            false,

        createdAt:
            new Date()
                .toISOString()

    });


    await saveData();


    closeModal(
        "quickFollowupModal"
    );


    renderEverything();


    showToast(
        `Follow-up set for ${prettyDate(date)}`
    );

}


/* =========================================================
   MANUAL FOLLOW-UP
========================================================= */

function openFollowup(
    studentId = ""
) {

    if (!appData.students.length) {

        showToast(
            "Add a student first"
        );

        return;

    }


    $("followupForm").reset();

    populateStudentSelects();


    $("followupDate").value =
        todayString();


    $("followupPriority").value =
        "yellow";


    if (studentId) {

        $("followupStudentSelect")
            .value =
            studentId;

    }


    openModal(
        "followupModal"
    );

}


async function saveFollowup(event) {

    event.preventDefault();


    const studentId =
        $("followupStudentSelect")
            .value;


    const action =
        $("followupAction")
            .value
            .trim();


    if (
        !studentId
        ||
        !action
    ) {

        showToast(
            "Complete the follow-up details"
        );

        return;

    }


    appData.followups.push({

        id:
            makeId(),

        studentId:
            studentId,

        date:
            $("followupDate")
                .value
            ||
            todayString(),

        priority:
            $("followupPriority")
                .value,

        action:
            action,

        note:
            $("followupNote")
                .value
                .trim(),

        completed:
            false,

        createdAt:
            new Date()
                .toISOString()

    });


    await saveData();


    closeModal(
        "followupModal"
    );


    renderEverything();


    showToast(
        "Follow-up added"
    );

}


/* =========================================================
   COMPLETE FOLLOW-UP
========================================================= */

async function completeFollowup(id) {

    const item =
        appData.followups.find(
            followup =>
                followup.id === id
        );


    if (!item) {

        return;

    }


    item.completed =
        true;


    item.completedAt =
        new Date()
            .toISOString();


    await saveData();


    renderEverything();


    showToast(
        "Done ✓"
    );

}


/* =========================================================
   FOLLOW-UP GROUPS
========================================================= */

function getFollowupGroups() {

    const today =
        todayString();


    const open =
        appData.followups

            .filter(
                item =>
                    !item.completed
            )

            .sort(
                (a, b) =>
                    a.date.localeCompare(
                        b.date
                    )
            );


    return {

        overdue:
            open.filter(
                item =>
                    item.date < today
            ),

        today:
            open.filter(
                item =>
                    item.date === today
            ),

        later:
            open.filter(
                item =>
                    item.date > today
            )

    };

}


/* =========================================================
   FOLLOW-UP CARD
========================================================= */

function followupCard(item) {

    const student =
        getStudent(
            item.studentId
        );


    if (!student) {

        return "";

    }


    return `

        <div class="today-item">

            <div>

                <strong>

                    ${priorityIcon(
                        item.priority
                    )}

                    ${escapeHTML(
                        student.name
                    )}

                </strong>


                <p>
                    ${escapeHTML(
                        item.action
                    )}
                </p>


                <small class="muted">

                    ${
                        escapeHTML(
                            student.className
                            ||
                            ""
                        )
                    }

                    ${
                        item.date
                            ? " · "
                              +
                              prettyDate(
                                  item.date
                              )
                            : ""
                    }

                </small>

            </div>


            <button
                class="secondary small"
                data-complete="${item.id}"
                type="button"
            >
                Done
            </button>

        </div>

    `;

}


/* =========================================================
   TODAY DASHBOARD
========================================================= */

function renderToday() {

    const groups =
        getFollowupGroups();


    const todayTotal =
        groups.overdue.length
        +
        groups.today.length;


    if ($("studentCount")) {

        $("studentCount")
            .textContent =
            appData.students.length;

    }


    if ($("todayCount")) {

        $("todayCount")
            .textContent =
            todayTotal;

    }


    if ($("followupCount")) {

        $("followupCount")
            .textContent =

            appData.followups
                .filter(
                    item =>
                        !item.completed
                )
                .length;

    }


    const list =
        $("todayList");


    if (!list) {

        return;

    }


    if (!todayTotal) {

        list.innerHTML = `

            <div class="empty-state">

                🩵

                <h3>
                    Nothing urgent
                </h3>

                <p class="muted">
                    You're caught up for now.
                </p>

            </div>

        `;

        return;

    }


    let html =
        "";


    if (
        groups.overdue.length
    ) {

        html += `

            <p
                class="eyebrow"
                style="
                    color:#A45C5C;
                    margin-top:4px;
                "
            >
                OVERDUE
            </p>

        `;


        html +=
            groups.overdue
                .map(
                    followupCard
                )
                .join("");

    }


    if (
        groups.today.length
    ) {

        html += `

            <p
                class="eyebrow"
                style="
                    margin-top:16px;
                "
            >
                TODAY
            </p>

        `;


        html +=
            groups.today
                .map(
                    followupCard
                )
                .join("");

    }


    list.innerHTML =
        html;

}


/* =========================================================
   SCHEDULE / NEXT
========================================================= */

function renderSchedule() {

    const list =
        $("scheduleList");


    if (!list) {

        return;

    }


    const groups =
        getFollowupGroups();


    if (
        !groups.overdue.length
        &&
        !groups.today.length
        &&
        !groups.later.length
    ) {

        list.innerHTML = `

            <div class="empty-state">

                🩵

                <h3>
                    Nothing scheduled
                </h3>

                <p class="muted">
                    No follow-ups are waiting.
                </p>

            </div>

        `;

        return;

    }


    let html =
        "";


    if (
        groups.overdue.length
    ) {

        html += `

            <section class="card">

                <p
                    class="eyebrow"
                    style="color:#A45C5C;"
                >
                    OVERDUE
                </p>

                <h3>
                    Needs attention
                </h3>

                <div
                    style="
                        display:grid;
                        gap:9px;
                        margin-top:12px;
                    "
                >
                    ${
                        groups.overdue
                            .map(
                                followupCard
                            )
                            .join("")
                    }
                </div>

            </section>

        `;

    }


    if (
        groups.today.length
    ) {

        html += `

            <section class="card">

                <p class="eyebrow">
                    TODAY
                </p>

                <h3>
                    For today
                </h3>

                <div
                    style="
                        display:grid;
                        gap:9px;
                        margin-top:12px;
                    "
                >
                    ${
                        groups.today
                            .map(
                                followupCard
                            )
                            .join("")
                    }
                </div>

            </section>

        `;

    }


    if (
        groups.later.length
    ) {

        html += `

            <section class="card">

                <p class="eyebrow">
                    LATER
                </p>

                <h3>
                    Coming up
                </h3>

                <div
                    style="
                        display:grid;
                        gap:9px;
                        margin-top:12px;
                    "
                >
                    ${
                        groups.later
                            .map(
                                followupCard
                            )
                            .join("")
                    }
                </div>

            </section>

        `;

    }


    list.innerHTML =
        html;

}
/* =========================================================
   REMINDER ENGINE
========================================================= */

let reminderInterval = null;


/* =========================================================
   TIME HELPERS
========================================================= */

function currentTimeString() {

    const now =
        new Date();

    return (
        String(
            now.getHours()
        ).padStart(2, "0")
        +
        ":"
        +
        String(
            now.getMinutes()
        ).padStart(2, "0")
    );

}


function reminderKey(
    type,
    date = todayString()
) {

    return (
        type
        +
        "-"
        +
        date
    );

}


function wasReminderSent(
    type,
    date = todayString()
) {

    const key =
        reminderKey(
            type,
            date
        );


    return Boolean(
        appData.settings
            .reminderHistory?.[
                key
            ]
    );

}


async function markReminderSent(
    type,
    date = todayString()
) {

    if (
        !appData.settings
            .reminderHistory
    ) {

        appData.settings
            .reminderHistory =
            {};

    }


    const key =
        reminderKey(
            type,
            date
        );


    appData.settings
        .reminderHistory[
            key
        ] =
        new Date()
            .toISOString();


    /*
       Keep reminder history small.
    */

    const keys =
        Object.keys(
            appData.settings
                .reminderHistory
        );


    if (
        keys.length > 90
    ) {

        keys

            .sort(
                (a, b) => {

                    return (
                        new Date(
                            appData.settings
                                .reminderHistory[a]
                        )
                        -
                        new Date(
                            appData.settings
                                .reminderHistory[b]
                        )
                    );

                }
            )

            .slice(
                0,
                keys.length - 60
            )

            .forEach(
                key => {

                    delete appData.settings
                        .reminderHistory[
                            key
                        ];

                }
            );

    }


    await saveData();

}


/* =========================================================
   NOTIFICATION PERMISSION
========================================================= */

async function enableNotifications() {

    if (
        !(
            "Notification"
            in window
        )
    ) {

        showToast(
            "Notifications aren't supported here"
        );

        return;

    }


    try {

        const permission =
            await Notification
                .requestPermission();


        if (
            permission ===
            "granted"
        ) {

            appData.settings
                .notificationsEnabled =
                true;


            await saveData();


            renderReminderCenter();


            showToast(
                "Notifications enabled 🔔"
            );

        }

        else {

            appData.settings
                .notificationsEnabled =
                false;


            await saveData();


            renderReminderCenter();


            showToast(
                "Notifications weren't enabled"
            );

        }

    }

    catch (error) {

        console.error(
            "Notification permission failed:",
            error
        );


        showToast(
            "Couldn't enable notifications"
        );

    }

}


/* =========================================================
   SEND NOTIFICATION
========================================================= */

async function showBlueHeartNotification(
    title,
    body,
    tag = "blue-heart"
) {

    if (
        !(
            "Notification"
            in window
        )
    ) {

        return false;

    }


    if (
        Notification.permission !==
        "granted"
    ) {

        return false;

    }


    try {

        /*
           Mobile-friendly approach:
           use the registered service worker.
        */

        if (
            "serviceWorker"
            in navigator
        ) {

            const registration =
                await navigator
                    .serviceWorker
                    .ready;


            await registration
                .showNotification(

                    title,

                    {

                        body:
                            body,

                        icon:
                            "./icon/icon-192.png",

                        badge:
                            "./icon/icon-192.png",

                        tag:
                            tag,

                        renotify:
                            false,

                        silent:
                            false,

                        data: {

                            url:
                                "./"

                        }

                    }

                );


            return true;

        }


        /*
           Desktop fallback.
        */

        new Notification(

            title,

            {

                body:
                    body,

                icon:
                    "./icon/icon-192.png",

                tag:
                    tag

            }

        );


        return true;

    }

    catch (error) {

        console.error(
            "Blue Heart notification failed:",
            error
        );


        return false;

    }

}


/* =========================================================
   TEST NOTIFICATION
========================================================= */

async function sendTestNotification() {

    if (
        !(
            "Notification"
            in window
        )
    ) {

        showToast(
            "Notifications aren't supported"
        );

        return;

    }


    if (
        Notification.permission !==
        "granted"
    ) {

        showToast(
            "Enable notifications first"
        );

        return;

    }


    const sent =
        await showBlueHeartNotification(

            "Blue Heart 🩵",

            "Your gentle reminders are working.",

            "blue-heart-test"

        );


    if (sent) {

        showToast(
            "Test notification sent 🔔"
        );

    }

    else {

        showToast(
            "Notification couldn't be sent"
        );

    }

}


/* =========================================================
   REMINDER CENTRE UI
========================================================= */

function ensureReminderCenterUI() {

    if (
        $("reminderCenterCard")
    ) {

        return;

    }


    const settingsView =
        $("view-settings");


    if (!settingsView) {

        return;

    }


    const card =
        document.createElement(
            "section"
        );


    card.id =
        "reminderCenterCard";


    card.className =
        "card";


    const dangerCard =
        settingsView
            .querySelector(
                ".danger-card"
            );


    if (dangerCard) {

        settingsView.insertBefore(
            card,
            dangerCard
        );

    }

    else {

        settingsView.appendChild(
            card
        );

    }


    renderReminderCenter();

}


/* =========================================================
   RENDER REMINDER CENTRE
========================================================= */

function renderReminderCenter() {

    const card =
        $("reminderCenterCard");


    if (!card) {

        return;

    }


    const permission =
        "Notification"
        in window

            ? Notification.permission

            : "unsupported";


    const enabled =
        permission ===
        "granted";


    const day =
        String(
            appData.settings
                .groceryReminderDay
            ?? "0"
        );


    card.innerHTML = `

        <div class="section-head">

            <div>

                <p class="eyebrow">
                    GENTLE REMINDERS
                </p>

                <h3>
                    🔔 Reminder centre
                </h3>

            </div>


            <span
                class="status-pill
                ${
                    enabled
                        ? "done"
                        : "pending"
                }"
            >
                ${
                    enabled
                        ? "Enabled"
                        : "Off"
                }
            </span>

        </div>


        <p class="muted">

            Blue Heart keeps notification
            messages private and does not
            put student names on the lock screen.

        </p>


        <div class="form-grid">


            <label>

                🏫 School work log

                <input
                    id="reminderSchoolTime"
                    type="time"
                    value="${
                        appData.settings
                            .schoolReminderTime
                        ||
                        "16:30"
                    }"
                >

            </label>


            <label>

                💊 Vitamin B

                <input
                    id="reminderVitaminTime"
                    type="time"
                    value="${
                        appData.settings
                            .vitaminBReminderTime
                        ||
                        "08:00"
                    }"
                >

            </label>


            <label>

                🌙 Magnesium

                <input
                    id="reminderMagnesiumTime"
                    type="time"
                    value="${
                        appData.settings
                            .magnesiumReminderTime
                        ||
                        "21:00"
                    }"
                >

            </label>


            <label>

                🥬 Fruit & vegetable day

                <select
                    id="reminderGroceryDay"
                >

                    <option
                        value="0"
                        ${
                            day === "0"
                                ? "selected"
                                : ""
                        }
                    >
                        Sunday
                    </option>


                    <option
                        value="1"
                        ${
                            day === "1"
                                ? "selected"
                                : ""
                        }
                    >
                        Monday
                    </option>


                    <option
                        value="2"
                        ${
                            day === "2"
                                ? "selected"
                                : ""
                        }
                    >
                        Tuesday
                    </option>


                    <option
                        value="3"
                        ${
                            day === "3"
                                ? "selected"
                                : ""
                        }
                    >
                        Wednesday
                    </option>


                    <option
                        value="4"
                        ${
                            day === "4"
                                ? "selected"
                                : ""
                        }
                    >
                        Thursday
                    </option>


                    <option
                        value="5"
                        ${
                            day === "5"
                                ? "selected"
                                : ""
                        }
                    >
                        Friday
                    </option>


                    <option
                        value="6"
                        ${
                            day === "6"
                                ? "selected"
                                : ""
                        }
                    >
                        Saturday
                    </option>

                </select>

            </label>


            <label>

                🛒 Shopping reminder time

                <input
                    id="reminderGroceryTime"
                    type="time"
                    value="${
                        appData.settings
                            .groceryReminderTime
                        ||
                        "10:00"
                    }"
                >

            </label>


            <button
                id="saveReminderCenter"
                class="primary full"
                type="button"
            >
                Save reminder times
            </button>


            <button
                id="enableReminderNotifications"
                class="secondary full"
                type="button"
            >
                ${
                    enabled
                        ? "Notifications enabled ✓"
                        : "Enable notifications"
                }
            </button>


            <button
                id="testReminderNotification"
                class="secondary full"
                type="button"
            >
                Send test notification
            </button>

        </div>

    `;


    $("saveReminderCenter")
        ?.addEventListener(
            "click",
            saveReminderCenter
        );


    $("enableReminderNotifications")
        ?.addEventListener(
            "click",
            enableNotifications
        );


    $("testReminderNotification")
        ?.addEventListener(
            "click",
            sendTestNotification
        );

}


/* =========================================================
   SAVE REMINDER CENTRE
========================================================= */

async function saveReminderCenter() {

    const schoolTime =
        $("reminderSchoolTime")
            ?.value
        ||
        "16:30";


    const vitaminTime =
        $("reminderVitaminTime")
            ?.value
        ||
        "08:00";


    const magnesiumTime =
        $("reminderMagnesiumTime")
            ?.value
        ||
        "21:00";


    const groceryDay =
        $("reminderGroceryDay")
            ?.value
        ??
        "0";


    const groceryTime =
        $("reminderGroceryTime")
            ?.value
        ||
        "10:00";


    appData.settings
        .schoolReminderTime =
        schoolTime;


    appData.settings
        .vitaminBReminderTime =
        vitaminTime;


    appData.settings
        .magnesiumReminderTime =
        magnesiumTime;


    appData.settings
        .groceryReminderDay =
        groceryDay;


    appData.settings
        .groceryReminderTime =
        groceryTime;


    /*
       Keep original school reminder
       input synchronized.
    */

    if (
        $("schoolReminderTime")
    ) {

        $("schoolReminderTime")
            .value =
            schoolTime;

    }


    await saveData();


    showToast(
        "Reminder times saved"
    );

}


/* =========================================================
   ORIGINAL SCHOOL REMINDER SAVE BUTTON
========================================================= */

async function saveReminder() {

    const time =
        $("schoolReminderTime")
            ?.value
        ||
        "16:30";


    appData.settings
        .schoolReminderTime =
        time;


    await saveData();


    renderReminderCenter();


    showToast(
        "School reminder saved"
    );

}


/* =========================================================
   START / STOP REMINDER ENGINE
========================================================= */

function startReminderEngine() {

    stopReminderEngine();


    /*
       Check immediately.
    */

    checkReminders();


    /*
       Then every 30 seconds while
       Blue Heart is running.
    */

    reminderInterval =
        setInterval(
            checkReminders,
            30000
        );

}


function stopReminderEngine() {

    if (
        reminderInterval
    ) {

        clearInterval(
            reminderInterval
        );


        reminderInterval =
            null;

    }

}


/* =========================================================
   CHECK REMINDERS
========================================================= */

async function checkReminders() {

    if (!currentPin) {

        return;

    }


    if (
        !(
            "Notification"
            in window
        )
    ) {

        return;

    }


    if (
        Notification.permission !==
        "granted"
    ) {

        return;

    }


    const now =
        new Date();


    const currentTime =
        currentTimeString();


    const today =
        todayString();


    /* =====================================================
       SCHOOL WORK LOG
    ===================================================== */

    const schoolTime =
        appData.settings
            .schoolReminderTime
        ||
        "16:30";


    const schoolDone =
        Boolean(
            appData.schoolLog[
                today
            ]
        );


    if (
        !schoolDone
        &&
        currentTime >= schoolTime
        &&
        !wasReminderSent(
            "school",
            today
        )
    ) {

        const sent =
            await showBlueHeartNotification(

                "Blue Heart 🩵",

                "A gentle reminder to complete today's school work log.",

                "blue-heart-school"

            );


        if (sent) {

            await markReminderSent(
                "school",
                today
            );

        }

    }


    /* =====================================================
       VITAMIN B
    ===================================================== */

    const vitaminTime =
        appData.settings
            .vitaminBReminderTime
        ||
        "08:00";


    if (
        !appData.personal
            .vitaminB
        &&
        currentTime >= vitaminTime
        &&
        !wasReminderSent(
            "vitamin-b",
            today
        )
    ) {

        const sent =
            await showBlueHeartNotification(

                "Blue Heart 🩵",

                "Vitamin B reminder 🌿",

                "blue-heart-vitamin-b"

            );


        if (sent) {

            await markReminderSent(
                "vitamin-b",
                today
            );

        }

    }


    /* =====================================================
       MAGNESIUM
    ===================================================== */

    const magnesiumTime =
        appData.settings
            .magnesiumReminderTime
        ||
        "21:00";


    if (
        !appData.personal
            .magnesium
        &&
        currentTime >= magnesiumTime
        &&
        !wasReminderSent(
            "magnesium",
            today
        )
    ) {

        const sent =
            await showBlueHeartNotification(

                "Blue Heart 🩵",

                "Magnesium reminder 🌙",

                "blue-heart-magnesium"

            );


        if (sent) {

            await markReminderSent(
                "magnesium",
                today
            );

        }

    }


    /* =====================================================
       FOLLOW-UPS
    ===================================================== */

    const pendingToday =
        appData.followups
            .filter(
                item =>
                    !item.completed
                    &&
                    item.date <= today
            );


    /*
       Follow-up reminder appears after 08:30.
    */

    if (
        pendingToday.length > 0
        &&
        currentTime >= "08:30"
        &&
        !wasReminderSent(
            "followups",
            today
        )
    ) {

        const count =
            pendingToday.length;


        const message =

            count === 1

                ? "You have 1 follow-up needing attention today."

                : `You have ${count} follow-ups needing attention today.`;



        const sent =
            await showBlueHeartNotification(

                "Blue Heart 🩵",

                message,

                "blue-heart-followups"

            );


        if (sent) {

            await markReminderSent(
                "followups",
                today
            );

        }

    }


    /* =====================================================
       GROCERIES
    ===================================================== */

    const groceryDay =
        Number(
            appData.settings
                .groceryReminderDay
            ??
            0
        );


    const groceryTime =
        appData.settings
            .groceryReminderTime
        ||
        "10:00";


    const allGroceriesDone =

        appData.groceries.items.length > 0

        &&

        appData.groceries.items.every(
            item =>
                item.done
        );


    if (
        now.getDay() ===
            groceryDay
        &&
        !allGroceriesDone
        &&
        currentTime >= groceryTime
        &&
        !wasReminderSent(
            "groceries",
            today
        )
    ) {

        const sent =
            await showBlueHeartNotification(

                "Blue Heart 🩵",

                "A gentle reminder for this week's fruit and vegetable shopping 🥬",

                "blue-heart-groceries"

            );


        if (sent) {

            await markReminderSent(
                "groceries",
                today
            );

        }

    }

}


/* =========================================================
   SCHOOL LOG
========================================================= */

function renderSchoolLog() {

    const done =
        Boolean(
            appData.schoolLog[
                todayString()
            ]
        );


    if (
        $("schoolLogCheckbox")
    ) {

        $("schoolLogCheckbox")
            .checked =
            done;

    }


    if (
        $("schoolLogPill")
    ) {

        $("schoolLogPill")
            .textContent =

            done
                ? "Done ✓"
                : "Pending";


        $("schoolLogPill")
            .classList
            .toggle(
                "done",
                done
            );


        $("schoolLogPill")
            .classList
            .toggle(
                "pending",
                !done
            );

    }


    if (
        $("schoolReminderTime")
    ) {

        $("schoolReminderTime")
            .value =

            appData.settings
                .schoolReminderTime
            ||
            "16:30";

    }

}


/* =========================================================
   SAVE SCHOOL LOG
========================================================= */

async function saveSchoolLog() {

    appData.schoolLog[
        todayString()
    ] =
        $("schoolLogCheckbox")
            .checked;


    await saveData();


    renderEverything();


    if (
        $("schoolLogCheckbox")
            .checked
    ) {

        showToast(
            "School log done ✓"
        );

    }

}


/* =========================================================
   PERSONAL DAILY RESET
========================================================= */

async function resetDaily() {

    if (
        appData.personal.date !==
        todayString()
    ) {

        appData.personal = {

            date:
                todayString(),

            vitaminB:
                false,

            magnesium:
                false

        };


        await saveData();

    }

}


/* =========================================================
   PERSONAL REMINDERS UI
========================================================= */

function renderPersonal() {

    if (
        !$("personalList")
    ) {

        return;

    }


    $("personalList")
        .innerHTML = `

            <label class="check-row">

                <input
                    type="checkbox"
                    data-personal="vitaminB"
                    ${
                        appData.personal
                            .vitaminB
                            ? "checked"
                            : ""
                    }
                >

                <span>

                    💊 Vitamin B

                    <small
                        class="muted"
                        style="
                            display:block;
                        "
                    >

                        Reminder:
                        ${
                            appData.settings
                                .vitaminBReminderTime
                            ||
                            "08:00"
                        }

                    </small>

                </span>

            </label>


            <label class="check-row">

                <input
                    type="checkbox"
                    data-personal="magnesium"
                    ${
                        appData.personal
                            .magnesium
                            ? "checked"
                            : ""
                    }
                >

                <span>

                    🌙 Magnesium

                    <small
                        class="muted"
                        style="
                            display:block;
                        "
                    >

                        Reminder:
                        ${
                            appData.settings
                                .magnesiumReminderTime
                            ||
                            "21:00"
                        }

                    </small>

                </span>

            </label>

        `;

}
/* =========================================================
   QUICK CAPTURE UI
========================================================= */

function ensureQuickCaptureUI() {

    if (
        $("quickCaptureCard")
    ) {
        return;
    }


    const quickActions =
        document.querySelector(
            ".quick-actions"
        );


    if (quickActions) {

        const card =
            document.createElement(
                "section"
            );


        card.id =
            "quickCaptureCard";


        card.className =
            "card";


        quickActions
            .insertAdjacentElement(
                "afterend",
                card
            );

    }


    /* QUICK NOTE MODAL */

    if (
        !$("quickNoteModal")
    ) {

        const modal =
            document.createElement(
                "div"
            );


        modal.id =
            "quickNoteModal";


        modal.className =
            "modal hidden";


        modal.innerHTML = `

            <div class="modal-card">

                <button
                    id="closeQuickNote"
                    class="close-btn"
                    type="button"
                >
                    ×
                </button>


                <p class="eyebrow">
                    QUICK CAPTURE
                </p>


                <h2>
                    What's on your mind?
                </h2>


                <p class="muted">
                    Keep it short. Sort it later.
                </p>


                <div class="form-grid">

                    <label>

                        Quick note

                        <textarea
                            id="quickNoteText"
                            rows="4"
                            maxlength="500"
                            placeholder="Talk to student after lunch..."
                        ></textarea>

                    </label>


                    <label>

                        Student

                        <span class="muted">
                            optional
                        </span>

                        <select
                            id="quickNoteStudent"
                        ></select>

                    </label>


                    <button
                        id="saveQuickNote"
                        class="primary"
                        type="button"
                    >
                        Save & close
                    </button>

                </div>

            </div>

        `;


        document.body
            .appendChild(
                modal
            );


        $("closeQuickNote")
            .addEventListener(
                "click",
                () => {

                    closeModal(
                        "quickNoteModal"
                    );

                }
            );


        $("saveQuickNote")
            .addEventListener(
                "click",
                saveQuickNote
            );

    }


    /* QUICK NOTE → FOLLOW-UP MODAL */

    if (
        !$("quickNoteFollowupModal")
    ) {

        const modal =
            document.createElement(
                "div"
            );


        modal.id =
            "quickNoteFollowupModal";


        modal.className =
            "modal hidden";


        modal.innerHTML = `

            <div class="modal-card">

                <button
                    id="closeQuickNoteFollowup"
                    class="close-btn"
                    type="button"
                >
                    ×
                </button>


                <p class="eyebrow">
                    MAKE FOLLOW-UP
                </p>


                <h2>
                    When?
                </h2>


                <div
                    style="
                        display:grid;
                        gap:10px;
                        margin-top:16px;
                    "
                >

                    <button
                        class="primary"
                        data-note-followup-days="1"
                        type="button"
                    >
                        Tomorrow
                    </button>


                    <button
                        class="secondary"
                        data-note-followup-days="3"
                        type="button"
                    >
                        In 3 days
                    </button>


                    <button
                        class="secondary"
                        data-note-followup-days="7"
                        type="button"
                    >
                        In 1 week
                    </button>


                    <input
                        id="quickNoteCustomDate"
                        type="date"
                    >


                    <button
                        id="saveQuickNoteCustomDate"
                        class="secondary"
                        type="button"
                    >
                        Use this date
                    </button>

                </div>

            </div>

        `;


        document.body
            .appendChild(
                modal
            );


        $("closeQuickNoteFollowup")
            .addEventListener(
                "click",
                () => {

                    closeModal(
                        "quickNoteFollowupModal"
                    );

                }
            );


        modal
            .querySelectorAll(
                "[data-note-followup-days]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        async () => {

                            await quickNoteToFollowup(

                                addDays(
                                    todayString(),

                                    Number(
                                        button.dataset
                                            .noteFollowupDays
                                    )
                                )

                            );

                        }
                    );

                }
            );


        $("saveQuickNoteCustomDate")
            .addEventListener(
                "click",
                async () => {

                    const date =
                        $("quickNoteCustomDate")
                            .value;


                    if (!date) {

                        showToast(
                            "Choose a date"
                        );

                        return;

                    }


                    await quickNoteToFollowup(
                        date
                    );

                }
            );

    }

}


/* =========================================================
   OPEN QUICK NOTE
========================================================= */

function openQuickNoteModal() {

    populateStudentSelects();


    $("quickNoteText")
        .value =
        "";


    $("quickNoteStudent")
        .value =
        "";


    openModal(
        "quickNoteModal"
    );


    setTimeout(
        () => {

            $("quickNoteText")
                ?.focus();

        },
        80
    );

}


/* =========================================================
   SAVE QUICK NOTE
========================================================= */

async function saveQuickNote() {

    const text =
        $("quickNoteText")
            .value
            .trim();


    if (!text) {

        showToast(
            "Write a quick note first"
        );

        return;

    }


    appData.quickNotes.push({

        id:
            makeId(),

        text:
            text,

        studentId:
            $("quickNoteStudent")
                .value
            ||
            "",

        done:
            false,

        createdAt:
            new Date()
                .toISOString(),

        completedAt:
            null

    });


    await saveData();


    closeModal(
        "quickNoteModal"
    );


    renderQuickCapture();


    showToast(
        "Saved 🩵"
    );

}


/* =========================================================
   COMPLETE QUICK NOTE
========================================================= */

async function completeQuickNote(
    id
) {

    const note =
        appData.quickNotes.find(
            item =>
                item.id === id
        );


    if (!note) {

        return;

    }


    note.done =
        true;


    note.completedAt =
        new Date()
            .toISOString();


    await saveData();


    renderQuickCapture();


    showToast(
        "Done ✓"
    );

}


/* =========================================================
   DELETE QUICK NOTE
========================================================= */

async function deleteQuickNote(
    id
) {

    appData.quickNotes =
        appData.quickNotes.filter(
            note =>
                note.id !== id
        );


    await saveData();


    renderQuickCapture();


    showToast(
        "Quick note removed"
    );

}


/* =========================================================
   QUICK NOTE FOLLOW-UP
========================================================= */

function openQuickNoteFollowup(
    id
) {

    const note =
        appData.quickNotes.find(
            item =>
                item.id === id
        );


    if (!note) {

        return;

    }


    if (
        !note.studentId
    ) {

        showToast(
            "Attach a student first"
        );

        return;

    }


    selectedQuickNoteId =
        id;


    $("quickNoteCustomDate")
        .value =
        addDays(
            todayString(),
            1
        );


    openModal(
        "quickNoteFollowupModal"
    );

}


async function quickNoteToFollowup(
    date
) {

    const note =
        appData.quickNotes.find(
            item =>
                item.id ===
                selectedQuickNoteId
        );


    if (
        !note
        ||
        !note.studentId
    ) {

        return;

    }


    const student =
        getStudent(
            note.studentId
        );


    appData.followups.push({

        id:
            makeId(),

        studentId:
            note.studentId,

        date:
            date,

        priority:
            student?.priority
            ||
            "yellow",

        action:
            note.text,

        note:
            "",

        completed:
            false,

        createdAt:
            new Date()
                .toISOString()

    });


    note.done =
        true;


    note.completedAt =
        new Date()
            .toISOString();


    await saveData();


    selectedQuickNoteId =
        null;


    closeModal(
        "quickNoteFollowupModal"
    );


    renderEverything();


    showToast(
        "Turned into follow-up 🔔"
    );

}


/* =========================================================
   ATTACH QUICK NOTE TO STUDENT
========================================================= */

function showAttachStudent(
    noteId
) {

    const note =
        appData.quickNotes.find(
            item =>
                item.id === noteId
        );


    if (!note) {

        return;

    }


    if (
        !appData.students.length
    ) {

        showToast(
            "Add a student first"
        );

        return;

    }


    const studentId =
        prompt(

            "Enter the student's name exactly as it appears in Blue Heart:"

        );


    if (!studentId) {

        return;

    }


    const matchingStudent =
        appData.students.find(
            student =>
                student.name
                    .trim()
                    .toLowerCase()
                ===
                studentId
                    .trim()
                    .toLowerCase()
        );


    if (
        !matchingStudent
    ) {

        showToast(
            "Student not found"
        );

        return;

    }


    note.studentId =
        matchingStudent.id;


    saveData()
        .then(
            () => {

                renderQuickCapture();

                showToast(
                    "Student attached"
                );

            }
        );

}


/* =========================================================
   RENDER QUICK CAPTURE
========================================================= */

function renderQuickCapture() {

    const card =
        $("quickCaptureCard");


    if (!card) {

        return;

    }


    const active =
        appData.quickNotes

            .filter(
                note =>
                    !note.done
            )

            .sort(
                (a, b) =>
                    b.createdAt
                        .localeCompare(
                            a.createdAt
                        )
            );


    card.innerHTML = `

        <div class="section-head">

            <div>

                <p class="eyebrow">
                    QUICK CAPTURE
                </p>

                <h3>
                    Get it out of your head
                </h3>

            </div>


            ${
                active.length

                    ? `
                        <span class="pill">
                            ${active.length}
                        </span>
                      `

                    : ""
            }

        </div>


        <button
            id="openQuickNote"
            class="primary full"
            type="button"
        >
            ＋ Quick note
        </button>


        ${
            active.length

                ? `

                    <div
                        style="
                            display:grid;
                            gap:9px;
                            margin-top:14px;
                        "
                    >

                    ${
                        active
                            .map(
                                note => {

                                    const student =
                                        note.studentId
                                            ? getStudent(
                                                note.studentId
                                              )
                                            : null;


                                    return `

                                        <div class="detail-item">

                                            <strong>

                                                📝

                                                ${escapeHTML(
                                                    note.text
                                                )}

                                            </strong>


                                            <p class="muted">

                                                ${
                                                    student

                                                        ? escapeHTML(
                                                            student.name
                                                          )
                                                          +
                                                          " · "

                                                        : ""
                                                }

                                                ${prettyTime(
                                                    note.createdAt
                                                )}

                                            </p>


                                            <div
                                                style="
                                                    display:flex;
                                                    gap:6px;
                                                    flex-wrap:wrap;
                                                    margin-top:8px;
                                                "
                                            >

                                                ${
                                                    student

                                                        ? `

                                                            <button
                                                                class="secondary small"
                                                                data-open-note-student="${student.id}"
                                                                type="button"
                                                            >
                                                                Student
                                                            </button>

                                                            <button
                                                                class="secondary small"
                                                                data-note-followup="${note.id}"
                                                                type="button"
                                                            >
                                                                🔔 Follow-up
                                                            </button>

                                                          `

                                                        : `

                                                            <button
                                                                class="secondary small"
                                                                data-attach-note="${note.id}"
                                                                type="button"
                                                            >
                                                                Attach
                                                            </button>

                                                          `
                                                }


                                                <button
                                                    class="secondary small"
                                                    data-done-note="${note.id}"
                                                    type="button"
                                                >
                                                    ✓ Done
                                                </button>


                                                <button
                                                    class="text-btn"
                                                    data-delete-note="${note.id}"
                                                    type="button"
                                                >
                                                    Delete
                                                </button>

                                            </div>

                                        </div>

                                    `;

                                }
                            )
                            .join("")
                    }

                    </div>

                  `

                : `

                    <p
                        class="muted"
                        style="
                            text-align:center;
                            margin-top:12px;
                        "
                    >
                        Nothing waiting here.
                    </p>

                  `
        }

    `;


    $("openQuickNote")
        ?.addEventListener(
            "click",
            openQuickNoteModal
        );

}


/* =========================================================
   GROCERIES
========================================================= */

function renderGroceries() {

    if (
        !$("groceryList")
    ) {

        return;

    }


    $("groceryList")
        .innerHTML =

        appData.groceries.items

            .map(
                item => `

                    <label class="grocery-row">

                        <input
                            type="checkbox"
                            data-grocery="${item.id}"
                            ${
                                item.done
                                    ? "checked"
                                    : ""
                            }
                        >

                        <span>
                            ${escapeHTML(
                                item.name
                            )}
                        </span>

                    </label>

                `
            )

            .join("");

}


/* =========================================================
   ADD GROCERY
========================================================= */

async function addGrocery() {

    const input =
        $("newGrocery");


    if (!input) {

        return;

    }


    const value =
        input.value
            .trim();


    if (!value) {

        return;

    }


    appData.groceries.items
        .push({

            id:
                makeId(),

            name:
                value,

            done:
                false

        });


    input.value =
        "";


    await saveData();


    renderGroceries();


    showToast(
        "Added"
    );

}


/* =========================================================
   RESET GROCERIES
========================================================= */

async function resetGroceries() {

    appData.groceries.items
        .forEach(
            item => {

                item.done =
                    false;

            }
        );


    await saveData();


    renderGroceries();


    showToast(
        "Shopping list reset"
    );

}


/* =========================================================
   END-OF-DAY CHECKLIST
========================================================= */

function renderChecklist() {

    const items = [

        {

            text:
                "School work logged",

            done:
                Boolean(
                    appData.schoolLog[
                        todayString()
                    ]
                )

        },

        {

            text:
                "Vitamin B",

            done:
                Boolean(
                    appData.personal
                        .vitaminB
                )

        },

        {

            text:
                "Magnesium",

            done:
                Boolean(
                    appData.personal
                        .magnesium
                )

        }

    ];


    const done =
        items.filter(
            item =>
                item.done
        ).length;


    if (
        $("checklistProgress")
    ) {

        $("checklistProgress")
            .textContent =
            `${done}/3`;

    }


    if (
        $("schoolChecklist")
    ) {

        $("schoolChecklist")
            .innerHTML =

            items
                .map(
                    item => `

                        <div class="check-row">

                            <span>
                                ${
                                    item.done
                                        ? "✓"
                                        : "○"
                                }
                            </span>

                            <span>
                                ${item.text}
                            </span>

                        </div>

                    `
                )
                .join("");

    }

}


/* =========================================================
   SCHOOL APP URL
========================================================= */

async function saveSchoolUrl() {

    let url =
        $("schoolAppUrl")
            ?.value
            .trim()
        ||
        "";


    if (
        url
        &&
        !/^https?:\/\//i
            .test(
                url
            )
    ) {

        url =
            "https://"
            +
            url;

    }


    appData.settings
        .schoolAppUrl =
        url;


    await saveData();


    showToast(
        "School link saved"
    );

}


/* =========================================================
   OPEN SCHOOL APP
========================================================= */

function openSchoolApp() {

    const url =
        appData.settings
            .schoolAppUrl;


    if (!url) {

        navigate(
            "settings"
        );


        showToast(
            "Add the school link first"
        );


        return;

    }


    window.open(

        url,

        "_blank",

        "noopener,noreferrer"

    );

}


/* =========================================================
   EXPORT BACKUP
========================================================= */

function exportBackup() {

    const backup = {

        app:
            "Blue Heart",

        version:
            4,

        exportedAt:
            new Date()
                .toISOString(),

        salt:
            localStorage
                .getItem(
                    STORAGE.SALT
                ),

        pinHash:
            localStorage
                .getItem(
                    STORAGE.PIN_HASH
                ),

        encryptedData:
            localStorage
                .getItem(
                    STORAGE.DATA
                ),

        safetyBackup:
            localStorage
                .getItem(
                    STORAGE.BACKUP
                )

    };


    const blob =
        new Blob(

            [
                JSON.stringify(
                    backup
                )
            ],

            {
                type:
                    "application/json"
            }

        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        `BlueHeart-backup-${todayString()}.json`;


    document.body
        .appendChild(
            link
        );


    link.click();


    link.remove();


    setTimeout(
        () => {

            URL.revokeObjectURL(
                url
            );

        },
        1000
    );


    showToast(
        "Backup exported"
    );

}


/* =========================================================
   IMPORT BACKUP
========================================================= */

async function importBackup(
    event
) {

    const file =
        event.target.files?.[0];


    if (!file) {

        return;

    }


    try {

        const text =
            await file.text();


        const backup =
            JSON.parse(
                text
            );


        if (
            backup.app !==
                "Blue Heart"
            ||
            !backup.salt
            ||
            !backup.pinHash
            ||
            !backup.encryptedData
        ) {

            throw new Error(
                "Invalid backup"
            );

        }


        if (
            !confirm(
                "Restore this Blue Heart backup?"
            )
        ) {

            event.target.value =
                "";

            return;

        }


        localStorage.setItem(
            STORAGE.SALT,
            backup.salt
        );


        localStorage.setItem(
            STORAGE.PIN_HASH,
            backup.pinHash
        );


        localStorage.setItem(
            STORAGE.DATA,
            backup.encryptedData
        );


        if (
            backup.safetyBackup
        ) {

            localStorage.setItem(
                STORAGE.BACKUP,
                backup.safetyBackup
            );

        }


        currentPin =
            null;


        lockApp();


        showToast(
            "Backup restored. Enter its PIN."
        );

    }

    catch (error) {

        console.error(
            error
        );


        alert(
            "This isn't a valid Blue Heart backup."
        );

    }


    event.target.value =
        "";

}
/* =========================================================
   CHANGE PIN
========================================================= */

async function changePin(event) {

    event.preventDefault();


    const current =
        $("currentPin")
            .value
            .trim();


    const next =
        $("newPin")
            .value
            .trim();


    const confirmNext =
        $("confirmNewPin")
            .value
            .trim();


    $("changePinError")
        .textContent =
        "";


    if (
        !validPin(current)
        ||
        !validPin(next)
        ||
        !validPin(confirmNext)
    ) {

        $("changePinError")
            .textContent =
            "Use exactly 4 numbers.";

        return;

    }


    if (
        next !== confirmNext
    ) {

        $("changePinError")
            .textContent =
            "The new PINs don't match.";

        return;

    }


    const salt =
        base64ToBytes(

            localStorage.getItem(
                STORAGE.SALT
            )

        );


    const existingHash =
        await hashPin(
            current,
            salt
        );


    if (
        existingHash !==
        localStorage.getItem(
            STORAGE.PIN_HASH
        )
    ) {

        $("changePinError")
            .textContent =
            "Current PIN is incorrect.";

        return;

    }


    const newSalt =
        randomBytes(16);


    localStorage.setItem(

        STORAGE.SALT,

        bytesToBase64(
            newSalt
        )

    );


    localStorage.setItem(

        STORAGE.PIN_HASH,

        await hashPin(
            next,
            newSalt
        )

    );


    currentPin =
        next;


    await saveData();


    $("changePinForm")
        .reset();


    closeModal(
        "pinModal"
    );


    showToast(
        "PIN changed"
    );

}


/* =========================================================
   DELETE EVERYTHING
========================================================= */

function deleteEverything() {

    if (
        !confirm(
            "Delete all Blue Heart data?"
        )
    ) {

        return;

    }


    if (
        !confirm(
            "This cannot be undone without a backup. Continue?"
        )
    ) {

        return;

    }


    stopReminderEngine();


    localStorage.removeItem(
        STORAGE.PIN_HASH
    );

    localStorage.removeItem(
        STORAGE.SALT
    );

    localStorage.removeItem(
        STORAGE.DATA
    );

    localStorage.removeItem(
        STORAGE.BACKUP
    );


    location.reload();

}

/* =========================================================
   BLUE HEART V5
   COUNSELLING TIMETABLE
========================================================= */

let selectedSlotDay = null;


/* =========================================================
   NORMALISE CLASS
========================================================= */

function normaliseClassName(value) {

    return String(
        value || ""
    )
        .toUpperCase()
        .replace(/\s+/g, "")
        .replace(/[^0-9A-Z&]/g, "");

}


/* =========================================================
   EXPAND COMBINED CLASS

   Examples:

   11A&C -> 11A, 11C
   12A&B -> 12A, 12B
   11D&E -> 11D, 11E
========================================================= */

function expandTimetableClass(value) {

    const clean =
        normaliseClassName(
            value
        );


    const combined =
        clean.match(
            /^(\d+)([A-Z])&([A-Z])$/
        );


    if (combined) {

        const grade =
            combined[1];

        return [
            grade + combined[2],
            grade + combined[3]
        ];

    }


    return [
        clean
    ];

}


/* =========================================================
   DOES A TIMETABLE ENTRY MATCH STUDENT CLASS?
========================================================= */

function timetableClassMatches(
    timetableClass,
    studentClass
) {

    const student =
        normaliseClassName(
            studentClass
        );


    if (!student) {

        return false;

    }


    const expanded =
        expandTimetableClass(
            timetableClass
        );


    return expanded.includes(
        student
    );

}


/* =========================================================
   GET TODAY'S SCHOOL DAY
========================================================= */

function getCurrentSchoolDay() {

    const day =
        new Date()
            .toLocaleDateString(
                "en-US",
                {
                    weekday: "long"
                }
            );


    if (
        BLUE_HEART_SCHOOL_DAYS
            .includes(day)
    ) {

        return day;

    }


    return "Monday";

}


/* =========================================================
   GET STUDENT SLOTS
========================================================= */

function getStudentCounsellingSlots(
    studentClass
) {

    const results = [];


    BLUE_HEART_SCHOOL_DAYS
        .forEach(
            day => {

                const periods =
                    BLUE_HEART_TIMETABLE[
                        day
                    ];


                Object
                    .entries(periods)
                    .forEach(
                        (
                            [
                                period,
                                classes
                            ]
                        ) => {

                            const available =
                                classes.some(
                                    className =>
                                        timetableClassMatches(
                                            className,
                                            studentClass
                                        )
                                );


                            if (available) {

                                results.push({

                                    day:
                                        day,

                                    period:
                                        period,

                                    time:
                                        BLUE_HEART_PERIODS[
                                            period
                                        ].time

                                });

                            }

                        }
                    );

            }
        );


    return results;

}


/* =========================================================
   GET STUDENTS MATCHING A SLOT
========================================================= */

function getStudentsForSlot(
    day,
    period
) {

    const classes =
        BLUE_HEART_TIMETABLE[
            day
        ]?.[
            period
        ]
        ||
        [];


    return appData.students
        .filter(
            student => {

                return classes.some(
                    className =>
                        timetableClassMatches(
                            className,
                            student.className
                        )
                );

            }
        )

        .sort(
            (a, b) => {

                if (
                    a.priority === "red"
                    &&
                    b.priority !== "red"
                ) {

                    return -1;

                }


                if (
                    b.priority === "red"
                    &&
                    a.priority !== "red"
                ) {

                    return 1;

                }


                return a.name
                    .localeCompare(
                        b.name
                    );

            }
        );

}


/* =========================================================
   RENDER DAY BUTTONS
========================================================= */

function renderSlotDayButtons() {

    const container =
        $("slotDayButtons");


    if (!container) {

        return;

    }


    container.innerHTML =

        BLUE_HEART_SCHOOL_DAYS

            .map(
                day => `

                    <button
                        class="
                            slot-day-btn
                            ${
                                day === selectedSlotDay
                                    ? "active"
                                    : ""
                            }
                        "
                        data-slot-day="${day}"
                        type="button"
                    >

                        ${day.slice(0, 3)}

                    </button>

                `
            )

            .join("");

}


/* =========================================================
   RENDER PERIODS
========================================================= */

function renderSlotPeriods() {

    const container =
        $("slotPeriodList");


    if (!container) {

        return;

    }


    const day =
        selectedSlotDay
        ||
        getCurrentSchoolDay();


    const periods =
        BLUE_HEART_TIMETABLE[
            day
        ];


    $("slotDayTitle")
        .textContent =
        day;


    container.innerHTML =

        Object
            .entries(periods)

            .map(
                (
                    [
                        period,
                        classes
                    ]
                ) => {

                    const studentMatches =
                        getStudentsForSlot(
                            day,
                            period
                        );


                    return `

                        <div class="slot-card">

                            <div class="slot-period-head">

                                <div>

                                    <strong>
                                        ${period}
                                    </strong>

                                    <span class="muted">

                                        ${
                                            BLUE_HEART_PERIODS[
                                                period
                                            ].time
                                        }

                                    </span>

                                </div>


                                ${
                                    studentMatches.length

                                        ? `

                                            <span class="slot-match-pill">

                                                ${
                                                    studentMatches.length
                                                }

                                                student${
                                                    studentMatches.length === 1
                                                        ? ""
                                                        : "s"
                                                }

                                            </span>

                                          `

                                        : ""
                                }

                            </div>


                            ${
                                classes.length

                                    ? `

                                        <div class="slot-class-wrap">

                                            ${
                                                classes
                                                    .map(
                                                        className => `

                                                            <span
                                                                class="slot-class-pill"
                                                            >
                                                                ${
                                                                    escapeHTML(
                                                                        className
                                                                    )
                                                                }
                                                            </span>

                                                        `
                                                    )
                                                    .join("")
                                            }

                                        </div>

                                      `

                                    : `

                                        <p class="muted">

                                            No counselling-available
                                            class in this period.

                                        </p>

                                      `
                            }


                            ${
                                studentMatches.length

                                    ? `

                                        <div class="slot-matched-students">

                                            ${
                                                studentMatches
                                                    .map(
                                                        student => `

                                                            <button
                                                                class="slot-student"
                                                                data-open-student="${student.id}"
                                                                type="button"
                                                            >

                                                                <span>

                                                                    ${priorityIcon(
                                                                        student.priority
                                                                    )}

                                                                    ${escapeHTML(
                                                                        student.name
                                                                    )}

                                                                </span>


                                                                <small>

                                                                    ${escapeHTML(
                                                                        student.className
                                                                    )}

                                                                </small>

                                                            </button>

                                                        `
                                                    )
                                                    .join("")
                                            }

                                        </div>

                                      `

                                    : ""
                            }

                        </div>

                    `;

                }
            )

            .join("");

}


/* =========================================================
   RENDER MATCHED STUDENTS SUMMARY
========================================================= */

function renderSlotStudentMatches() {

    const container =
        $("slotStudentMatches");


    if (!container) {

        return;

    }


    const day =
        selectedSlotDay
        ||
        getCurrentSchoolDay();


    const matches = [];


    Object
        .keys(
            BLUE_HEART_TIMETABLE[
                day
            ]
        )
        .forEach(
            period => {

                getStudentsForSlot(
                    day,
                    period
                )
                    .forEach(
                        student => {

                            matches.push({

                                student:
                                    student,

                                period:
                                    period,

                                time:
                                    BLUE_HEART_PERIODS[
                                        period
                                    ].time

                            });

                        }
                    );

            }
        );


    if (!matches.length) {

        container.innerHTML = `

            <div class="empty-state">

                🩵

                <p class="muted">

                    No Blue Heart students
                    match this day's available
                    counselling classes yet.

                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =

        matches
            .map(
                match => `

                    <button
                        class="slot-student-summary"
                        data-open-student="${match.student.id}"
                        type="button"
                    >

                        <div>

                            <strong>

                                ${priorityIcon(
                                    match.student.priority
                                )}

                                ${escapeHTML(
                                    match.student.name
                                )}

                            </strong>


                            <p class="muted">

                                ${escapeHTML(
                                    match.student.className
                                )}

                            </p>

                        </div>


                        <div class="slot-time-right">

                            <strong>
                                ${match.period}
                            </strong>

                            <small>
                                ${match.time}
                            </small>

                        </div>

                    </button>

                `
            )

            .join("");

}


/* =========================================================
   RENDER COMPLETE SLOT VIEW
========================================================= */

function renderCounsellingSlots() {

    if (!selectedSlotDay) {

        selectedSlotDay =
            getCurrentSchoolDay();

    }


    renderSlotDayButtons();

    renderSlotPeriods();

    renderSlotStudentMatches();

}


/* =========================================================
   SLOT DAY CLICK
========================================================= */

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-slot-day]"
            );


        if (!button) {

            return;

        }


        selectedSlotDay =
            button.dataset
                .slotDay;


        renderCounsellingSlots();

    }
);
/* =========================================================
   RENDER EVERYTHING
========================================================= */

function renderEverything() {

    if (!currentPin) {

        return;

    }


    if (
        $("todayDate")
    ) {

        $("todayDate")
            .textContent =

            new Date()
                .toLocaleDateString(

                    "en-IN",

                    {
                        weekday: "long",
                        day: "numeric",
                        month: "long"
                    }

                );

    }


    renderStudents();

    populateStudentSelects();

    renderQuickCapture();

    renderToday();

    renderSchedule();

    renderSchoolLog();

    renderPersonal();

    renderGroceries();

    renderChecklist();

    ensureReminderCenterUI();

    renderReminderCenter();

    renderCounsellingSlots();


    if (
        $("schoolAppUrl")
    ) {

        $("schoolAppUrl")
            .value =
            appData.settings
                .schoolAppUrl
            ||
            "";

    }

}


/* =========================================================
   STATIC EVENTS
========================================================= */

function attachEvents() {

    $("pinForm")
        ?.addEventListener(
            "submit",
            handlePinSubmit
        );


    $("lockButton")
        ?.addEventListener(
            "click",
            lockApp
        );


    document
        .querySelectorAll(
            "[data-go]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () =>
                        navigate(
                            button.dataset.go
                        )
                );

            }
        );


    $("addStudentButton")
        ?.addEventListener(
            "click",
            () =>
                openStudentForm()
        );


    $("addStudentQuick")
        ?.addEventListener(
            "click",
            () =>
                openStudentForm()
        );


    $("studentForm")
        ?.addEventListener(
            "submit",
            saveStudent
        );


    $("studentSearch")
        ?.addEventListener(
            "input",
            renderStudents
        );


    $("addSessionQuick")
        ?.addEventListener(
            "click",
            () =>
                openSession()
        );


    $("sessionForm")
        ?.addEventListener(
            "submit",
            saveSession
        );


    $("followupForm")
        ?.addEventListener(
            "submit",
            saveFollowup
        );


    $("schoolLogCheckbox")
        ?.addEventListener(
            "change",
            saveSchoolLog
        );


    $("saveSchoolReminder")
        ?.addEventListener(
            "click",
            saveReminder
        );


    $("notifyButton")
        ?.addEventListener(
            "click",
            enableNotifications
        );


    $("schoolAppButton")
        ?.addEventListener(
            "click",
            openSchoolApp
        );


    $("saveSchoolUrl")
        ?.addEventListener(
            "click",
            saveSchoolUrl
        );


    $("addGrocery")
        ?.addEventListener(
            "click",
            addGrocery
        );


    $("resetGroceries")
        ?.addEventListener(
            "click",
            resetGroceries
        );


    $("newGrocery")
        ?.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    addGrocery();

                }

            }
        );


    $("exportBackup")
        ?.addEventListener(
            "click",
            exportBackup
        );


    $("importBackupButton")
        ?.addEventListener(
            "click",
            () =>
                $("importBackup")
                    ?.click()
        );


    $("importBackup")
        ?.addEventListener(
            "change",
            importBackup
        );


    $("changePinButton")
        ?.addEventListener(
            "click",
            () => {

                $("changePinForm")
                    ?.reset();


                if (
                    $("changePinError")
                ) {

                    $("changePinError")
                        .textContent =
                        "";

                }


                openModal(
                    "pinModal"
                );

            }
        );


    $("changePinForm")
        ?.addEventListener(
            "submit",
            changePin
        );


    $("deleteAllButton")
        ?.addEventListener(
            "click",
            deleteEverything
        );


    document
        .querySelectorAll(
            "[data-close-modal]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () =>
                        closeModal(
                            button.dataset
                                .closeModal
                        )
                );

            }
        );

}


/* =========================================================
   DYNAMIC CLICK EVENTS
========================================================= */

document.addEventListener(
    "click",
    async event => {

        const studentButton =
            event.target.closest(
                "[data-open-student]"
            );


        if (
            studentButton
        ) {

            openStudentDetails(
                studentButton
                    .dataset
                    .openStudent
            );

            return;

        }


        const sessionButton =
            event.target.closest(
                "[data-session-student]"
            );


        if (
            sessionButton
        ) {

            closeModal(
                "studentDetailModal"
            );


            openSession(
                sessionButton
                    .dataset
                    .sessionStudent
            );

            return;

        }


        const followupButton =
            event.target.closest(
                "[data-followup-student]"
            );


        if (
            followupButton
        ) {

            closeModal(
                "studentDetailModal"
            );


            openFollowup(
                followupButton
                    .dataset
                    .followupStudent
            );

            return;

        }


        const editButton =
            event.target.closest(
                "[data-edit-student]"
            );


        if (
            editButton
        ) {

            const student =
                getStudent(
                    editButton
                        .dataset
                        .editStudent
                );


            if (
                student
            ) {

                closeModal(
                    "studentDetailModal"
                );


                openStudentForm(
                    student
                );

            }


            return;

        }


        const completeButton =
            event.target.closest(
                "[data-complete]"
            );


        if (
            completeButton
        ) {

            await completeFollowup(
                completeButton
                    .dataset
                    .complete
            );

            return;

        }


        /* QUICK NOTES */


        const doneNote =
            event.target.closest(
                "[data-done-note]"
            );


        if (
            doneNote
        ) {

            await completeQuickNote(
                doneNote
                    .dataset
                    .doneNote
            );

            return;

        }


        const deleteNote =
            event.target.closest(
                "[data-delete-note]"
            );


        if (
            deleteNote
        ) {

            await deleteQuickNote(
                deleteNote
                    .dataset
                    .deleteNote
            );

            return;

        }


        const attachNote =
            event.target.closest(
                "[data-attach-note]"
            );


        if (
            attachNote
        ) {

            showAttachStudent(
                attachNote
                    .dataset
                    .attachNote
            );

            return;

        }


        const noteStudent =
            event.target.closest(
                "[data-open-note-student]"
            );


        if (
            noteStudent
        ) {

            openStudentDetails(
                noteStudent
                    .dataset
                    .openNoteStudent
            );

            return;

        }


        const noteFollowup =
            event.target.closest(
                "[data-note-followup]"
            );


        if (
            noteFollowup
        ) {

            openQuickNoteFollowup(
                noteFollowup
                    .dataset
                    .noteFollowup
            );

            return;

        }

    }
);


/* =========================================================
   DYNAMIC CHANGE EVENTS
========================================================= */

document.addEventListener(
    "change",
    async event => {

        const personalKey =
            event.target
                .dataset
                ?.personal;


        if (
            personalKey
        ) {

            appData.personal[
                personalKey
            ] =
                event.target
                    .checked;


            await saveData();


            renderChecklist();


            return;

        }


        const groceryId =
            event.target
                .dataset
                ?.grocery;


        if (
            groceryId
        ) {

            const item =
                appData.groceries
                    .items
                    .find(
                        item =>
                            item.id ===
                            groceryId
                    );


            if (
                item
            ) {

                item.done =
                    event.target
                        .checked;


                await saveData();

            }

        }

    }
);


/* =========================================================
   SERVICE WORKER CLICK HANDLING
========================================================= */

if (
    "serviceWorker"
    in navigator
) {

    navigator
        .serviceWorker
        .addEventListener(
            "message",
            event => {

                if (
                    event.data
                    &&
                    event.data.type ===
                    "OPEN_BLUE_HEART"
                ) {

                    window.focus();

                    navigate(
                        "today"
                    );

                }

            }
        );

}


/* =========================================================
   APP VISIBILITY
========================================================= */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState ===
            "visible"
            &&
            currentPin
        ) {

            checkReminders();

        }

    }
);


/* =========================================================
   START
========================================================= */

function initialise() {

    updateLockScreen();

    attachEvents();

    ensureQuickCaptureUI();

    ensureFollowupPrompt();

    ensureReminderCenterUI();


    $("app")
        ?.classList
        .add(
            "hidden"
        );


    $("lockScreen")
        ?.classList
        .remove(
            "hidden"
        );


    console.log(
        "Blue Heart V4 ready 🩵"
    );

}


document.addEventListener(
    "DOMContentLoaded",
    initialise
);
/* =========================================================
   BLUE HEART V5.1
   ROSE MESSAGES + FOLLOW-UP PERIOD HELPERS
========================================================= */

const BLUE_HEART_PERIOD_LABELS = {
    P1: "P1 · 8:30 AM–9:10 AM",
    P2: "P2 · 9:10 AM–9:50 AM",
    P3: "P3 · 10:00 AM–10:40 AM",
    P4: "P4 · 10:40 AM–11:20 AM",
    P5: "P5 · 11:20 AM–12:00 PM",
    P6: "P6 · 12:35 PM–1:15 PM",
    P7: "P7 · 1:15 PM–1:55 PM",
    P8: "P8 · 2:05 PM–2:45 PM"
};

const BLUE_HEART_ROSE_MESSAGES = [
    "You are doing great, my love 🩵",
    "I hope you know how much beauty you bring into people's days.",
    "You don't need to finish everything to be enough for today.",
    "One student, one task, one step at a time.",
    "I'm proud of you, Rose.",
    "Your softness is not a weakness.",
    "Even on difficult days, you are still doing meaningful work.",
    "Drink some water, honey 🌷",
    "You deserve the same gentleness you give everyone else.",
    "Today does not have to be perfect.",
    "Breathe. You have time.",
    "Blue and White Heart is carrying the list. You don't have to."
];

function formatFollowupPeriod(period) {
    return BLUE_HEART_PERIOD_LABELS[period] || period || "";
}

function ensureFollowupPeriodField() {

    if (document.getElementById("followupPeriod")) {
        return;
    }

    const dateInput =
        document.getElementById("followupDate");

    if (!dateInput) {
        return;
    }

    const dateField =
        dateInput.closest("label") ||
        dateInput.parentElement;

    if (!dateField) {
        return;
    }

    const wrap =
        document.createElement("label");

    wrap.innerHTML = `
        Period
        <select id="followupPeriod">
            <option value="">Any time / not decided</option>
            <option value="P1">P1 · 8:30 AM–9:10 AM</option>
            <option value="P2">P2 · 9:10 AM–9:50 AM</option>
            <option value="P3">P3 · 10:00 AM–10:40 AM</option>
            <option value="P4">P4 · 10:40 AM–11:20 AM</option>
            <option value="P5">P5 · 11:20 AM–12:00 PM</option>
            <option value="P6">P6 · 12:35 PM–1:15 PM</option>
            <option value="P7">P7 · 1:15 PM–1:55 PM</option>
            <option value="P8">P8 · 2:05 PM–2:45 PM</option>
        </select>
    `;

    dateField.insertAdjacentElement(
        "afterend",
        wrap
    );
}

function getRoseMessageForToday() {

    const now =
        new Date();

    const seed =
        now.getFullYear() * 1000 +
        (now.getMonth() + 1) * 40 +
        now.getDate();

    return BLUE_HEART_ROSE_MESSAGES[
        seed % BLUE_HEART_ROSE_MESSAGES.length
    ];
}

function ensureRoseMessageCard() {

    const todayView =
        document.getElementById("view-today");

    if (
        !todayView ||
        document.getElementById("roseMessageCard")
    ) {
        return;
    }

    const card =
        document.createElement("section");

    card.id =
        "roseMessageCard";

    card.className =
        "card";

    card.innerHTML = `
        <p class="eyebrow">
            FOR ROSE 🩵
        </p>

        <p
            id="roseDailyMessage"
            style="
                margin-top:8px;
                font-size:1.05rem;
                line-height:1.6;
            "
        ></p>
    `;

    todayView.prepend(card);
}

function renderRoseMessage() {

    ensureRoseMessageCard();

    const message =
        document.getElementById(
            "roseDailyMessage"
        );

    if (message) {
        message.textContent =
            getRoseMessageForToday();
    }
}
/* =========================================================
   BLUE HEART V5.1
   DATA LONGEVITY
========================================================= */

async function requestBlueHeartPersistentStorage() {

    if (
        !navigator.storage ||
        !navigator.storage.persist
    ) {
        return;
    }

    try {

        const persistent =
            await navigator.storage.persisted();

        if (!persistent) {

            await navigator.storage.persist();

        }

    }
    catch (error) {

        console.warn(
            "Persistent storage unavailable",
            error
        );

    }
}


/* =========================================================
   V5.1 STARTUP
========================================================= */

window.addEventListener(
    "load",
    () => {

        setTimeout(
            () => {

                ensureFollowupPeriodField();

                renderRoseMessage();

                requestBlueHeartPersistentStorage();

            },
            300
        );

    }
);



/* =========================================================
   BLUE HEART V6
   BACKGROUND STUDENT FOLLOW-UP PUSH REMINDERS
   =========================================================
   ADD THIS ENTIRE BLOCK TO THE VERY END OF THE EXISTING
   WORKING script.js FILE.
========================================================= */

const BLUE_HEART_V6_REMINDER_BACKEND =
    "https://blue-heart-reminders.sathyapriyaprar246.workers.dev";


/* =========================================================
   V6 SETTINGS STORAGE
========================================================= */

function blueHeartV6GetApiKey() {

    try {

        return String(
            appData?.settings?.reminderApiKey
            || ""
        ).trim();

    }
    catch (error) {

        console.warn(
            "Could not read reminder API key:",
            error
        );

        return "";

    }

}


async function blueHeartV6SaveApiKey() {

    const input =
        document.getElementById(
            "blueHeartV6ApiKey"
        );


    if (!input) {

        return;

    }


    const value =
        input.value.trim();


    if (!value) {

        showToast(
            "Paste the reminder API key first."
        );

        return;

    }


    if (!appData.settings) {

        appData.settings = {};

    }


    appData.settings.reminderApiKey =
        value;


    await saveData();


    blueHeartV6UpdateStatus();


    showToast(
        "Reminder connection saved 🩵"
    );

}


/* =========================================================
   V6 API
========================================================= */

async function blueHeartV6ApiRequest(
    path,
    options = {}
) {

    const apiKey =
        blueHeartV6GetApiKey();


    if (!apiKey) {

        throw new Error(
            "Reminder API key has not been saved."
        );

    }


    const headers = {

        "Content-Type":
            "application/json",

        "X-Blue-Heart-Key":
            apiKey,

        ...(
            options.headers
            || {}
        )

    };


    const response =
        await fetch(

            BLUE_HEART_V6_REMINDER_BACKEND
            +
            path,

            {

                ...options,

                headers:
                    headers

            }

        );


    const text =
        await response.text();


    let result = {};


    if (text) {

        try {

            result =
                JSON.parse(
                    text
                );

        }
        catch (error) {

            result = {

                raw:
                    text

            };

        }

    }


    if (!response.ok) {

        throw new Error(

            result.error
            ||
            (
                "Reminder server error "
                +
                response.status
            )

        );

    }


    return result;

}


/* =========================================================
   STUDENT INFORMATION
========================================================= */

function blueHeartV6StudentForFollowup(
    followup
) {

    if (!followup) {

        return null;

    }


    return appData.students.find(

        student =>
            student.id
            ===
            followup.studentId

    ) || null;

}


/* =========================================================
   CREATE PAYLOAD
========================================================= */

function blueHeartV6FollowupPayload(
    followup
) {

    const student =
        blueHeartV6StudentForFollowup(
            followup
        );


    if (!student) {

        throw new Error(
            "Student record was not found."
        );

    }


    return {

        id:
            followup.id,

        date:
            followup.date,

        period:
            followup.period
            || "",

        studentName:
            student.name
            || "Student",

        studentClass:
            student.className
            || "",

        action:
            followup.action
            || "Follow up",

        note:
            followup.note
            || ""

    };

}


/* =========================================================
   SEND / UPDATE REMINDER
========================================================= */

async function blueHeartV6SyncFollowup(
    followup,
    showMessage = false
) {

    if (
        !followup
        ||
        !followup.id
    ) {

        return false;

    }


    if (
        followup.completed
    ) {

        return blueHeartV6DeleteReminder(
            followup.id,
            showMessage
        );

    }


    if (
        !blueHeartV6GetApiKey()
    ) {

        if (showMessage) {

            showToast(
                "Save the reminder API key in Settings first."
            );

        }


        return false;

    }


    try {

        const payload =
            blueHeartV6FollowupPayload(
                followup
            );


        await blueHeartV6ApiRequest(

            "/api/reminders",

            {

                method:
                    "POST",

                body:
                    JSON.stringify(
                        payload
                    )

            }

        );


        followup.pushSyncedAt =
            new Date()
                .toISOString();


        followup.pushSyncError =
            "";


        await saveData();


        if (showMessage) {

            showToast(
                "Follow-up reminder scheduled 🩵"
            );

        }


        return true;

    }

    catch (error) {

        console.error(
            "Background reminder sync failed:",
            error
        );


        followup.pushSyncError =
            error?.message
            ||
            String(error);


        await saveData();


        if (showMessage) {

            showToast(
                "Follow-up saved locally, but push sync failed."
            );

        }


        return false;

    }

}


/* =========================================================
   DELETE BACKGROUND REMINDER
========================================================= */

async function blueHeartV6DeleteReminder(
    followupId,
    showMessage = false
) {

    if (!followupId) {

        return false;

    }


    if (
        !blueHeartV6GetApiKey()
    ) {

        return false;

    }


    try {

        await blueHeartV6ApiRequest(

            "/api/reminders/"
            +
            encodeURIComponent(
                followupId
            ),

            {

                method:
                    "DELETE"

            }

        );


        if (showMessage) {

            showToast(
                "Background reminder cancelled."
            );

        }


        return true;

    }

    catch (error) {

        console.error(
            "Could not cancel reminder:",
            error
        );


        if (showMessage) {

            showToast(
                "Could not cancel the background reminder."
            );

        }


        return false;

    }

}


/* =========================================================
   SYNC ALL PENDING FOLLOW-UPS
========================================================= */

async function blueHeartV6SyncPending() {

    if (
        !blueHeartV6GetApiKey()
    ) {

        showToast(
            "Save the reminder API key first."
        );

        return;

    }


    const button =
        document.getElementById(
            "blueHeartV6SyncButton"
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Syncing…";

    }


    const pending =
        appData.followups.filter(

            followup =>
                followup
                &&
                followup.id
                &&
                followup.date
                &&
                !followup.completed

        );


    let success =
        0;


    let failed =
        0;


    for (
        const followup
        of pending
    ) {

        const result =
            await blueHeartV6SyncFollowup(
                followup,
                false
            );


        if (result) {

            success++;

        }
        else {

            failed++;

        }

    }


    if (button) {

        button.disabled =
            false;

        button.textContent =
            "Sync pending follow-ups";

    }


    if (
        pending.length === 0
    ) {

        showToast(
            "No pending follow-ups to sync."
        );

        return;

    }


    if (
        failed === 0
    ) {

        showToast(

            success
            +
            (
                success === 1
                    ? " reminder synced 🩵"
                    : " reminders synced 🩵"
            )

        );

    }
    else {

        showToast(

            success
            +
            " synced · "
            +
            failed
            +
            " could not sync"

        );

    }

}


/* =========================================================
   TEST CONNECTION
========================================================= */

async function blueHeartV6TestConnection() {

    const apiKey =
        blueHeartV6GetApiKey();


    if (!apiKey) {

        showToast(
            "Save the API key first."
        );

        return;

    }


    const status =
        document.getElementById(
            "blueHeartV6Status"
        );


    if (status) {

        status.textContent =
            "Checking connection…";

    }


    try {

        const response =
            await fetch(
                BLUE_HEART_V6_REMINDER_BACKEND
            );


        const result =
            await response.json();


        if (
            result.ok
            &&
            result.deviceConfigured
            &&
            result.serviceAccountConfigured
            &&
            result.apiConfigured
            &&
            result.reminderStorageConfigured
        ) {

            if (status) {

                status.textContent =
                    "Connected 🩵 Background reminders are ready.";

            }


            showToast(
                "Reminder backend connected 🩵"
            );

        }
        else {

            throw new Error(
                "Backend configuration is incomplete."
            );

        }

    }

    catch (error) {

        console.error(
            "Connection test failed:",
            error
        );


        if (status) {

            status.textContent =
                "Could not connect to the reminder backend.";

        }


        showToast(
            "Connection test failed."
        );

    }

}


/* =========================================================
   SETTINGS CARD
========================================================= */

function blueHeartV6CreateSettingsCard() {

    if (
        document.getElementById(
            "blueHeartV6ReminderCard"
        )
    ) {

        blueHeartV6UpdateStatus();

        return;

    }


    const settingsView =
        document.getElementById(
            "view-settings"
        )
        ||
        document.getElementById(
            "settings"
        );


    if (!settingsView) {

        return;

    }


    const card =
        document.createElement(
            "div"
        );


    card.id =
        "blueHeartV6ReminderCard";


    card.className =
        "card";


    card.style.marginTop =
        "16px";


    card.innerHTML = `

        <div
            style="
                display:flex;
                gap:12px;
                align-items:flex-start;
            "
        >

            <div
                style="
                    font-size:26px;
                    line-height:1;
                "
            >
                🔔
            </div>


            <div
                style="
                    flex:1;
                    min-width:0;
                "
            >

                <h3
                    style="
                        margin:0 0 6px;
                    "
                >
                    Follow-up push reminders
                </h3>


                <p
                    style="
                        margin:0 0 14px;
                        line-height:1.45;
                        opacity:.75;
                    "
                >
                    Send counselling follow-up reminders
                    to this phone even when Blue Heart
                    is closed.
                </p>


                <label
                    for="blueHeartV6ApiKey"
                    style="
                        display:block;
                        margin-bottom:6px;
                        font-weight:600;
                    "
                >
                    Reminder API key
                </label>


                <input
                    id="blueHeartV6ApiKey"
                    type="password"
                    autocomplete="off"
                    placeholder="Paste BLUE_HEART_API_KEY"
                    style="
                        width:100%;
                        box-sizing:border-box;
                        margin-bottom:8px;
                    "
                >


                <p
                    id="blueHeartV6Status"
                    style="
                        margin:4px 0 12px;
                        font-size:13px;
                        opacity:.75;
                        line-height:1.4;
                    "
                >
                </p>


                <div
                    style="
                        display:flex;
                        gap:8px;
                        flex-wrap:wrap;
                    "
                >

                    <button
                        id="blueHeartV6SaveButton"
                        type="button"
                    >
                        Save connection
                    </button>


                    <button
                        id="blueHeartV6TestButton"
                        type="button"
                    >
                        Test
                    </button>


                    <button
                        id="blueHeartV6SyncButton"
                        type="button"
                    >
                        Sync pending follow-ups
                    </button>

                </div>

            </div>

        </div>

    `;


    settingsView.appendChild(
        card
    );


    const input =
        document.getElementById(
            "blueHeartV6ApiKey"
        );


    if (input) {

        input.value =
            blueHeartV6GetApiKey();

    }


    document
        .getElementById(
            "blueHeartV6SaveButton"
        )
        ?.addEventListener(
            "click",
            blueHeartV6SaveApiKey
        );


    document
        .getElementById(
            "blueHeartV6TestButton"
        )
        ?.addEventListener(
            "click",
            blueHeartV6TestConnection
        );


    document
        .getElementById(
            "blueHeartV6SyncButton"
        )
        ?.addEventListener(
            "click",
            blueHeartV6SyncPending
        );


    blueHeartV6UpdateStatus();

}


/* =========================================================
   SETTINGS STATUS
========================================================= */

function blueHeartV6UpdateStatus() {

    const status =
        document.getElementById(
            "blueHeartV6Status"
        );


    if (!status) {

        return;

    }


    if (
        blueHeartV6GetApiKey()
    ) {

        status.textContent =
            "Connection saved locally. Tap Test to verify it.";

    }
    else {

        status.textContent =
            "Not connected yet.";

    }

}


/* =========================================================
   AUTOMATICALLY SYNC NEW FOLLOW-UPS

   We wrap the EXISTING saveFollowup() function.
   The original function still performs all normal
   Blue Heart local/encrypted saving.
========================================================= */

if (
    typeof saveFollowup ===
    "function"
) {

    const blueHeartV6OriginalSaveFollowup =
        saveFollowup;


    saveFollowup =
        async function(event) {

            const beforeIds =
                new Set(

                    appData.followups.map(
                        followup =>
                            followup.id
                    )

                );


            const result =
                await blueHeartV6OriginalSaveFollowup(
                    event
                );


            const newlyCreated =
                appData.followups.find(

                    followup =>
                        !beforeIds.has(
                            followup.id
                        )

                );


            if (newlyCreated) {

                blueHeartV6SyncFollowup(
                    newlyCreated,
                    false
                );

            }


            return result;

        };

}


/* =========================================================
   AUTOMATICALLY CANCEL COMPLETED FOLLOW-UPS

   We wrap the EXISTING completeFollowup() function.
========================================================= */

if (
    typeof completeFollowup ===
    "function"
) {

    const blueHeartV6OriginalCompleteFollowup =
        completeFollowup;


    completeFollowup =
        async function(id) {

            const result =
                await blueHeartV6OriginalCompleteFollowup(
                    id
                );


            blueHeartV6DeleteReminder(
                id,
                false
            );


            return result;

        };

}


/* =========================================================
   SETTINGS NAVIGATION HOOK

   Every time navigate() runs, ensure the reminder card
   exists. Existing navigation behaviour is preserved.
========================================================= */

if (
    typeof navigate ===
    "function"
) {

    const blueHeartV6OriginalNavigate =
        navigate;


    navigate =
        function(name) {

            const result =
                blueHeartV6OriginalNavigate(
                    name
                );


            if (
                name ===
                "settings"
            ) {

                setTimeout(
                    blueHeartV6CreateSettingsCard,
                    0
                );

            }


            return result;

        };

}


/* =========================================================
   INITIALISE
========================================================= */

function blueHeartV6Initialise() {

    try {

        blueHeartV6CreateSettingsCard();


        console.log(
            "Blue Heart V6 follow-up reminders ready 🩵"
        );

    }

    catch (error) {

        console.error(
            "Blue Heart V6 reminder setup failed:",
            error
        );

    }

}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        blueHeartV6Initialise
    );

}
else {

    blueHeartV6Initialise();

}


/* =========================================================
   END BLUE HEART V6 BACKGROUND REMINDERS
========================================================= */
/* =========================================================
   BLUE HEART V6.1 🩵
   EDIT + DELETE RECORDS

   Adds:
   - Edit follow-up
   - Delete follow-up + cancel remote reminder
   - Edit session
   - Delete session
   - Delete student + related records

   Existing encrypted data remains compatible.
========================================================= */


/* =========================================================
   EDITING STATE
========================================================= */

let blueHeartEditingFollowupId = "";
let blueHeartEditingSessionId = "";


/* =========================================================
   SMALL V6.1 HELPERS
========================================================= */

function blueHeartSetSubmitLabel(
    formId,
    text
) {

    const form =
        $(formId);

    if (!form) {
        return;
    }

    const submit =
        form.querySelector(
            'button[type="submit"], input[type="submit"]'
        );

    if (!submit) {
        return;
    }

    if (
        submit.tagName
            .toLowerCase() ===
        "input"
    ) {

        submit.value =
            text;

    }

    else {

        submit.textContent =
            text;

    }

}


/* =========================================================
   WRAP NORMAL FOLLOW-UP OPEN

   Opening a normal follow-up must clear edit mode.
========================================================= */

const blueHeartV61OriginalOpenFollowup =
    openFollowup;


openFollowup =
    function (
        studentId = ""
    ) {

        blueHeartEditingFollowupId =
            "";

        blueHeartV61OriginalOpenFollowup(
            studentId
        );

        blueHeartSetSubmitLabel(
            "followupForm",
            "Add follow-up"
        );

    };


/* =========================================================
   OPEN EXISTING FOLLOW-UP FOR EDITING
========================================================= */

function openFollowupForEdit(
    followupId
) {

    const followup =
        appData.followups.find(
            item =>
                item.id ===
                followupId
        );

    if (!followup) {

        showToast(
            "Follow-up not found"
        );

        return;

    }


    blueHeartEditingFollowupId =
        followup.id;


    /*
       Use the original opener so that
       edit mode is not reset.
    */

    blueHeartV61OriginalOpenFollowup(
        followup.studentId
    );


    populateStudentSelects();

    ensureFollowupPeriodField();


    if (
        $("followupStudentSelect")
    ) {

        $("followupStudentSelect")
            .value =
            followup.studentId
            || "";

    }


    if (
        $("followupDate")
    ) {

        $("followupDate")
            .value =
            followup.date
            ||
            todayString();

    }


    if (
        $("followupPriority")
    ) {

        $("followupPriority")
            .value =
            followup.priority
            ||
            "yellow";

    }


    if (
        $("followupPeriod")
    ) {

        $("followupPeriod")
            .value =
            followup.period
            ||
            "";

    }


    if (
        $("followupAction")
    ) {

        $("followupAction")
            .value =
            followup.action
            ||
            "";

    }


    if (
        $("followupNote")
    ) {

        $("followupNote")
            .value =
            followup.note
            ||
            "";

    }


    blueHeartSetSubmitLabel(
        "followupForm",
        "Save changes"
    );

}


/* =========================================================
   SAVE FOLLOW-UP
   Handles BOTH create and edit.
========================================================= */

async function saveFollowup(
    event
) {

    event.preventDefault();


    const studentId =
        $("followupStudentSelect")
            .value;


    const action =
        $("followupAction")
            .value
            .trim();


    if (
        !studentId
        ||
        !action
    ) {

        showToast(
            "Complete the follow-up details"
        );

        return;

    }


    /*
       =============================================
       EDIT EXISTING FOLLOW-UP
       =============================================
    */

    if (
        blueHeartEditingFollowupId
    ) {

        const followup =
            appData.followups.find(
                item =>
                    item.id ===
                    blueHeartEditingFollowupId
            );


        if (!followup) {

            showToast(
                "Follow-up could not be found"
            );

            blueHeartEditingFollowupId =
                "";

            return;

        }


        followup.studentId =
            studentId;

        followup.date =
            $("followupDate")
                .value
            ||
            todayString();

        followup.priority =
            $("followupPriority")
                .value;

        followup.period =
            $("followupPeriod")
                ?.value
            ||
            "";

        followup.action =
            action;

        followup.note =
            $("followupNote")
                .value
                .trim();

        followup.updatedAt =
            new Date()
                .toISOString();

        followup.backgroundReminderSyncedAt =
            "";

        followup.backgroundReminderError =
            "";


        await saveData();


        closeModal(
            "followupModal"
        );


        blueHeartEditingFollowupId =
            "";


        renderEverything();


        showToast(
            "Follow-up updated ✓"
        );


        /*
           Same follow-up ID is sent again.

           The backend therefore updates the
           reminder instead of creating a
           separate duplicate ID.
        */

        await syncFollowupReminder(
            followup
        );


        return;

    }


    /*
       =============================================
       CREATE NEW FOLLOW-UP
       =============================================
    */

    const followup = {

        id:
            makeId(),

        studentId:
            studentId,

        date:
            $("followupDate")
                .value
            ||
            todayString(),

        priority:
            $("followupPriority")
                .value,

        period:
            $("followupPeriod")
                ?.value
            ||
            "",

        action:
            action,

        note:
            $("followupNote")
                .value
                .trim(),

        completed:
            false,

        createdAt:
            new Date()
                .toISOString()

    };


    appData.followups.push(
        followup
    );


    await saveData();


    closeModal(
        "followupModal"
    );


    renderEverything();


    showToast(
        "Follow-up added"
    );


    await syncFollowupReminder(
        followup
    );

}


/* =========================================================
   DELETE FOLLOW-UP
========================================================= */

async function deleteFollowup(
    followupId
) {

    const followup =
        appData.followups.find(
            item =>
                item.id ===
                followupId
        );


    if (!followup) {

        showToast(
            "Follow-up not found"
        );

        return;

    }


    const student =
        getStudent(
            followup.studentId
        );


    const name =
        student?.name
        ||
        "this student";


    const confirmed =
        window.confirm(
            `Delete this follow-up for ${name}?\n\n`
            +
            `This removes it from Blue Heart and cancels its scheduled reminder.`
        );


    if (!confirmed) {
        return;
    }


    /*
       Try cancelling the remote reminder first.
    */

    const remoteCancelled =
        await deleteFollowupReminder(
            followup.id,
            {
                quiet: true
            }
        );


    appData.followups =
        appData.followups.filter(
            item =>
                item.id !==
                followup.id
        );


    await saveData();


    renderEverything();


    if (
        remoteCancelled
        ||
        !reminderApiConfigured()
    ) {

        showToast(
            "Follow-up deleted"
        );

    }

    else {

        showToast(
            "Deleted locally; reminder server could not be reached"
        );

    }

}


/* =========================================================
   V6.1 FOLLOW-UP CARD

   Replaces the old Done-only card.
========================================================= */

function followupCard(
    item
) {

    const student =
        getStudent(
            item.studentId
        );


    if (!student) {
        return "";
    }


    return `

        <div class="today-item">

            <div>

                <strong>

                    ${priorityIcon(
                        item.priority
                    )}

                    ${escapeHTML(
                        student.name
                    )}

                </strong>


                <p>

                    ${escapeHTML(
                        item.action
                        ||
                        ""
                    )}

                </p>


                <small class="muted">

                    ${
                        escapeHTML(
                            student.className
                            ||
                            ""
                        )
                    }

                    ${
                        item.date
                            ? " · "
                              +
                              prettyDate(
                                  item.date
                              )
                            : ""
                    }

                    ${
                        item.period
                            ? " · "
                              +
                              escapeHTML(
                                  formatFollowupPeriod(
                                      item.period
                                  )
                              )
                            : ""
                    }

                </small>


                ${
                    item.note

                        ? `

                            <p
                                class="muted preserve-lines"
                                style="
                                    margin-top:6px;
                                "
                            >

                                ${escapeHTML(
                                    item.note
                                )}

                            </p>

                          `

                        : ""
                }

            </div>


            <div
                style="
                    display:flex;
                    gap:6px;
                    flex-wrap:wrap;
                    justify-content:flex-end;
                    align-items:center;
                "
            >

                <button
                    class="secondary small"
                    data-edit-followup="${item.id}"
                    type="button"
                >
                    ✏️ Edit
                </button>


                <button
                    class="secondary small"
                    data-complete="${item.id}"
                    type="button"
                >
                    ✓ Done
                </button>


                <button
                    class="text-btn"
                    data-delete-followup="${item.id}"
                    type="button"
                >
                    🗑 Delete
                </button>

            </div>

        </div>

    `;

}


/* =========================================================
   WRAP NORMAL SESSION OPEN

   Normal session = clear edit mode.
========================================================= */

const blueHeartV61OriginalOpenSession =
    openSession;


openSession =
    function (
        studentId = ""
    ) {

        blueHeartEditingSessionId =
            "";

        blueHeartV61OriginalOpenSession(
            studentId
        );


        blueHeartSetSubmitLabel(
            "sessionForm",
            "Save session"
        );

    };


/* =========================================================
   OPEN SESSION FOR EDITING
========================================================= */

function openSessionForEdit(
    sessionId
) {

    const session =
        appData.sessions.find(
            item =>
                item.id ===
                sessionId
        );


    if (!session) {

        showToast(
            "Session not found"
        );

        return;

    }


    blueHeartEditingSessionId =
        session.id;


    blueHeartV61OriginalOpenSession(
        session.studentId
    );


    populateStudentSelects();


    if (
        $("sessionStudentSelect")
    ) {

        $("sessionStudentSelect")
            .value =
            session.studentId
            ||
            "";

    }


    if (
        $("sessionDate")
    ) {

        $("sessionDate")
            .value =
            session.date
            ||
            todayString();

    }


    if (
        $("sessionSummary")
    ) {

        $("sessionSummary")
            .value =
            session.summary
            ||
            "";

    }


    if (
        $("sessionNextAction")
    ) {

        $("sessionNextAction")
            .value =
            session.nextAction
            ||
            "";

    }


    blueHeartSetSubmitLabel(
        "sessionForm",
        "Save changes"
    );

}


/* =========================================================
   SAVE SESSION
   Handles create + edit.
========================================================= */

async function saveSession(
    event
) {

    event.preventDefault();


    const studentId =
        $("sessionStudentSelect")
            .value;


    if (!studentId) {

        showToast(
            "Choose a student"
        );

        return;

    }


    /*
       =============================================
       EDIT
       =============================================
    */

    if (
        blueHeartEditingSessionId
    ) {

        const session =
            appData.sessions.find(
                item =>
                    item.id ===
                    blueHeartEditingSessionId
            );


        if (!session) {

            showToast(
                "Session could not be found"
            );

            blueHeartEditingSessionId =
                "";

            return;

        }


        session.studentId =
            studentId;

        session.date =
            $("sessionDate")
                .value
            ||
            todayString();

        session.summary =
            $("sessionSummary")
                .value
                .trim();

        session.nextAction =
            $("sessionNextAction")
                .value
                .trim();

        session.updatedAt =
            new Date()
                .toISOString();


        await saveData();


        closeModal(
            "sessionModal"
        );


        blueHeartEditingSessionId =
            "";


        renderEverything();


        showToast(
            "Session updated ✓"
        );


        return;

    }


    /*
       =============================================
       CREATE
       =============================================
    */

    const session = {

        id:
            makeId(),

        studentId:
            studentId,

        date:
            $("sessionDate")
                .value
            ||
            todayString(),

        summary:
            $("sessionSummary")
                .value
                .trim(),

        nextAction:
            $("sessionNextAction")
                .value
                .trim(),

        createdAt:
            new Date()
                .toISOString()

    };


    appData.sessions.push(
        session
    );


    lastSessionStudentId =
        studentId;


    await saveData();


    closeModal(
        "sessionModal"
    );


    renderEverything();


    showFollowupPrompt(
        studentId
    );

}


/* =========================================================
   DELETE SESSION
========================================================= */

async function deleteSession(
    sessionId
) {

    const session =
        appData.sessions.find(
            item =>
                item.id ===
                sessionId
        );


    if (!session) {

        showToast(
            "Session not found"
        );

        return;

    }


    const confirmed =
        window.confirm(
            "Delete this session?\n\n"
            +
            "This cannot be undone unless you restore an older encrypted backup."
        );


    if (!confirmed) {
        return;
    }


    const studentId =
        session.studentId;


    appData.sessions =
        appData.sessions.filter(
            item =>
                item.id !==
                sessionId
        );


    await saveData();


    renderEverything();


    showToast(
        "Session deleted"
    );


    /*
       Reopen the student's detail page
       so Rose stays where she was.
    */

    if (
        getStudent(
            studentId
        )
    ) {

        openStudentDetails(
            studentId
        );

    }

}


/* =========================================================
   DELETE STUDENT

   Related sessions and follow-ups are also removed.
========================================================= */

async function deleteStudent(
    studentId
) {

    const student =
        getStudent(
            studentId
        );


    if (!student) {

        showToast(
            "Student not found"
        );

        return;

    }


    const sessions =
        appData.sessions.filter(
            item =>
                item.studentId ===
                studentId
        );


    const followups =
        appData.followups.filter(
            item =>
                item.studentId ===
                studentId
        );


    const notes =
        appData.quickNotes.filter(
            item =>
                item.studentId ===
                studentId
        );


    const warning =
        `Delete ${student.name} permanently?\n\n`
        +
        `This also removes:\n`
        +
        `• ${sessions.length} session(s)\n`
        +
        `• ${followups.length} follow-up(s)\n`
        +
        `• ${notes.length} attached quick note(s)\n\n`
        +
        `This action is intended for records entered by mistake.`;


    const confirmed =
        window.confirm(
            warning
        );


    if (!confirmed) {
        return;
    }


    /*
       Cancel every unfinished remote reminder.
    */

    for (
        const followup of followups
    ) {

        if (
            !followup.completed
        ) {

            await deleteFollowupReminder(
                followup.id,
                {
                    quiet: true
                }
            );

        }

    }


    appData.students =
        appData.students.filter(
            item =>
                item.id !==
                studentId
        );


    appData.sessions =
        appData.sessions.filter(
            item =>
                item.studentId !==
                studentId
        );


    appData.followups =
        appData.followups.filter(
            item =>
                item.studentId !==
                studentId
        );


    appData.quickNotes =
        appData.quickNotes.filter(
            item =>
                item.studentId !==
                studentId
        );


    await saveData();


    closeModal(
        "studentDetailModal"
    );


    renderEverything();


    showToast(
        "Student record deleted"
    );

}


/* =========================================================
   STUDENT DETAIL V6.1 ADDITIONS

   Keep original student-detail screen and append:
   - Delete student
   - Manage sessions
========================================================= */

const blueHeartV61OriginalOpenStudentDetails =
    openStudentDetails;


openStudentDetails =
    function (
        id
    ) {

        blueHeartV61OriginalOpenStudentDetails(
            id
        );


        const student =
            getStudent(
                id
            );


        const container =
            $("studentDetail");


        if (
            !student
            ||
            !container
        ) {

            return;

        }


        /*
           =============================================
           DELETE STUDENT BUTTON
           =============================================
        */

        const mainButtons =
            container.querySelector(
                ".button-row"
            );


        if (
            mainButtons
            &&
            !container.querySelector(
                "[data-delete-student]"
            )
        ) {

            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "text-btn";

            button.type =
                "button";

            button.dataset
                .deleteStudent =
                student.id;

            button.textContent =
                "🗑 Delete student";


            mainButtons.appendChild(
                button
            );

        }


        /*
           =============================================
           MANAGE SESSIONS
           =============================================
        */

        const sessions =
            appData.sessions

                .filter(
                    item =>
                        item.studentId ===
                        id
                )

                .sort(
                    (a, b) =>
                        b.date.localeCompare(
                            a.date
                        )
                );


        const section =
            document.createElement(
                "section"
            );


        section.className =
            "detail-block";

        section.id =
            "v61ManageSessions";


        section.innerHTML = `

            <p class="eyebrow">
                MANAGE SESSIONS
            </p>

            <h3>
                ✏️ Edit or remove sessions
            </h3>


            ${
                sessions.length

                    ? sessions

                        .map(
                            session => `

                                <div
                                    class="mini-record"
                                    style="
                                        margin-top:10px;
                                    "
                                >

                                    <strong>

                                        ${prettyDate(
                                            session.date
                                        )}

                                    </strong>


                                    <p
                                        class="preserve-lines"
                                    >

                                        ${escapeHTML(
                                            session.summary
                                            ||
                                            "No summary."
                                        )}

                                    </p>


                                    ${
                                        session.nextAction

                                            ? `

                                                <p class="muted">

                                                    Next:
                                                    ${escapeHTML(
                                                        session.nextAction
                                                    )}

                                                </p>

                                              `

                                            : ""
                                    }


                                    <div
                                        style="
                                            display:flex;
                                            gap:8px;
                                            flex-wrap:wrap;
                                            margin-top:8px;
                                        "
                                    >

                                        <button
                                            class="secondary small"
                                            data-edit-session="${session.id}"
                                            type="button"
                                        >
                                            ✏️ Edit
                                        </button>


                                        <button
                                            class="text-btn"
                                            data-delete-session="${session.id}"
                                            type="button"
                                        >
                                            🗑 Delete
                                        </button>

                                    </div>

                                </div>

                            `
                        )

                        .join("")

                    : `

                        <p class="muted">
                            No sessions logged yet.
                        </p>

                      `
            }

        `;


        container.appendChild(
            section
        );

    };


/* =========================================================
   V6.1 CLICK HANDLING
========================================================= */

document.addEventListener(
    "click",
    async event => {


        /*
           EDIT FOLLOW-UP
        */

        const editFollowup =
            event.target.closest(
                "[data-edit-followup]"
            );


        if (
            editFollowup
        ) {

            openFollowupForEdit(
                editFollowup
                    .dataset
                    .editFollowup
            );

            return;

        }


        /*
           DELETE FOLLOW-UP
        */

        const deleteFollowupButton =
            event.target.closest(
                "[data-delete-followup]"
            );


        if (
            deleteFollowupButton
        ) {

            await deleteFollowup(
                deleteFollowupButton
                    .dataset
                    .deleteFollowup
            );

            return;

        }


        /*
           EDIT SESSION
        */

        const editSessionButton =
            event.target.closest(
                "[data-edit-session]"
            );


        if (
            editSessionButton
        ) {

            closeModal(
                "studentDetailModal"
            );


            openSessionForEdit(
                editSessionButton
                    .dataset
                    .editSession
            );

            return;

        }


        /*
           DELETE SESSION
        */

        const deleteSessionButton =
            event.target.closest(
                "[data-delete-session]"
            );


        if (
            deleteSessionButton
        ) {

            await deleteSession(
                deleteSessionButton
                    .dataset
                    .deleteSession
            );

            return;

        }


        /*
           DELETE STUDENT
        */

        const deleteStudentButton =
            event.target.closest(
                "[data-delete-student]"
            );


        if (
            deleteStudentButton
        ) {

            await deleteStudent(
                deleteStudentButton
                    .dataset
                    .deleteStudent
            );

            return;

        }

    }
);


/* =========================================================
   END BLUE HEART V6.1 🩵
========================================================= */
/* =========================================================
   BLUE HEART V6.2 🩵
   STUDENT ABSENT → QUICK RESCHEDULE
========================================================= */


/* =========================================================
   DATE HELPERS
========================================================= */

function blueHeartLocalDateString(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );

    return `${year}-${month}-${day}`;

}


function blueHeartDayName(date) {

    return [

        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"

    ][
        date.getDay()
    ];

}


/* =========================================================
   FIND NEXT COUNSELLING SLOT
========================================================= */

function blueHeartNextAvailableSlot(
    studentClass,
    fromDate = new Date()
) {

    const availableSlots =
        getStudentCounsellingSlots(
            studentClass
        );


    if (
        !availableSlots.length
    ) {

        return null;

    }


    const periodOrder =
        Object.keys(
            BLUE_HEART_PERIODS
        );


    const start =
        new Date(

            fromDate.getFullYear(),

            fromDate.getMonth(),

            fromDate.getDate()

        );


    /*
       Start from tomorrow because
       "Absent" means the student is
       unavailable for the current day.
    */

    for (
        let offset = 1;
        offset <= 21;
        offset += 1
    ) {

        const candidate =
            new Date(
                start
            );


        candidate.setDate(
            start.getDate()
            +
            offset
        );


        const dayName =
            blueHeartDayName(
                candidate
            );


        if (
            !BLUE_HEART_SCHOOL_DAYS
                .includes(
                    dayName
                )
        ) {

            continue;

        }


        const matches =
            availableSlots

                .filter(
                    slot =>
                        slot.day ===
                        dayName
                )

                .sort(
                    (
                        a,
                        b
                    ) =>
                        periodOrder
                            .indexOf(
                                a.period
                            )
                        -
                        periodOrder
                            .indexOf(
                                b.period
                            )
                );


        if (
            matches.length
        ) {

            return {

                date:
                    blueHeartLocalDateString(
                        candidate
                    ),

                day:
                    dayName,

                period:
                    matches[0].period,

                time:
                    matches[0].time

            };

        }

    }


    return null;

}


/* =========================================================
   APPLY RESCHEDULE
========================================================= */

async function blueHeartRescheduleFollowup(
    followup,
    newDate,
    newPeriod,
    message
) {

    if (!followup) {

        showToast(
            "Follow-up not found"
        );

        return;

    }


    followup.date =
        newDate;


    followup.period =
        newPeriod
        ||
        "";


    followup.updatedAt =
        new Date()
            .toISOString();


    followup.backgroundReminderSyncedAt =
        "";


    followup.backgroundReminderError =
        "";


    /*
       Save locally first.
    */

    await saveData();


    renderEverything();


    /*
       Send the same follow-up ID
       back to the reminder service.
    */

    await syncFollowupReminder(

        followup,

        {
            quiet: true
        }

    );


    showToast(
        message
        ||
        "Follow-up rescheduled"
    );

}


/* =========================================================
   STUDENT ABSENT
========================================================= */

async function blueHeartHandleAbsent(
    followupId
) {

    const followup =
        appData.followups.find(
            item =>
                item.id ===
                followupId
        );


    if (!followup) {

        showToast(
            "Follow-up not found"
        );

        return;

    }


    const student =
        getStudent(
            followup.studentId
        );


    if (!student) {

        showToast(
            "Student record not found"
        );

        return;

    }


    const choice =
        window.prompt(

            `${student.name} is absent today.\n\n`
            +
            `Type:\n`
            +
            `1 = Next available counselling slot\n`
            +
            `2 = Tomorrow\n`
            +
            `3 = Choose another date\n\n`
            +
            `Enter 1, 2, or 3:`

        );


    if (
        choice === null
    ) {

        return;

    }


    const cleaned =
        choice.trim();


    /* =====================================================
       OPTION 1
       NEXT ACTUAL COUNSELLING SLOT
    ===================================================== */

    if (
        cleaned === "1"
    ) {

        const nextSlot =
            blueHeartNextAvailableSlot(

                student.className
                ||
                student.class
                ||
                "",

                new Date()

            );


        if (!nextSlot) {

            showToast(
                "No later counselling slot was found for this class"
            );

            return;

        }


        await blueHeartRescheduleFollowup(

            followup,

            nextSlot.date,

            nextSlot.period,

            `Rescheduled to ${nextSlot.day} · ${formatFollowupPeriod(
                nextSlot.period
            )}`

        );


        return;

    }


    /* =====================================================
       OPTION 2
       TOMORROW
    ===================================================== */

    if (
        cleaned === "2"
    ) {

        const tomorrow =
            new Date();


        tomorrow.setDate(
            tomorrow.getDate()
            +
            1
        );


        await blueHeartRescheduleFollowup(

            followup,

            blueHeartLocalDateString(
                tomorrow
            ),

            followup.period
            ||
            "",

            "Moved to tomorrow"

        );


        return;

    }


    /* =====================================================
       OPTION 3
       CUSTOM DATE
    ===================================================== */

    if (
        cleaned === "3"
    ) {

        const selected =
            window.prompt(

                "Enter the new date as YYYY-MM-DD:",

                followup.date
                ||
                blueHeartLocalDateString(
                    new Date()
                )

            );


        if (
            selected === null
        ) {

            return;

        }


        const trimmedDate =
            selected.trim();


        if (
            !/^\d{4}-\d{2}-\d{2}$/
                .test(
                    trimmedDate
                )
        ) {

            showToast(
                "Use date format YYYY-MM-DD"
            );

            return;

        }


        await blueHeartRescheduleFollowup(

            followup,

            trimmedDate,

            followup.period
            ||
            "",

            "Follow-up rescheduled"

        );


        return;

    }


    showToast(
        "Choose 1, 2, or 3"
    );

}


/* =========================================================
   V6.2 FOLLOW-UP CARD

   Adds the Absent button while preserving
   Edit / Done / Delete from V6.1.
========================================================= */

function followupCard(
    item
) {

    const student =
        getStudent(
            item.studentId
        );


    if (!student) {

        return "";

    }


    return `

        <div class="today-item">

            <div>

                <strong>

                    ${priorityIcon(
                        item.priority
                    )}

                    ${escapeHTML(
                        student.name
                    )}

                </strong>


                <p>

                    ${escapeHTML(
                        item.action
                        ||
                        ""
                    )}

                </p>


                <small class="muted">

                    ${escapeHTML(
                        student.className
                        ||
                        ""
                    )}

                    ${
                        item.date

                            ? " · "
                              +
                              prettyDate(
                                  item.date
                              )

                            : ""
                    }

                    ${
                        item.period

                            ? " · "
                              +
                              escapeHTML(
                                  formatFollowupPeriod(
                                      item.period
                                  )
                              )

                            : ""
                    }

                </small>


                ${
                    item.note

                        ? `

                            <p
                                class="muted preserve-lines"
                                style="margin-top:6px;"
                            >

                                ${escapeHTML(
                                    item.note
                                )}

                            </p>

                          `

                        : ""
                }

            </div>


            <div
                style="
                    display:flex;
                    gap:6px;
                    flex-wrap:wrap;
                    justify-content:flex-end;
                    align-items:center;
                "
            >

                <button
                    class="secondary small"
                    data-edit-followup="${item.id}"
                    type="button"
                >
                    ✏️ Edit
                </button>


                <button
                    class="secondary small"
                    data-absent-followup="${item.id}"
                    type="button"
                >
                    😷 Absent
                </button>


                <button
                    class="secondary small"
                    data-complete="${item.id}"
                    type="button"
                >
                    ✓ Done
                </button>


                <button
                    class="text-btn"
                    data-delete-followup="${item.id}"
                    type="button"
                >
                    🗑 Delete
                </button>

            </div>

        </div>

    `;

}


/* =========================================================
   ABSENT CLICK EVENT
========================================================= */

document.addEventListener(

    "click",

    async event => {


        const absentButton =
            event.target.closest(
                "[data-absent-followup]"
            );


        if (
            !absentButton
        ) {

            return;

        }


        event.preventDefault();

        event.stopPropagation();


        await blueHeartHandleAbsent(
            absentButton
                .dataset
                .absentFollowup
        );

    }

);


/* =========================================================
   END BLUE HEART V6.2 🩵
========================================================= */
/* =========================================================
   BLUE HEART V6.3 🩵
   FINISH WORKDAY

   Adds:
   - Automatic end-of-day summary
   - Finish workday button
   - Reopen workday
   - Tomorrow preview
   - No new manual checklist
========================================================= */


/* =========================================================
   WORKDAY DATA
========================================================= */

function blueHeartEnsureWorkdayData() {

    if (
        !appData.workdayClosures
        ||
        typeof appData.workdayClosures !== "object"
    ) {

        appData.workdayClosures = {};

    }

}


function blueHeartTodayClosed() {

    blueHeartEnsureWorkdayData();

    return Boolean(
        appData.workdayClosures[
            todayString()
        ]
    );

}


/* =========================================================
   TOMORROW DATE
========================================================= */

function blueHeartTomorrowString() {

    const tomorrow =
        new Date();

    tomorrow.setDate(
        tomorrow.getDate() + 1
    );


    /*
       Reuse the V6.2 helper when available.
    */

    if (
        typeof blueHeartLocalDateString ===
        "function"
    ) {

        return blueHeartLocalDateString(
            tomorrow
        );

    }


    const year =
        tomorrow.getFullYear();

    const month =
        String(
            tomorrow.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            tomorrow.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


/* =========================================================
   BUILD AUTOMATIC WORKDAY SUMMARY
========================================================= */

function blueHeartGetWorkdaySummary() {

    blueHeartEnsureWorkdayData();


    const today =
        todayString();


    const tomorrow =
        blueHeartTomorrowString();


    const groups =
        getFollowupGroups();


    const unfinishedToday = [

        ...groups.overdue,
        ...groups.today

    ];


    const urgent =
        unfinishedToday.filter(
            followup =>
                followup.priority ===
                "red"
        );


    const quickNotes =
        appData.quickNotes
            .filter(
                note =>
                    !note.done
            );


    const tomorrowFollowups =
        appData.followups

            .filter(
                followup =>
                    !followup.completed
                    &&
                    followup.date ===
                    tomorrow
            );


    const schoolLogged =
        Boolean(
            appData.schoolLog[
                today
            ]
        );


    const vitaminB =
        Boolean(
            appData.personal
                ?.vitaminB
        );


    const magnesium =
        Boolean(
            appData.personal
                ?.magnesium
        );


    return {

        today,
        tomorrow,

        schoolLogged,

        unfinishedToday,
        urgent,

        quickNotes,

        tomorrowFollowups,

        vitaminB,

        magnesium,

        closed:
            blueHeartTodayClosed()

    };

}


/* =========================================================
   STATUS ROW
========================================================= */

function blueHeartWorkdayRow(
    okay,
    text,
    detail = ""
) {

    return `

        <div
            style="
                display:flex;
                gap:10px;
                align-items:flex-start;
                padding:9px 0;
                border-bottom:
                    1px solid
                    rgba(0,0,0,.05);
            "
        >

            <span
                style="
                    min-width:22px;
                "
            >

                ${okay ? "✓" : "○"}

            </span>


            <div>

                <strong>

                    ${escapeHTML(
                        text
                    )}

                </strong>


                ${
                    detail

                        ? `

                            <small
                                class="muted"
                                style="
                                    display:block;
                                    margin-top:2px;
                                "
                            >

                                ${escapeHTML(
                                    detail
                                )}

                            </small>

                          `

                        : ""
                }

            </div>

        </div>

    `;

}


/* =========================================================
   ENSURE WORKDAY CARD EXISTS
========================================================= */

function blueHeartEnsureWorkdayCard() {

    if (
        $("blueHeartWorkdayCard")
    ) {

        return;

    }


    const todayView =
        $("view-today");


    if (!todayView) {

        return;

    }


    const card =
        document.createElement(
            "section"
        );


    card.id =
        "blueHeartWorkdayCard";

    card.className =
        "card";

    card.style.marginBottom =
        "14px";


    /*
       Put it near the personal Rose message
       when that card exists.
    */

    const roseCard =
        $("roseMessageCard");


    if (
        roseCard
        &&
        roseCard.parentElement
    ) {

        roseCard.insertAdjacentElement(
            "afterend",
            card
        );

    }

    else {

        todayView.prepend(
            card
        );

    }

}


/* =========================================================
   RENDER FINISH WORKDAY CARD
========================================================= */

function blueHeartRenderWorkdayCard() {

    blueHeartEnsureWorkdayCard();


    const card =
        $("blueHeartWorkdayCard");


    if (!card) {

        return;

    }


    const summary =
        blueHeartGetWorkdaySummary();


    /* =====================================================
       WORKDAY ALREADY CLOSED
    ===================================================== */

    if (
        summary.closed
    ) {

        const closedRecord =
            appData.workdayClosures[
                summary.today
            ];


        card.innerHTML = `

            <div class="section-head">

                <div>

                    <p class="eyebrow">
                        WORKDAY
                    </p>

                    <h3>
                        🌙 Workday finished
                    </h3>

                </div>

                <span class="pill done">
                    Closed ✓
                </span>

            </div>


            <p
                class="muted"
                style="
                    margin-top:8px;
                "
            >

                You've closed today's work.
                Anything unfinished can wait
                here safely until you return.

            </p>


            <div
                style="
                    margin-top:14px;
                    padding:12px;
                    border-radius:14px;
                    background:
                        rgba(255,255,255,.65);
                "
            >

                <strong>
                    Tomorrow
                </strong>


                <p
                    class="muted"
                    style="
                        margin-top:5px;
                    "
                >

                    ${
                        summary.tomorrowFollowups
                            .length
                    }
                    follow-up${
                        summary.tomorrowFollowups
                            .length === 1
                            ? ""
                            : "s"
                    }
                    scheduled.

                </p>

            </div>


            <p
                class="muted"
                style="
                    margin-top:12px;
                "
            >

                🩵 You do not need to keep
                today's list in your head now.

            </p>


            <button
                class="secondary full"
                data-reopen-workday
                type="button"
                style="
                    margin-top:12px;
                "
            >

                Reopen today

            </button>

        `;


        return;

    }


    /* =====================================================
       OPEN WORKDAY
    ===================================================== */

    const followupOkay =
        summary.unfinishedToday
            .length === 0;


    const urgentOkay =
        summary.urgent
            .length === 0;


    const quickOkay =
        summary.quickNotes
            .length === 0;


    card.innerHTML = `

        <div class="section-head">

            <div>

                <p class="eyebrow">
                    END OF DAY
                </p>

                <h3>
                    🌙 Finish workday
                </h3>

            </div>

        </div>


        <p
            class="muted"
            style="
                margin-top:6px;
                margin-bottom:8px;
            "
        >

            Blue Heart checked today's
            loose ends for you.

        </p>


        ${blueHeartWorkdayRow(

            summary.schoolLogged,

            summary.schoolLogged
                ? "School app logged"
                : "School app not logged yet"

        )}


        ${blueHeartWorkdayRow(

            urgentOkay,

            urgentOkay
                ? "No urgent follow-ups waiting"
                : `${summary.urgent.length} urgent follow-up${
                    summary.urgent.length === 1
                        ? ""
                        : "s"
                  } waiting`

        )}


        ${blueHeartWorkdayRow(

            followupOkay,

            followupOkay
                ? "Today's follow-ups are clear"
                : `${summary.unfinishedToday.length} follow-up${
                    summary.unfinishedToday.length === 1
                        ? ""
                        : "s"
                  } still open`,

            summary.unfinishedToday.length
                ? "They stay safely in Blue Heart."
                : ""

        )}


        ${blueHeartWorkdayRow(

            quickOkay,

            quickOkay
                ? "Quick Capture is clear"
                : `${summary.quickNotes.length} quick note${
                    summary.quickNotes.length === 1
                        ? ""
                        : "s"
                  } still waiting`,

            summary.quickNotes.length
                ? "You can finish or review them tomorrow."
                : ""

        )}


        <div
            style="
                margin-top:14px;
                padding:12px;
                border-radius:14px;
                background:
                    rgba(255,255,255,.62);
            "
        >

            <p class="eyebrow">
                TOMORROW
            </p>


            <strong>

                ${
                    summary.tomorrowFollowups
                        .length
                }

                follow-up${
                    summary.tomorrowFollowups
                        .length === 1
                        ? ""
                        : "s"
                }

            </strong>


            <p
                class="muted"
                style="
                    margin-top:4px;
                "
            >

                already scheduled

            </p>

        </div>


        <div
            style="
                margin-top:14px;
                padding:12px;
                border-radius:14px;
                background:
                    rgba(255,255,255,.50);
            "
        >

            <p class="eyebrow">
                PERSONAL
            </p>


            <p
                style="
                    margin-top:5px;
                "
            >

                ${
                    summary.vitaminB
                        ? "✓"
                        : "○"
                }
                Vitamin B

                &nbsp;&nbsp;

                ${
                    summary.magnesium
                        ? "✓"
                        : "○"
                }
                Magnesium

            </p>

        </div>


        <button
            class="primary full"
            data-finish-workday
            type="button"
            style="
                margin-top:14px;
            "
        >

            Finish for today 🩵

        </button>

    `;

}


/* =========================================================
   FINISH WORKDAY
========================================================= */

async function blueHeartFinishWorkday() {

    blueHeartEnsureWorkdayData();


    const summary =
        blueHeartGetWorkdaySummary();


    /*
       If something is still open,
       we do NOT block Rose.

       We simply make sure she knows
       the items are still waiting.
    */

    if (
        summary.unfinishedToday.length
        ||
        summary.quickNotes.length
        ||
        !summary.schoolLogged
    ) {

        const confirmed =
            window.confirm(

                "There are still a few things open.\n\n"
                +
                "Blue Heart will keep them safely for tomorrow.\n\n"
                +
                "Finish workday anyway?"

            );


        if (!confirmed) {

            return;

        }

    }


    appData.workdayClosures[
        todayString()
    ] = {

        closedAt:
            new Date()
                .toISOString()

    };


    await saveData();


    renderEverything();


    showToast(
        "Workday finished 🩵"
    );

}


/* =========================================================
   REOPEN WORKDAY
========================================================= */

async function blueHeartReopenWorkday() {

    blueHeartEnsureWorkdayData();


    delete appData.workdayClosures[
        todayString()
    ];


    await saveData();


    renderEverything();


    showToast(
        "Today reopened"
    );

}


/* =========================================================
   ADD V6.3 TO NORMAL RENDERING

   Preserve the current Blue Heart renderer,
   then add the new workday card afterwards.
========================================================= */

const blueHeartV63OriginalRenderEverything =
    renderEverything;


renderEverything =
    function () {

        blueHeartV63OriginalRenderEverything();


        if (!currentPin) {

            return;

        }


        blueHeartRenderWorkdayCard();

    };


/* =========================================================
   V6.3 EVENTS
========================================================= */

document.addEventListener(

    "click",

    async event => {


        const finishButton =
            event.target.closest(
                "[data-finish-workday]"
            );


        if (
            finishButton
        ) {

            event.preventDefault();

            await blueHeartFinishWorkday();

            return;

        }


        const reopenButton =
            event.target.closest(
                "[data-reopen-workday]"
            );


        if (
            reopenButton
        ) {

            event.preventDefault();

            await blueHeartReopenWorkday();

        }

    }

);


/* =========================================================
   RENDER ONCE IF APP IS ALREADY OPEN

   Normally renderEverything() handles this.
========================================================= */

if (
    typeof currentPin !== "undefined"
    &&
    currentPin
) {

    blueHeartRenderWorkdayCard();

}


/* =========================================================
   END BLUE HEART V6.3 🩵
========================================================= */
/* =========================================================
   BLUE HEART — FINAL PERSONAL MESSAGES 🩵
========================================================= */

if (
    typeof BLUE_HEART_ROSE_MESSAGES !==
    "undefined"
) {

    BLUE_HEART_ROSE_MESSAGES.push(

        "You have come so far 🩵",

        "Stars shy at the sight of your brightness ✨",

        "Let's go and live in a paradise 🌷",

        "Movie date after work? 🎬🩵",

        "I love you baby, keep going 🩵"

    );

}


/* =========================================================
   END BLUE HEART FINAL POLISH 🩵
========================================================= */
