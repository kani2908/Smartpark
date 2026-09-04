// =========================================================
// SMARTPARK AI
// USER DASHBOARD FLOATING ASSISTANT
// =========================================================

import {
    auth,
    db
} from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";


// =========================================================
// DOM
// =========================================================

const launcher =
    document.getElementById(
        "smartparkAiLauncher"
    );

const panel =
    document.getElementById(
        "smartparkAiPanel"
    );

const closeBtn =
    document.getElementById(
        "smartparkAiClose"
    );

const messages =
    document.getElementById(
        "smartparkAiMessages"
    );

const input =
    document.getElementById(
        "smartparkAiInput"
    );

const sendBtn =
    document.getElementById(
        "smartparkAiSend"
    );

const quickButtons =
    document.querySelectorAll(
        ".smartpark-ai-quick-btn"
    );


// =========================================================
// CURRENT USER
// =========================================================

let currentUser = null;


// =========================================================
// OPEN ASSISTANT
// =========================================================

if (launcher) {

    launcher.addEventListener(
        "click",
        () => {

            panel.classList.add(
                "open"
            );

            panel.setAttribute(
                "aria-hidden",
                "false"
            );

            setTimeout(
                () => input?.focus(),
                100
            );

        }
    );

}


// =========================================================
// CLOSE ASSISTANT
// =========================================================

if (closeBtn) {

    closeBtn.addEventListener(
        "click",
        () => {

            panel.classList.remove(
                "open"
            );

            panel.setAttribute(
                "aria-hidden",
                "true"
            );

        }
    );

}


// =========================================================
// AUTHENTICATION
// =========================================================

onAuthStateChanged(
    auth,
    (user) => {

        currentUser = user;

        if (user) {

            console.log(
                "🤖 SmartPark AI connected to user:",
                user.uid
            );

        }

    }
);


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHtml(value) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        String(value ?? "");

    return div.innerHTML;

}


// =========================================================
// ADD USER MESSAGE
// =========================================================

function addUserMessage(
    text
) {

    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.className =
        "smartpark-ai-message user";

    wrapper.innerHTML = `

        <div class="smartpark-message-icon">

            <i class="fa-solid fa-user"></i>

        </div>

        <div class="smartpark-message-content">

            <strong>
                You
            </strong>

            <p>
                ${escapeHtml(text)}
            </p>

        </div>

    `;

    messages.appendChild(
        wrapper
    );

    scrollMessages();

}


// =========================================================
// ADD AI MESSAGE
// =========================================================

function addAiMessage(
    html
) {

    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.className =
        "smartpark-ai-message bot";

    wrapper.innerHTML = `

        <div class="smartpark-message-icon">

            <i class="fa-solid fa-robot"></i>

        </div>

        <div class="smartpark-message-content">

            <strong>
                SmartPark AI
            </strong>

            ${html}

        </div>

    `;

    messages.appendChild(
        wrapper
    );

    scrollMessages();

}


// =========================================================
// SCROLL
// =========================================================

function scrollMessages() {

    messages.scrollTop =
        messages.scrollHeight;

}


// =========================================================
// LOADING
// =========================================================

function showLoading() {

    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.id =
        "smartparkAiLoading";

    wrapper.className =
        "smartpark-ai-message bot";

    wrapper.innerHTML = `

        <div class="smartpark-message-icon">

            <i class="fa-solid fa-robot"></i>

        </div>

        <div class="smartpark-message-content">

            <strong>
                SmartPark AI
            </strong>

            <p>
                Thinking... ⏳
            </p>

        </div>

    `;

    messages.appendChild(
        wrapper
    );

    scrollMessages();

}


function removeLoading() {

    document
        .getElementById(
            "smartparkAiLoading"
        )
        ?.remove();

}


// =========================================================
// GET PARKING SLOTS
// =========================================================

async function getSlots() {

    const snapshot =
        await getDocs(
            collection(
                db,
                "slots"
            )
        );

    const slots = [];

    snapshot.forEach(
        (doc) => {

            slots.push({

                id: doc.id,

                ...doc.data()

            });

        }
    );

    return slots;

}


// =========================================================
// AVAILABLE SLOTS
// =========================================================

async function getAvailableSlots() {

    const slots =
        await getSlots();

    return slots.filter(
        (slot) =>
            String(
                slot.status || ""
            ).toLowerCase() ===
            "available"
    );

}


// =========================================================
// USER BOOKINGS
// =========================================================

async function getUserBookings() {

    if (!currentUser) {

        return [];

    }

    const bookingQuery =
        query(

            collection(
                db,
                "bookings"
            ),

            where(
                "userId",
                "==",
                currentUser.uid
            )

        );

    const snapshot =
        await getDocs(
            bookingQuery
        );

    const bookings = [];

    snapshot.forEach(
        (doc) => {

            bookings.push({

                id: doc.id,

                ...doc.data()

            });

        }
    );

    return bookings;

}


// =========================================================
// ACTIVE BOOKING
// =========================================================

async function getActiveBooking() {

    if (!currentUser) {

        return [];

    }

    const bookingQuery =
        query(

            collection(
                db,
                "bookings"
            ),

            where(
                "userId",
                "==",
                currentUser.uid
            ),

            where(
                "status",
                "==",
                "active"
            )

        );

    const snapshot =
        await getDocs(
            bookingQuery
        );

    const bookings = [];

    snapshot.forEach(
        (doc) => {

            bookings.push({

                id: doc.id,

                ...doc.data()

            });

        }
    );

    return bookings;

}


// =========================================================
// USER VEHICLES
// =========================================================

async function getUserVehicles() {

    if (!currentUser) {

        return [];

    }

    const vehicleQuery =
        query(

            collection(
                db,
                "vehicles"
            ),

            where(
                "userId",
                "==",
                currentUser.uid
            )

        );

    const snapshot =
        await getDocs(
            vehicleQuery
        );

    const vehicles = [];

    snapshot.forEach(
        (doc) => {

            vehicles.push({

                id: doc.id,

                ...doc.data()

            });

        }
    );

    return vehicles;

}


// =========================================================
// FORMAT AVAILABLE SLOTS
// =========================================================

function formatAvailableSlots(
    slots
) {

    if (!slots.length) {

        return `

            <p>
                🅿️ There are currently
                <strong>no available parking slots</strong>.
            </p>

        `;

    }

    return `

        <p>
            🅿️ I found
            <strong>
                ${slots.length}
            </strong>
            available parking slot(s).
        </p>

        <div class="smartpark-ai-result">

            ${slots.map(
                (slot) => `

                <div
                    class="smartpark-ai-result-row"
                >

                    <span>
                        Parking Slot
                    </span>

                    <strong>
                        ${escapeHtml(
                            slot.slotNumber ||
                            slot.id
                        )}
                    </strong>

                </div>

            `
            ).join("")}

        </div>

    `;

}


// =========================================================
// FORMAT BOOKING
// =========================================================

function formatBooking(
    bookings
) {

    if (!bookings.length) {

        return `

            <p>
                📅 You don't have an
                active parking booking.
            </p>

            <p>
                You can book a parking slot
                from the Parking Slots section.
            </p>

        `;

    }

    return `

        <p>
            📅 You have
            <strong>
                ${bookings.length}
            </strong>
            active booking(s).
        </p>

        <div class="smartpark-ai-result">

            ${bookings.map(
                (booking) => `

                <div
                    class="smartpark-ai-result-row"
                >

                    <span>
                        Slot
                    </span>

                    <strong>
                        ${escapeHtml(
                            booking.slotNumber ||
                            "-"
                        )}
                    </strong>

                </div>

                <div
                    class="smartpark-ai-result-row"
                >

                    <span>
                        Vehicle
                    </span>

                    <strong>
                        ${escapeHtml(
                            booking.vehicleNumber ||
                            "-"
                        )}
                    </strong>

                </div>

                <div
                    class="smartpark-ai-result-row"
                >

                    <span>
                        Status
                    </span>

                    <strong>
                        ${escapeHtml(
                            booking.status ||
                            "-"
                        )}
                    </strong>

                </div>

            `
            ).join("")}

        </div>

    `;

}


// =========================================================
// FORMAT VEHICLES
// =========================================================

function formatVehicles(
    vehicles
) {

    if (!vehicles.length) {

        return `

            <p>
                🚗 You don't have any
                registered vehicles.
            </p>

        `;

    }

    return `

        <p>
            🚗 You have
            <strong>
                ${vehicles.length}
            </strong>
            registered vehicle(s).
        </p>

        <div class="smartpark-ai-result">

            ${vehicles.map(
                (vehicle) => `

                <div
                    class="smartpark-ai-result-row"
                >

                    <span>
                        Vehicle
                    </span>

                    <strong>
                        ${escapeHtml(
                            vehicle.vehicleNumber ||
                            "-"
                        )}
                    </strong>

                </div>

            `
            ).join("")}

        </div>

    `;

}


// =========================================================
// BOOKING HISTORY
// =========================================================

function formatBookingHistory(
    bookings
) {

    if (!bookings.length) {

        return `

            <p>
                📜 You don't have any
                booking history yet.
            </p>

        `;

    }

    return `

        <p>
            📜 You have
            <strong>
                ${bookings.length}
            </strong>
            booking record(s).
        </p>

        <div class="smartpark-ai-result">

            ${bookings.map(
                (booking) => `

                <div
                    class="smartpark-ai-result-row"
                >

                    <span>
                        Slot
                    </span>

                    <strong>
                        ${escapeHtml(
                            booking.slotNumber ||
                            "-"
                        )}
                    </strong>

                </div>

                <div
                    class="smartpark-ai-result-row"
                >

                    <span>
                        Status
                    </span>

                    <strong>
                        ${escapeHtml(
                            booking.status ||
                            "-"
                        )}
                    </strong>

                </div>

            `
            ).join("")}

        </div>

    `;

}


// =========================================================
// PROCESS QUESTION
// =========================================================

async function processQuestion(
    question
) {

    const text =
        question
            .toLowerCase()
            .trim();


    // -----------------------------------------------------
    // GREETING
    // -----------------------------------------------------

    if (
        text === "hi" ||
        text === "hello" ||
        text === "hey" ||
        text.includes("good morning") ||
        text.includes("good evening")
    ) {

        return `

            <p>
                👋 Hello!
            </p>

            <p>
                I'm your
                <strong>
                    SmartPark AI Assistant
                </strong>.
            </p>

            <p>
                I can help you with your
                parking, bookings and vehicles.
            </p>

        `;

    }


    // -----------------------------------------------------
    // HELP
    // -----------------------------------------------------

    if (
        text.includes("help") ||
        text.includes("what can you do")
    ) {

        return `

            <p>
                🤖 I can help you with:
            </p>

            <div class="smartpark-ai-result">

                <div class="smartpark-ai-result-row">
                    <span>🅿️ Parking</span>
                    <strong>Available slots</strong>
                </div>

                <div class="smartpark-ai-result-row">
                    <span>📅 Booking</span>
                    <strong>Your active booking</strong>
                </div>

                <div class="smartpark-ai-result-row">
                    <span>🚗 Vehicles</span>
                    <strong>Your registered vehicles</strong>
                </div>

                <div class="smartpark-ai-result-row">
                    <span>📜 History</span>
                    <strong>Your previous bookings</strong>
                </div>

            </div>

        `;

    }


    // -----------------------------------------------------
    // AVAILABLE SLOTS
    // -----------------------------------------------------

    if (
        (
            text.includes("available") ||
            text.includes("free")
        )
        &&
        (
            text.includes("slot") ||
            text.includes("parking")
        )
    ) {

        const slots =
            await getAvailableSlots();

        return formatAvailableSlots(
            slots
        );

    }


    // -----------------------------------------------------
    // ACTIVE BOOKING
    // -----------------------------------------------------

    if (
        text.includes("active booking") ||
        text.includes("current booking") ||
        text.includes("my booking")
    ) {

        const bookings =
            await getActiveBooking();

        return formatBooking(
            bookings
        );

    }


    // -----------------------------------------------------
    // BOOKING HISTORY
    // -----------------------------------------------------

    if (
        text.includes("booking history") ||
        text.includes("past booking") ||
        text.includes("previous booking")
    ) {

        const bookings =
            await getUserBookings();

        return formatBookingHistory(
            bookings
        );

    }


    // -----------------------------------------------------
    // MY VEHICLES
    // -----------------------------------------------------

    if (
        text.includes("my vehicle") ||
        text.includes("my vehicles") ||
        text.includes("registered vehicle")
    ) {

        const vehicles =
            await getUserVehicles();

        return formatVehicles(
            vehicles
        );

    }


    // -----------------------------------------------------
    // VEHICLE REGISTRATION
    // -----------------------------------------------------

    if (
        text.includes("is my vehicle registered") ||
        text.includes("vehicle registered")
    ) {

        const vehicles =
            await getUserVehicles();

        if (!vehicles.length) {

            return `

                <p>
                    ❌ You don't currently have
                    a registered vehicle.
                </p>

            `;

        }

        return `

            <p>
                ✅ Yes. You have
                <strong>
                    ${vehicles.length}
                </strong>
                registered vehicle(s).
            </p>

            <p>
                You can ask me
                <strong>
                    "Show my vehicles"
                </strong>
                to see them.
            </p>

        `;

    }


    // -----------------------------------------------------
    // DEFAULT
    // -----------------------------------------------------

    return `

        <p>
            🤔 I'm not sure what you mean yet.
        </p>

        <p>
            Try asking:
        </p>

        <div class="smartpark-ai-result">

            <div class="smartpark-ai-result-row">
                <span>🅿️</span>
                <strong>
                    Are there any free slots?
                </strong>
            </div>

            <div class="smartpark-ai-result-row">
                <span>📅</span>
                <strong>
                    What is my active booking?
                </strong>
            </div>

            <div class="smartpark-ai-result-row">
                <span>🚗</span>
                <strong>
                    Show my vehicles
                </strong>
            </div>

            <div class="smartpark-ai-result-row">
                <span>📜</span>
                <strong>
                    Show my booking history
                </strong>
            </div>

        </div>

    `;

}


// =========================================================
// SEND QUESTION
// =========================================================

async function sendQuestion() {

    const question =
        input?.value.trim();


    if (!question) {

        return;

    }


    addUserMessage(
        question
    );


    input.value = "";


    sendBtn.disabled = true;

    input.disabled = true;


    showLoading();


    try {

        const response =
            await processQuestion(
                question
            );

        removeLoading();

        addAiMessage(
            response
        );

    }
    catch (error) {

        console.error(
            "❌ SmartPark AI error:",
            error
        );

        removeLoading();

        addAiMessage(`

            <p>
                ❌ Sorry, I couldn't access
                your SmartPark information.
            </p>

            <p>
                Please try again.
            </p>

        `);

    }


    sendBtn.disabled = false;

    input.disabled = false;

    input.focus();

}


// =========================================================
// SEND BUTTON
// =========================================================

if (sendBtn) {

    sendBtn.addEventListener(
        "click",
        sendQuestion
    );

}


// =========================================================
// ENTER KEY
// =========================================================

if (input) {

    input.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                sendQuestion();

            }

        }
    );

}


// =========================================================
// QUICK ACTIONS
// =========================================================

quickButtons.forEach(
    (button) => {

        button.addEventListener(
            "click",
            () => {

                const question =
                    button.dataset.question;

                if (!question) {

                    return;

                }

                input.value =
                    question;

                sendQuestion();

            }
        );

    }
);


// =========================================================
// READY
// =========================================================

console.log(
    "🤖 SmartPark User AI Assistant ready."
);