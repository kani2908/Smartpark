// ============================================================
// SMARTPARK AI
// BOOKING HISTORY - ADMIN
// ============================================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    collection,
    getDocs,
    getDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


// ============================================================
// HTML ELEMENTS
// ============================================================

const bookingsContainer =
    document.getElementById("bookingsContainer");

const bookingLoading =
    document.getElementById("bookingLoading");

const bookingEmpty =
    document.getElementById("bookingEmpty");

const bookingError =
    document.getElementById("bookingError");

const bookingSearch =
    document.getElementById("bookingSearch");

const statusFilter =
    document.getElementById("statusFilter");

const refreshBookingsBtn =
    document.getElementById("refreshBookingsBtn");

const bookingResultText =
    document.getElementById("bookingResultText");


// Statistics

const totalBookings =
    document.getElementById("totalBookings");

const activeBookings =
    document.getElementById("activeBookings");

const reservedBookings =
    document.getElementById("reservedBookings");

const completedBookings =
    document.getElementById("completedBookings");

const cancelledBookings =
    document.getElementById("cancelledBookings");


// ============================================================
// DATA
// ============================================================

let allBookings = [];


// ============================================================
// AUTHENTICATION
// ============================================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;

    }


    try {

        // Check current user in Firestore

        const userRef =
            doc(
                db,
                "users",
                user.uid
            );

        const userSnapshot =
            await getDoc(userRef);


        if (!userSnapshot.exists()) {

            alert("User account not found.");

            window.location.href =
                "login.html";

            return;

        }


        const userData =
            userSnapshot.data();


        // ====================================================
        // ADMIN CHECK
        // ====================================================

        if (
            String(userData.role)
                .toLowerCase()
            !== "admin"
        ) {

            alert(
                "Access denied. Admins only."
            );

            window.location.href =
                "dashboard.html";

            return;

        }


        // ====================================================
        // LOAD BOOKINGS
        // ====================================================

        await loadBookings();

    }

    catch (error) {

        console.error(
            "Authentication error:",
            error
        );

        showError(
            "Unable to verify administrator access."
        );

    }

});


// ============================================================
// LOAD ALL BOOKINGS
// ============================================================

async function loadBookings() {

    showLoading();


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "bookings"
                )
            );


        allBookings = [];


        snapshot.forEach(
            (bookingDoc) => {

                const data =
                    bookingDoc.data();


                allBookings.push({

                    id:
                        bookingDoc.id,

                    ...data

                });

            }
        );


        // ====================================================
        // SORT NEWEST FIRST
        // ====================================================

        allBookings.sort(
            (a, b) => {

                return getBookingTime(b)
                    - getBookingTime(a);

            }
        );

        updateStatistics();

        renderBookings();

        bookingLoading.style.display = "none";
        bookingError.style.display = "none";

    }

    catch (error) {

        console.error(
            "Failed to load bookings:",
            error
        );

        showError(
            "Failed to load booking history. " +
            error.message
        );

    }

}


// ============================================================
// GET BOOKING TIME
// ============================================================

function getBookingTime(booking) {

    // Firestore Timestamp

    if (
        booking.bookingTime &&
        typeof booking.bookingTime.toDate
            === "function"
    ) {

        return booking.bookingTime
            .toDate()
            .getTime();

    }


    // JS Date

    if (
        booking.bookingTime
        instanceof Date
    ) {

        return booking.bookingTime
            .getTime();

    }


    // String date

    if (
        typeof booking.bookingTime
        === "string"
    ) {

        const time =
            new Date(
                booking.bookingTime
            ).getTime();


        if (!Number.isNaN(time)) {

            return time;

        }

    }


    // Firestore creation timestamp

    if (
        booking.createdAt &&
        typeof booking.createdAt.toDate
            === "function"
    ) {

        return booking.createdAt
            .toDate()
            .getTime();

    }


    return 0;

}


// ============================================================
// UPDATE STATISTICS
// ============================================================

function updateStatistics() {

    let active = 0;

    let reserved = 0;

    let completed = 0;

    let cancelled = 0;


    allBookings.forEach(
        (booking) => {

            const status =
                String(
                    booking.status || ""
                )
                .trim()
                .toLowerCase();


            if (status === "active") {

                active++;

            }

            else if (
                status === "reserved"
            ) {

                reserved++;

            }

            else if (
                status === "completed"
            ) {

                completed++;

            }

            else if (
                status === "cancelled"
            ) {

                cancelled++;

            }

        }
    );


    totalBookings.textContent =
        allBookings.length;

    activeBookings.textContent =
        active;

    reservedBookings.textContent =
        reserved;

    completedBookings.textContent =
        completed;

    cancelledBookings.textContent =
        cancelled;

}


// ============================================================
// RENDER BOOKINGS
// ============================================================

function renderBookings() {

    bookingsContainer.innerHTML = "";

    bookingEmpty.style.display =
        "none";


    const searchText =
        bookingSearch.value
            .trim()
            .toLowerCase();


    const selectedStatus =
        statusFilter.value;


    const filteredBookings =
        allBookings.filter(
            (booking) => {

                const name =
                    String(
                        booking.fullName || ""
                    )
                    .toLowerCase();


                const vehicle =
                    String(
                        booking.vehicleNumber || ""
                    )
                    .toLowerCase();


                const slot =
                    String(
                        booking.slotNumber || ""
                    )
                    .toLowerCase();


                const userId =
                    String(
                        booking.userId || ""
                    )
                    .toLowerCase();


                const status =
                    String(
                        booking.status || ""
                    )
                    .toLowerCase();


                const matchesSearch =
                    !searchText ||

                    name.includes(searchText) ||

                    vehicle.includes(searchText) ||

                    slot.includes(searchText) ||

                    userId.includes(searchText);


                const matchesStatus =
                    selectedStatus === "all"
                    ||
                    status === selectedStatus;


                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );


    // ========================================================
    // RESULT COUNT
    // ========================================================

    bookingResultText.textContent =
        `${filteredBookings.length} booking` +
        `${filteredBookings.length === 1 ? "" : "s"} found`;


    // ========================================================
    // EMPTY
    // ========================================================

    if (
        filteredBookings.length === 0
    ) {

        bookingEmpty.style.display =
            "flex";

        return;

    }


    // ========================================================
    // CREATE CARDS
    // ========================================================

    filteredBookings.forEach(
        (booking) => {

            const card =
                createBookingCard(
                    booking
                );


            bookingsContainer.appendChild(
                card
            );

        }
    );

}


// ============================================================
// CREATE BOOKING CARD
// ============================================================

function createBookingCard(
    booking
) {

    const card =
        document.createElement("div");


    card.className =
        "booking-card";


    const status =
        String(
            booking.status || "unknown"
        )
        .trim()
        .toLowerCase();


    const slotNumber =
        booking.slotNumber
        || booking.slotId
        || "N/A";


    const fullName =
        booking.fullName
        || "Unknown User";


    const vehicleNumber =
        booking.vehicleNumber
        || "Not available";


    const bookingTime =
        formatDate(
            booking.bookingTime
        );


    const exitTime =
        formatDate(
            booking.exitTime
        );


    card.innerHTML = `

        <div class="booking-card-top">

            <div class="slot-info">

                <div class="slot-icon">

                    <i class="fa-solid fa-square-parking"></i>

                </div>

                <div>

                    <h3>
                        Slot ${escapeHTML(slotNumber)}
                    </h3>

                    <span>
                        SmartPark Booking
                    </span>

                </div>

            </div>


            <span
                class="status-badge status-${escapeHTML(status)}"
            >

                ${escapeHTML(
                    status.toUpperCase()
                )}

            </span>

        </div>


        <div class="booking-details">


            <div class="booking-detail">

                <i class="fa-solid fa-user"></i>

                <div>

                    <span>Resident</span>

                    <strong>
                        ${escapeHTML(fullName)}
                    </strong>

                </div>

            </div>


            <div class="booking-detail">

                <i class="fa-solid fa-car"></i>

                <div>

                    <span>Vehicle</span>

                    <strong>
                        ${escapeHTML(vehicleNumber)}
                    </strong>

                </div>

            </div>


            <div class="booking-detail">

                <i class="fa-solid fa-calendar-days"></i>

                <div>

                    <span>Booking Time</span>

                    <strong>
                        ${escapeHTML(bookingTime)}
                    </strong>

                </div>

            </div>


            <div class="booking-detail">

                <i class="fa-solid fa-right-from-bracket"></i>

                <div>

                    <span>Exit Time</span>

                    <strong>
                        ${escapeHTML(exitTime)}
                    </strong>

                </div>

            </div>


        </div>


        <div class="booking-card-footer">

            <span>

                Booking ID:
                ${escapeHTML(booking.id)}

            </span>

        </div>

    `;


    return card;

}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(
    value
) {

    if (!value) {

        return "—";

    }


    let date;


    // Firestore Timestamp

    if (
        value &&
        typeof value.toDate ===
            "function"
    ) {

        date =
            value.toDate();

    }


    // JavaScript Date

    else if (
        value instanceof Date
    ) {

        date = value;

    }


    // String / number

    else {

        date =
            new Date(value);

    }


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value);

    }


    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(
    value
) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// ============================================================
// SEARCH
// ============================================================

bookingSearch.addEventListener(
    "input",
    renderBookings
);


// ============================================================
// FILTER
// ============================================================

statusFilter.addEventListener(
    "change",
    renderBookings
);


// ============================================================
// REFRESH
// ============================================================

refreshBookingsBtn.addEventListener(
    "click",
    async () => {

        await loadBookings();

    }
);


// ============================================================
// LOADING
// ============================================================

function showLoading() {

    bookingLoading.style.display =
        "flex";

    bookingEmpty.style.display =
        "none";

    bookingError.style.display =
        "none";

    bookingsContainer.innerHTML = "";

    bookingResultText.textContent =
        "Loading bookings...";

}


// ============================================================
// ERROR
// ============================================================

function showError(
    message
) {

    bookingLoading.style.display =
        "none";

    bookingEmpty.style.display =
        "none";

    bookingError.style.display =
        "flex";

    bookingError.querySelector(
        "span"
    ).textContent = message;

}


// ============================================================
// FINISHED
// ============================================================

console.log(
    "📜 booking-history.js loaded successfully."
);