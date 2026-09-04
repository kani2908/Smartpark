// ============================================================
// SMARTPARK AI ASSISTANT
// Accurate Firebase-powered parking assistant
// ============================================================

import { db, auth } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


// ============================================================
// DOM ELEMENTS
// ============================================================

const chatMessages =
    document.getElementById("chatMessages");

const aiInput =
    document.getElementById("aiInput");

const sendAiBtn =
    document.getElementById("sendAiBtn");

const quickButtons =
    document.querySelectorAll(".quick-btn");


// ============================================================
// DATA CACHE
// ============================================================

let parkingSlots = [];
let bookings = [];
let vehicles = [];
let entryLogs = [];


// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {

    console.log("🤖 SmartPark AI Assistant initialized.");

    setupEventListeners();

    await loadParkingData();

});


// ============================================================
// EVENT LISTENERS
// ============================================================

function setupEventListeners() {

    if (sendAiBtn) {

        sendAiBtn.addEventListener(
            "click",
            sendMessage
        );

    }


    if (aiInput) {

        aiInput.addEventListener(
            "keydown",
            event => {

                if (event.key === "Enter") {

                    event.preventDefault();

                    sendMessage();

                }

            }
        );

    }


    quickButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const question =
                    button.dataset.question;

                if (question) {

                    processUserMessage(question);

                }

            }
        );

    });

}


// ============================================================
// SEND MESSAGE
// ============================================================

async function sendMessage() {

    if (!aiInput) return;

    const message =
        aiInput.value.trim();

    if (!message) return;

    aiInput.value = "";

    await processUserMessage(message);

}


// ============================================================
// PROCESS MESSAGE
// ============================================================

async function processUserMessage(message) {

    addUserMessage(message);

    const loading =
        addLoadingMessage();

    try {

        // Refresh Firebase data before EVERY question.
        // This prevents stale answers.

        await loadParkingData(false);

        const response =
            await generateAIResponse(message);

        removeMessage(loading);

        addAIMessage(response);

    }

    catch (error) {

        console.error(
            "❌ AI Assistant Error:",
            error
        );

        removeMessage(loading);

        addAIMessage(`
            <div class="response-block error-response">

                <h4>⚠️ Unable to retrieve data</h4>

                <p>
                    I couldn't access the SmartPark
                    parking data right now.
                </p>

                <small>
                    ${escapeHTML(error.message)}
                </small>

            </div>
        `);

    }

}


// ============================================================
// LOAD FIREBASE DATA
// ============================================================

async function loadParkingData(showError = true) {

    try {

        console.log(
            "🔄 Loading latest SmartPark data..."
        );


        // ----------------------------------------------------
        // SLOTS
        // ----------------------------------------------------

        const slotsSnapshot =
            await getDocs(
                collection(db, "slots")
            );

        parkingSlots = [];

        slotsSnapshot.forEach(slotDoc => {

            parkingSlots.push({

                id: slotDoc.id,

                ...slotDoc.data()

            });

        });


        // ----------------------------------------------------
        // BOOKINGS
        // ----------------------------------------------------

        const bookingsSnapshot =
            await getDocs(
                collection(db, "bookings")
            );

        bookings = [];

        bookingsSnapshot.forEach(bookingDoc => {

            bookings.push({

                id: bookingDoc.id,

                ...bookingDoc.data()

            });

        });


        // ----------------------------------------------------
        // VEHICLES
        // ----------------------------------------------------

        const vehiclesSnapshot =
            await getDocs(
                collection(db, "vehicles")
            );

        vehicles = [];

        vehiclesSnapshot.forEach(vehicleDoc => {

            vehicles.push({

                id: vehicleDoc.id,

                ...vehicleDoc.data()

            });

        });


        // ----------------------------------------------------
        // ENTRY LOGS
        // ----------------------------------------------------

        const entrySnapshot =
            await getDocs(
                collection(db, "entryLogs")
            );

        entryLogs = [];

        entrySnapshot.forEach(entryDoc => {

            entryLogs.push({

                id: entryDoc.id,

                ...entryDoc.data()

            });

        });


        console.log(
            "✅ SmartPark data loaded:",
            {
                slots: parkingSlots.length,
                bookings: bookings.length,
                vehicles: vehicles.length,
                entryLogs: entryLogs.length
            }
        );


        return true;

    }

    catch (error) {

        console.error(
            "❌ Firebase loading error:",
            error
        );

        if (showError) {

            addAIMessage(`
                <div class="response-block error-response">

                    <h4>❌ Database Error</h4>

                    <p>
                        SmartPark AI could not connect
                        to the parking database.
                    </p>

                </div>
            `);

        }

        throw error;

    }

}


// ============================================================
// NORMALIZE STATUS
// ============================================================

function normalizeStatus(value) {

    return String(
        value || ""
    )
        .trim()
        .toLowerCase();

}


// ============================================================
// NORMALIZE SLOT NUMBER
// ============================================================

function normalizeSlot(value) {

    return String(
        value || ""
    )
        .trim()
        .toUpperCase();

}


// ============================================================
// GET ACTIVE BOOKING FOR SLOT
// ============================================================

function getActiveBookingForSlot(slot) {

    const slotNumber =
        normalizeSlot(
            slot.slotNumber
        );

    const slotId =
        String(slot.id || "").trim();


    return bookings.find(booking => {

        const status =
            normalizeStatus(
                booking.status
            );

        if (status !== "active") {
            return false;
        }


        const bookingSlot =
            normalizeSlot(
                booking.slotNumber
            );

        const bookingSlotId =
            String(
                booking.slotId || ""
            ).trim();


        return (
            bookingSlot === slotNumber ||
            bookingSlotId === slotId
        );

    });

}


// ============================================================
// GET RESERVED BOOKING FOR SLOT
// ============================================================

function getReservedBookingForSlot(slot) {

    const slotNumber =
        normalizeSlot(
            slot.slotNumber
        );

    const slotId =
        String(slot.id || "").trim();


    return bookings.find(booking => {

        const status =
            normalizeStatus(
                booking.status
            );

        if (status !== "reserved") {
            return false;
        }


        const bookingSlot =
            normalizeSlot(
                booking.slotNumber
            );

        const bookingSlotId =
            String(
                booking.slotId || ""
            ).trim();


        return (
            bookingSlot === slotNumber ||
            bookingSlotId === slotId
        );

    });

}


// ============================================================
// GET REAL SLOT STATUS
// ============================================================

function getSlotStatus(slot) {

    if (!slot) {
        return "unknown";
    }


    const firestoreStatus =
        normalizeStatus(
            slot.status
        );


    // --------------------------------------------------------
    // MAINTENANCE ALWAYS WINS
    // --------------------------------------------------------

    if (
        firestoreStatus === "maintenance" ||
        firestoreStatus === "under maintenance"
    ) {

        return "maintenance";

    }


    // --------------------------------------------------------
    // ACTIVE BOOKING = OCCUPIED
    // --------------------------------------------------------

    const activeBooking =
        getActiveBookingForSlot(slot);

    if (activeBooking) {

        return "occupied";

    }


    // --------------------------------------------------------
    // RESERVED BOOKING = RESERVED
    // --------------------------------------------------------

    const reservedBooking =
        getReservedBookingForSlot(slot);

    if (reservedBooking) {

        return "reserved";

    }


    // --------------------------------------------------------
    // USE FIRESTORE SLOT STATUS
    // --------------------------------------------------------

    if (
        [
            "available",
            "vacant",
            "free"
        ].includes(
            firestoreStatus
        )
    ) {

        return "available";

    }


    if (
        firestoreStatus === "occupied"
    ) {

        return "occupied";

    }


    if (
        firestoreStatus === "reserved"
    ) {

        return "reserved";

    }


    // If status is missing, treat it as available
    // because this is how new slots are created.

    return "available";

}


// ============================================================
// GET AVAILABLE SLOTS
// ============================================================

function getAvailableSlotObjects() {

    return parkingSlots.filter(
        slot =>
            getSlotStatus(slot) === "available"
    );

}


// ============================================================
// GET OCCUPIED SLOTS
// ============================================================

function getOccupiedSlotObjects() {

    return parkingSlots.filter(
        slot =>
            getSlotStatus(slot) === "occupied"
    );

}


// ============================================================
// GET RESERVED SLOTS
// ============================================================

function getReservedSlotObjects() {

    return parkingSlots.filter(
        slot =>
            getSlotStatus(slot) === "reserved"
    );

}


// ============================================================
// GET MAINTENANCE SLOTS
// ============================================================

function getMaintenanceSlotObjects() {

    return parkingSlots.filter(
        slot =>
            getSlotStatus(slot) === "maintenance"
    );

}


// ============================================================
// AI RESPONSE ENGINE
// ============================================================

async function generateAIResponse(message) {

    const text =
        message
            .toLowerCase()
            .trim();


    // ========================================================
    // GREETING
    // ========================================================

    if (
        /^(hi|hello|hey|hai|good morning|good afternoon|good evening)\b/
            .test(text)
    ) {

        return `
            <div class="response-block">

                <h4>👋 Hello!</h4>

                <p>
                    I'm <strong>SmartPark AI</strong>,
                    your parking management assistant.
                </p>

                <p>
                    I can provide real-time information
                    from the SmartPark database.
                </p>

                <div class="response-list">

                    <span>🅿️ Available slots</span>

                    <span>🚗 Occupied slots</span>

                    <span>🔒 Reserved slots</span>

                    <span>📅 Bookings</span>

                    <span>🚘 Registered vehicles</span>

                    <span>🚪 Vehicles currently inside</span>

                    <span>📊 Parking summary</span>

                </div>

            </div>
        `;

    }


    // ========================================================
    // HELP
    // ========================================================

    if (
        text.includes("help") ||
        text.includes("what can you do") ||
        text.includes("commands")
    ) {

        return `
            <div class="response-block">

                <h4>🤖 SmartPark AI</h4>

                <p>
                    You can ask me:
                </p>

                <div class="response-list">

                    <span>
                        🅿️ Which parking slots are available?
                    </span>

                    <span>
                        🚗 Which slots are occupied?
                    </span>

                    <span>
                        🔒 Which slots are reserved?
                    </span>

                    <span>
                        📅 Show bookings
                    </span>

                    <span>
                        🚘 Show registered vehicles
                    </span>

                    <span>
                        🚪 Which vehicles are inside?
                    </span>

                    <span>
                        📊 Show parking summary
                    </span>

                </div>

            </div>
        `;

    }


    // ========================================================
    // AVAILABLE
    // ========================================================

    if (
        text.includes("available") ||
        text.includes("free slot") ||
        text.includes("free parking")
    ) {

        return getAvailableSlotsResponse();

    }


    // ========================================================
    // RESERVED
    // ========================================================

    if (
        text.includes("reserved") ||
        text.includes("reservation")
    ) {

        return getReservedSlotsResponse();

    }


    // ========================================================
    // OCCUPIED
    // ========================================================

    if (
        text.includes("occupied") ||
        text.includes("full slot") ||
        text.includes("filled slot")
    ) {

        return getOccupiedSlotsResponse();

    }


    // ========================================================
    // VEHICLES INSIDE
    // ========================================================

    if (
        text.includes("inside") ||
        text.includes("currently inside") ||
        text.includes("parked inside") ||
        text.includes("vehicles inside")
    ) {

        return getVehiclesInsideResponse();

    }


    // ========================================================
    // VEHICLES
    // ========================================================

    if (
        text.includes("vehicle") ||
        text.includes("cars") ||
        text.includes("registered car")
    ) {

        return getVehiclesResponse();

    }


    // ========================================================
    // BOOKINGS
    // ========================================================

    if (
        text.includes("booking") ||
        text.includes("bookings")
    ) {

        return getBookingsResponse();

    }


    // ========================================================
    // SUMMARY
    // ========================================================

    if (
        text.includes("summary") ||
        text.includes("overview") ||
        text.includes("parking status") ||
        text.includes("parking information") ||
        text === "status"
    ) {

        return getParkingSummaryResponse();

    }


    // ========================================================
    // UNKNOWN
    // ========================================================

    return `
        <div class="response-block">

            <h4>🤔 I didn't understand that.</h4>

            <p>
                I can answer questions about:
            </p>

            <div class="response-list">

                <span>🅿️ Available parking slots</span>

                <span>🚗 Occupied parking slots</span>

                <span>🔒 Reserved slots</span>

                <span>📅 Bookings</span>

                <span>🚘 Registered vehicles</span>

                <span>🚪 Vehicles currently inside</span>

                <span>📊 Parking summary</span>

            </div>

            <p>
                Try:
                <strong>
                    "Which parking slots are available?"
                </strong>
            </p>

        </div>
    `;

}


// ============================================================
// AVAILABLE RESPONSE
// ============================================================

function getAvailableSlotsResponse() {

    const available =
        getAvailableSlotObjects();


    if (available.length === 0) {

        return `
            <div class="response-block">

                <h4>🅿️ Available Parking</h4>

                <div class="empty-response">

                    <span>🚫</span>

                    <p>
                        No parking slots are currently available.
                    </p>

                </div>

            </div>
        `;

    }


    const list =
        available
            .map(slot => {

                const number =
                    getSlotNumber(slot);

                return `
                    <div class="data-row">

                        <span>
                            🅿️
                            <strong>
                                Slot ${escapeHTML(number)}
                            </strong>
                        </span>

                        <span class="status-available">
                            AVAILABLE
                        </span>

                    </div>
                `;

            })
            .join("");


    return `
        <div class="response-block">

            <div class="response-header">

                <h4>
                    🅿️ Available Parking Slots
                </h4>

                <span class="count-badge">
                    ${available.length}
                </span>

            </div>

            <p>
                There
                <strong>
                    ${available.length}
                </strong>
                available
                ${available.length === 1 ? "slot" : "slots"}.
            </p>

            <div class="data-table">

                ${list}

            </div>

        </div>
    `;

}


// ============================================================
// OCCUPIED RESPONSE
// ============================================================

function getOccupiedSlotsResponse() {

    const occupied =
        getOccupiedSlotObjects();


    if (occupied.length === 0) {

        return `
            <div class="response-block">

                <h4>🚗 Occupied Parking</h4>

                <div class="empty-response">

                    <span>✅</span>

                    <p>
                        No parking slots are currently occupied.
                    </p>

                </div>

            </div>
        `;

    }


    const list =
        occupied
            .map(slot => {

                const number =
                    getSlotNumber(slot);

                const booking =
                    getActiveBookingForSlot(slot);


                const vehicle =
                    booking
                        ? (
                            booking.vehicleNumber ||
                            "Vehicle"
                        )
                        : (
                            slot.occupiedVehicle ||
                            slot.vehicleNumber ||
                            "Vehicle"
                        );


                const owner =
                    booking
                        ? (
                            booking.fullName ||
                            booking.userName ||
                            "Unknown"
                        )
                        : (
                            slot.fullName ||
                            "Unknown"
                        );


                return `
                    <div class="data-card">

                        <div class="data-card-title">
                            🚗 Slot
                            ${escapeHTML(number)}
                        </div>

                        <div class="data-card-info">
                            Vehicle:
                            <strong>
                                ${escapeHTML(String(vehicle))}
                            </strong>
                        </div>

                        <div class="data-card-info">
                            Owner:
                            <strong>
                                ${escapeHTML(String(owner))}
                            </strong>
                        </div>

                        <div class="data-card-info">

                            Status:

                            <strong class="status-occupied">
                                OCCUPIED
                            </strong>

                        </div>

                    </div>
                `;

            })
            .join("");


    return `
        <div class="response-block">

            <div class="response-header">

                <h4>
                    🚗 Occupied Parking Slots
                </h4>

                <span class="count-badge">
                    ${occupied.length}
                </span>

            </div>

            <div class="data-table">

                ${list}

            </div>

        </div>
    `;

}


// ============================================================
// RESERVED RESPONSE
// ============================================================

function getReservedSlotsResponse() {

    const reserved =
        getReservedSlotObjects();


    if (reserved.length === 0) {

        return `
            <div class="response-block">

                <h4>🔒 Reserved Parking</h4>

                <div class="empty-response">

                    <span>ℹ️</span>

                    <p>
                        No parking slots are currently reserved.
                    </p>

                </div>

            </div>
        `;

    }


    const list =
        reserved
            .map(slot => {

                const number =
                    getSlotNumber(slot);

                const booking =
                    getReservedBookingForSlot(slot);


                const user =
                    booking
                        ? (
                            booking.fullName ||
                            booking.userName ||
                            booking.userEmail ||
                            "Unknown"
                        )
                        : "Unknown";


                const vehicle =
                    booking
                        ? (
                            booking.vehicleNumber ||
                            "N/A"
                        )
                        : "N/A";


                return `
                    <div class="data-card">

                        <div class="data-card-title">

                            🔒 Slot
                            ${escapeHTML(number)}

                        </div>

                        <div class="data-card-info">

                            User:
                            <strong>
                                ${escapeHTML(String(user))}
                            </strong>

                        </div>

                        <div class="data-card-info">

                            Vehicle:
                            <strong>
                                ${escapeHTML(String(vehicle))}
                            </strong>

                        </div>

                        <div class="data-card-info">

                            Status:
                            <strong>
                                RESERVED
                            </strong>

                        </div>

                    </div>
                `;

            })
            .join("");


    return `
        <div class="response-block">

            <div class="response-header">

                <h4>
                    🔒 Reserved Parking Slots
                </h4>

                <span class="count-badge">
                    ${reserved.length}
                </span>

            </div>

            <div class="data-table">

                ${list}

            </div>

        </div>
    `;

}


// ============================================================
// BOOKINGS RESPONSE
// ============================================================

function getBookingsResponse() {

    if (bookings.length === 0) {

        return `
            <div class="response-block">

                <h4>📅 Parking Bookings</h4>

                <div class="empty-response">

                    <span>📭</span>

                    <p>
                        No bookings found.
                    </p>

                </div>

            </div>
        `;

    }


    const active =
        bookings.filter(
            booking =>
                normalizeStatus(
                    booking.status
                ) === "active"
        );


    const reserved =
        bookings.filter(
            booking =>
                normalizeStatus(
                    booking.status
                ) === "reserved"
        );


    const completed =
        bookings.filter(
            booking =>
                normalizeStatus(
                    booking.status
                ) === "completed"
        );


    const list =
        bookings
            .slice()
            .reverse()
            .slice(0, 15)
            .map(booking => {

                const user =
                    booking.fullName ||
                    booking.userName ||
                    booking.userEmail ||
                    "Unknown User";


                const vehicle =
                    booking.vehicleNumber ||
                    "N/A";


                const slot =
                    booking.slotNumber ||
                    booking.slotId ||
                    "N/A";


                const status =
                    normalizeStatus(
                        booking.status
                    ) || "unknown";


                const time =
                    booking.bookingTime ||
                    formatDate(
                        booking.createdAt
                    ) ||
                    "N/A";


                return `
                    <div class="data-card">

                        <div class="data-card-title">

                            📅
                            ${escapeHTML(String(user))}

                        </div>

                        <div class="data-card-info">

                            🅿️ Slot:
                            <strong>
                                ${escapeHTML(String(slot))}
                            </strong>

                        </div>

                        <div class="data-card-info">

                            🚗 Vehicle:
                            <strong>
                                ${escapeHTML(String(vehicle))}
                            </strong>

                        </div>

                        <div class="data-card-info">

                            Status:
                            <strong>
                                ${escapeHTML(
                                    status.toUpperCase()
                                )}
                            </strong>

                        </div>

                        <div class="data-card-info">

                            🕒 Time:
                            <strong>
                                ${escapeHTML(String(time))}
                            </strong>

                        </div>

                    </div>
                `;

            })
            .join("");


    return `
        <div class="response-block">

            <div class="response-header">

                <h4>
                    📅 Parking Bookings
                </h4>

                <span class="count-badge">
                    ${bookings.length}
                </span>

            </div>

            <div class="summary-mini">

                <div>

                    <strong>
                        ${active.length}
                    </strong>

                    <small>
                        Active
                    </small>

                </div>

                <div>

                    <strong>
                        ${reserved.length}
                    </strong>

                    <small>
                        Reserved
                    </small>

                </div>

                <div>

                    <strong>
                        ${completed.length}
                    </strong>

                    <small>
                        Completed
                    </small>

                </div>

            </div>

            <div class="data-table">

                ${list}

            </div>

        </div>
    `;

}


// ============================================================
// VEHICLES RESPONSE
// ============================================================

function getVehiclesResponse() {

    if (vehicles.length === 0) {

        return `
            <div class="response-block">

                <h4>🚘 Registered Vehicles</h4>

                <div class="empty-response">

                    <span>🚫</span>

                    <p>
                        No registered vehicles found.
                    </p>

                </div>

            </div>
        `;

    }


    const list =
        vehicles
            .slice(0, 20)
            .map(vehicle => {

                const number =
                    vehicle.vehicleNumber ||
                    vehicle.registrationNumber ||
                    vehicle.number ||
                    vehicle.id;


                const model =
                    vehicle.vehicleModel ||
                    vehicle.model ||
                    "N/A";


                const brand =
                    vehicle.vehicleBrand ||
                    "N/A";


                const type =
                    vehicle.vehicleType ||
                    "N/A";


                const owner =
                    vehicle.ownerName ||
                    vehicle.userName ||
                    vehicle.fullName ||
                    "Registered User";


                return `
                    <div class="data-card">

                        <div class="data-card-title">

                            🚘
                            ${escapeHTML(
                                String(number)
                            )}

                        </div>

                        <div class="data-card-info">

                            Owner:
                            <strong>
                                ${escapeHTML(
                                    String(owner)
                                )}
                            </strong>

                        </div>

                        <div class="data-card-info">

                            Vehicle:
                            <strong>
                                ${escapeHTML(
                                    String(brand)
                                )}
                                ${escapeHTML(
                                    String(model)
                                )}
                            </strong>

                        </div>

                        <div class="data-card-info">

                            Type:
                            <strong>
                                ${escapeHTML(
                                    String(type)
                                )}
                            </strong>

                        </div>

                    </div>
                `;

            })
            .join("");


    return `
        <div class="response-block">

            <div class="response-header">

                <h4>
                    🚘 Registered Vehicles
                </h4>

                <span class="count-badge">
                    ${vehicles.length}
                </span>

            </div>

            <p>

                I found
                <strong>
                    ${vehicles.length}
                </strong>
                registered
                ${vehicles.length === 1
                    ? "vehicle"
                    : "vehicles"}.

            </p>

            <div class="data-table">

                ${list}

            </div>

        </div>
    `;

}


// ============================================================
// VEHICLES CURRENTLY INSIDE
// ============================================================

function getCurrentVehiclesInside() {

    /*
     * IMPORTANT:
     *
     * entryLogs contains historical records.
     *
     * We must NOT simply filter:
     *
     * status === "inside"
     *
     * because a vehicle can have multiple old records.
     *
     * We use the latest log for each vehicle.
     */


    const latestByVehicle =
        new Map();


    entryLogs.forEach(entry => {

        const vehicle =
            normalizeVehicleNumber(
                entry.vehicleNumber
            );


        if (!vehicle) return;


        const existing =
            latestByVehicle.get(vehicle);


        if (!existing) {

            latestByVehicle.set(
                vehicle,
                entry
            );

            return;

        }


        const currentTime =
            getTimestampValue(
                entry.entryTime ||
                entry.createdAt ||
                entry.timestamp
            );


        const existingTime =
            getTimestampValue(
                existing.entryTime ||
                existing.createdAt ||
                existing.timestamp
            );


        if (currentTime >= existingTime) {

            latestByVehicle.set(
                vehicle,
                entry
            );

        }

    });


    return Array.from(
        latestByVehicle.values()
    )
        .filter(entry => {

            return (
                normalizeStatus(
                    entry.status
                ) === "inside"
            );

        });

}


// ============================================================
// VEHICLES INSIDE RESPONSE
// ============================================================

function getVehiclesInsideResponse() {

    const inside =
        getCurrentVehiclesInside();


    if (inside.length === 0) {

        return `
            <div class="response-block">

                <h4>
                    🚪 Vehicles Currently Inside
                </h4>

                <div class="empty-response">

                    <span>🚗</span>

                    <p>
                        No vehicles are currently inside
                        the parking area.
                    </p>

                </div>

            </div>
        `;

    }


    const list =
        inside
            .map(entry => {

                const number =
                    entry.vehicleNumber ||
                    "Unknown";


                const owner =
                    entry.ownerName ||
                    entry.fullName ||
                    "Unknown";


                const slot =
                    entry.slotNumber ||
                    "N/A";


                const entryTime =
                    entry.entryTime ||
                    "N/A";


                return `
                    <div class="data-card">

                        <div class="data-card-title">

                            🚗
                            ${escapeHTML(
                                String(number)
                            )}

                        </div>

                        <div class="data-card-info">

                            Owner:
                            <strong>
                                ${escapeHTML(
                                    String(owner)
                                )}
                            </strong>

                        </div>

                        <div class="data-card-info">

                            🅿️ Slot:
                            <strong>
                                ${escapeHTML(
                                    String(slot)
                                )}
                            </strong>

                        </div>

                        <div class="data-card-info">

                            🕒 Entry:
                            <strong>
                                ${escapeHTML(
                                    String(entryTime)
                                )}
                            </strong>

                        </div>

                        <div class="data-card-info">

                            Status:
                            <strong>
                                INSIDE
                            </strong>

                        </div>

                    </div>
                `;

            })
            .join("");


    return `
        <div class="response-block">

            <div class="response-header">

                <h4>
                    🚪 Vehicles Currently Inside
                </h4>

                <span class="count-badge">
                    ${inside.length}
                </span>

            </div>

            <div class="data-table">

                ${list}

            </div>

        </div>
    `;

}


// ============================================================
// PARKING SUMMARY
// ============================================================

function getParkingSummaryResponse() {

    const total =
        parkingSlots.length;


    const available =
        getAvailableSlotObjects().length;


    const occupied =
        getOccupiedSlotObjects().length;


    const reserved =
        getReservedSlotObjects().length;


    const maintenance =
        getMaintenanceSlotObjects().length;


    const inside =
        getCurrentVehiclesInside().length;


    return `
        <div class="response-block">

            <div class="response-header">

                <h4>
                    📊 Parking Summary
                </h4>

            </div>

            <div class="summary-grid">

                <div class="summary-item">

                    <span class="summary-icon">
                        🅿️
                    </span>

                    <strong>
                        ${total}
                    </strong>

                    <small>
                        Total Slots
                    </small>

                </div>


                <div class="summary-item">

                    <span class="summary-icon">
                        🟢
                    </span>

                    <strong>
                        ${available}
                    </strong>

                    <small>
                        Available
                    </small>

                </div>


                <div class="summary-item">

                    <span class="summary-icon">
                        🔴
                    </span>

                    <strong>
                        ${occupied}
                    </strong>

                    <small>
                        Occupied
                    </small>

                </div>


                <div class="summary-item">

                    <span class="summary-icon">
                        🟡
                    </span>

                    <strong>
                        ${reserved}
                    </strong>

                    <small>
                        Reserved
                    </small>

                </div>


                <div class="summary-item">

                    <span class="summary-icon">
                        🔧
                    </span>

                    <strong>
                        ${maintenance}
                    </strong>

                    <small>
                        Maintenance
                    </small>

                </div>


                <div class="summary-item">

                    <span class="summary-icon">
                        🚗
                    </span>

                    <strong>
                        ${inside}
                    </strong>

                    <small>
                        Vehicles Inside
                    </small>

                </div>

            </div>


            <div class="summary-message">

                ${
                    available > 0

                    ? `
                        🟢
                        <strong>
                            ${available}
                        </strong>
                        ${available === 1
                            ? "parking slot is"
                            : "parking slots are"}
                        currently available.
                    `

                    : `
                        🔴
                        No parking slots are
                        currently available.
                    `
                }

            </div>

        </div>
    `;

}


// ============================================================
// GET SLOT NUMBER
// ============================================================

function getSlotNumber(slot) {

    return (
        slot.slotNumber ||
        slot.number ||
        slot.name ||
        slot.id ||
        "Unknown"
    );

}


// ============================================================
// NORMALIZE VEHICLE NUMBER
// ============================================================

function normalizeVehicleNumber(value) {

    return String(
        value || ""
    )
        .trim()
        .toUpperCase();

}


// ============================================================
// TIMESTAMP CONVERTER
// ============================================================

function getTimestampValue(value) {

    if (!value) {
        return 0;
    }


    // Firebase Timestamp

    if (
        typeof value.toMillis ===
        "function"
    ) {

        return value.toMillis();

    }


    // JavaScript Date

    if (value instanceof Date) {

        return value.getTime();

    }


    // Firebase timestamp object

    if (
        value.seconds !== undefined
    ) {

        return (
            Number(value.seconds) * 1000 +
            Number(value.nanoseconds || 0) / 1000000
        );

    }


    // String date

    const parsed =
        Date.parse(
            String(value)
        );


    if (!isNaN(parsed)) {

        return parsed;

    }


    return 0;

}


// ============================================================
// FORMAT FIREBASE DATE
// ============================================================

function formatDate(value) {

    const timestamp =
        getTimestampValue(value);


    if (!timestamp) {

        return "";

    }


    return new Date(
        timestamp
    ).toLocaleString();

}


// ============================================================
// ADD USER MESSAGE
// ============================================================

function addUserMessage(message) {

    if (!chatMessages) return;


    const wrapper =
        document.createElement("div");


    wrapper.className =
        "message user-message";


    wrapper.innerHTML = `

        <div class="message-content">

            <strong>
                You
            </strong>

            <p>
                ${escapeHTML(message)}
            </p>

        </div>

        <div class="message-icon">

            <i class="fa-solid fa-user"></i>

        </div>

    `;


    chatMessages.appendChild(
        wrapper
    );


    scrollToBottom();

}


// ============================================================
// ADD AI MESSAGE
// ============================================================

function addAIMessage(content) {

    if (!chatMessages) return;


    const wrapper =
        document.createElement("div");


    wrapper.className =
        "message ai-message";


    wrapper.innerHTML = `

        <div class="message-icon">

            <i class="fa-solid fa-robot"></i>

        </div>

        <div class="message-content">

            <strong>
                SmartPark AI
            </strong>

            ${content}

        </div>

    `;


    chatMessages.appendChild(
        wrapper
    );


    scrollToBottom();

}


// ============================================================
// LOADING MESSAGE
// ============================================================

function addLoadingMessage() {

    if (!chatMessages) return null;


    const wrapper =
        document.createElement("div");


    wrapper.className =
        "message ai-message loading-message";


    wrapper.innerHTML = `

        <div class="message-icon">

            <i class="fa-solid fa-robot"></i>

        </div>

        <div class="message-content">

            <strong>
                SmartPark AI
            </strong>

            <p class="typing-indicator">

                <span></span>
                <span></span>
                <span></span>

                Checking latest parking data...

            </p>

        </div>

    `;


    chatMessages.appendChild(
        wrapper
    );


    scrollToBottom();


    return wrapper;

}


// ============================================================
// REMOVE MESSAGE
// ============================================================

function removeMessage(element) {

    if (
        element &&
        element.parentNode
    ) {

        element.parentNode.removeChild(
            element
        );

    }

}


// ============================================================
// SCROLL
// ============================================================

function scrollToBottom() {

    if (!chatMessages) return;


    chatMessages.scrollTo({

        top:
            chatMessages.scrollHeight,

        behavior:
            "smooth"

    });

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    const div =
        document.createElement("div");


    div.textContent =
        value ?? "";


    return div.innerHTML;

}


// ============================================================
// GLOBAL AI FUNCTION
// ============================================================

window.askSmartParkAI =
    async function(question) {

        if (aiInput) {

            aiInput.value =
                question;

        }

        await processUserMessage(
            question
        );

    };


// ============================================================
// AUTH CHECK
// ============================================================

if (auth) {

    auth.onAuthStateChanged(
        user => {

            if (user) {

                console.log(
                    "👤 AI Assistant user:",
                    user.email
                );

            }

            else {

                console.log(
                    "⚠️ No authenticated user."
                );

            }

        }
    );

}