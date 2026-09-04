// ============================================================
// SMARTPARK AI - ADMIN DASHBOARD
// Clean version
// ============================================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
    collection,
    getDocs,
    getDoc,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


// ============================================================
// HTML ELEMENTS
// ============================================================

const adminName = document.getElementById("adminName");

const registeredUsersContainer =
    document.getElementById("registeredUsers");

const adminUsersContainer =
    document.getElementById("adminUsers");

const slotsContainer =
    document.getElementById("slotsContainer");

const bookingsContainer =
    document.getElementById("bookingsContainer");

const totalUsers =
    document.getElementById("totalUsers");

const totalSlots =
    document.getElementById("totalSlots");

const availableSlots =
    document.getElementById("availableSlots");

const occupiedSlots =
    document.getElementById("occupiedSlots");

const totalBookings =
    document.getElementById("totalBookings");

const addSlotBtn =
    document.getElementById("addSlotBtn");

const slotModal =
    document.getElementById("slotModal");

const slotModalTitle =
    document.getElementById("slotModalTitle");

const slotNumber =
    document.getElementById("slotNumber");

const saveSlotBtn =
    document.getElementById("saveSlotBtn");

const cancelSlotBtn =
    document.getElementById("cancelSlotBtn");

const logoutBtn =
    document.getElementById("logoutBtn");

const historyBtn =
    document.getElementById("historyBtn");


// ============================================================
// VARIABLES
// ============================================================

let editMode = false;
let oldSlotNumber = "";

let usersLoading = false;
let initialized = false;


// ============================================================
// AUTHENTICATION
// ============================================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";
        return;
    }

    try {

        const userRef =
            doc(db, "users", user.uid);

        const userSnap =
            await getDoc(userRef);


        if (!userSnap.exists()) {

            alert("User not found.");

            window.location.href =
                "login.html";

            return;
        }


        const userData =
            userSnap.data();


        // ----------------------------------------------------
        // ADMIN CHECK
        // ----------------------------------------------------

        const role =
            String(
                userData.role || ""
            ).toLowerCase();


        if (
            role !== "admin" &&
            role !== "administrator"
        ) {

            alert("Access Denied.");

            window.location.href =
                "dashboard.html";

            return;
        }


        // ----------------------------------------------------
        // ADMIN NAME
        // ----------------------------------------------------

        if (adminName) {

            adminName.textContent =
                `Welcome, ${userData.fullName || "Administrator"}`;
        }


        // ----------------------------------------------------
        // INITIALIZE ONLY ONCE
        // ----------------------------------------------------

        if (!initialized) {

            initialized = true;

            await initialize();
        }

    }

    catch (error) {

        console.error(
            "Authentication error:",
            error
        );

    }

});


// ============================================================
// INITIALIZE DASHBOARD
// ============================================================

async function initialize() {

    console.log(
        "🚀 Admin dashboard initializing..."
    );


    updateLiveDateTime();


    await loadUsers();

    await loadSlots();

    await loadBookings();


    console.log(
        "✅ Admin dashboard ready."
    );
}


// ============================================================
// LIVE DATE & TIME
// ============================================================

function updateLiveDateTime() {

    const dayDateElement =
        document.getElementById("liveDayDate");

    const timeElement =
        document.getElementById("liveTime");


    if (
        !dayDateElement ||
        !timeElement
    ) {

        return;
    }


    const now =
        new Date();


    const dayDate =
        now.toLocaleDateString(
            "en-IN",
            {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
            }
        );


    const time =
        now.toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true
            }
        );


    dayDateElement.textContent =
        dayDate;

    timeElement.textContent =
        time;
}


setInterval(
    updateLiveDateTime,
    1000
);


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ============================================================
// LOAD USERS
// ============================================================

async function loadUsers() {

    if (usersLoading) {

        console.log(
            "⚠️ loadUsers already running."
        );

        return;
    }


    usersLoading = true;


    try {

        // ----------------------------------------------------
        // CHECK CONTAINERS
        // ----------------------------------------------------

        if (!registeredUsersContainer) {

            console.error(
                "❌ #registeredUsers not found."
            );

            return;
        }


        if (!adminUsersContainer) {

            console.error(
                "❌ #adminUsers not found."
            );

            return;
        }


        // ----------------------------------------------------
        // CLEAR EXISTING CARDS
        // ----------------------------------------------------

        registeredUsersContainer.innerHTML = "";

        adminUsersContainer.innerHTML = "";


        // ----------------------------------------------------
        // GET USERS
        // ----------------------------------------------------

        const snapshot =
            await getDocs(
                collection(db, "users")
            );


        console.log(
            "🔥 Firebase user documents:",
            snapshot.size
        );


        // ----------------------------------------------------
        // REMOVE DUPLICATES
        //
        // Priority:
        // 1. Email
        // 2. UID
        // 3. Document ID
        // ----------------------------------------------------

        const uniqueUsers =
            new Map();


        snapshot.forEach((userDoc) => {

            const data =
                userDoc.data();


            const email =
                String(
                    data.email || ""
                )
                    .trim()
                    .toLowerCase();


            const uid =
                String(
                    data.uid || ""
                )
                    .trim();


            let uniqueKey;


            if (email) {

                uniqueKey =
                    `email:${email}`;

            }

            else if (uid) {

                uniqueKey =
                    `uid:${uid}`;

            }

            else {

                uniqueKey =
                    `doc:${userDoc.id}`;
            }


            // ------------------------------------------------
            // ONLY ADD FIRST INSTANCE
            // ------------------------------------------------

            if (!uniqueUsers.has(uniqueKey)) {

                uniqueUsers.set(
                    uniqueKey,
                    {
                        ...data,

                        uid:
                            data.uid ||
                            userDoc.id,

                        documentId:
                            userDoc.id
                    }
                );

            }

        });


        console.log(
            "👥 Unique accounts:",
            uniqueUsers.size
        );


        // ----------------------------------------------------
        // SEPARATE REGISTERED USERS AND ADMINS
        // ----------------------------------------------------

        const registeredUsers = [];

        const administrators = [];


        uniqueUsers.forEach((user) => {

            const role =
                String(
                    user.role || "user"
                )
                    .trim()
                    .toLowerCase();


            if (
                role === "admin" ||
                role === "administrator"
            ) {

                administrators.push(user);

            }

            else {

                registeredUsers.push(user);

            }

        });


        // ----------------------------------------------------
        // TOTAL USERS
        //
        // IMPORTANT:
        // Admin is NOT counted.
        // ----------------------------------------------------

        if (totalUsers) {

            totalUsers.textContent =
                registeredUsers.length;
        }


        console.log(
            "👤 Registered users:",
            registeredUsers.length
        );

        console.log(
            "🛡️ Administrators:",
            administrators.length
        );


        // ----------------------------------------------------
        // RENDER REGISTERED USERS
        // ----------------------------------------------------

        for (
            const user of registeredUsers
        ) {

            const card =
                await createUserCard(
                    user,
                    false
                );


            registeredUsersContainer.insertAdjacentHTML(
                "beforeend",
                card
            );

        }


        // ----------------------------------------------------
        // RENDER ADMINISTRATORS
        // ----------------------------------------------------

        for (
            const admin of administrators
        ) {

            const card =
                await createUserCard(
                    admin,
                    true
                );


            adminUsersContainer.insertAdjacentHTML(
                "beforeend",
                card
            );

        }


        // ----------------------------------------------------
        // EMPTY REGISTERED USERS
        // ----------------------------------------------------

        if (
            registeredUsers.length === 0
        ) {

            registeredUsersContainer.innerHTML = `

                <div class="empty-message">

                    <i class="fa-solid fa-users"></i>

                    <p>
                        No registered users found.
                    </p>

                </div>

            `;
        }


        // ----------------------------------------------------
        // EMPTY ADMINS
        // ----------------------------------------------------

        if (
            administrators.length === 0
        ) {

            adminUsersContainer.innerHTML = `

                <div class="empty-message">

                    <i class="fa-solid fa-shield-halved"></i>

                    <p>
                        No administrators found.
                    </p>

                </div>

            `;
        }


        console.log(
            "✅ Registered users displayed:",
            registeredUsers.length
        );

        console.log(
            "✅ Administrators displayed:",
            administrators.length
        );

    }

    catch (error) {

        console.error(
            "❌ Error loading users:",
            error
        );


        if (registeredUsersContainer) {

            registeredUsersContainer.innerHTML = `

                <div class="error-message">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                    <p>
                        Unable to load registered users.
                    </p>

                </div>

            `;
        }


        if (adminUsersContainer) {

            adminUsersContainer.innerHTML = `

                <div class="error-message">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                    <p>
                        Unable to load administrators.
                    </p>

                </div>

            `;
        }


        if (totalUsers) {

            totalUsers.textContent =
                "0";
        }

    }

    finally {

        usersLoading = false;

    }

}


// ============================================================
// GET VEHICLE FOR USER
// ============================================================

async function getVehicleNumber(user) {

    let vehicleNumber =
        user.vehicleNumber ||
        "N/A";


    try {

        let vehicleSnapshot =
            null;


        // ----------------------------------------------------
        // 1. SEARCH BY AUTH UID
        // ----------------------------------------------------

        if (user.uid) {

            const q1 =
                query(
                    collection(
                        db,
                        "vehicles"
                    ),

                    where(
                        "userId",
                        "==",
                        user.uid
                    )
                );


            vehicleSnapshot =
                await getDocs(q1);
        }


        // ----------------------------------------------------
        // 2. SEARCH BY USER DOCUMENT ID
        // ----------------------------------------------------

        if (
            (
                !vehicleSnapshot ||
                vehicleSnapshot.empty
            ) &&
            user.documentId
        ) {

            const q2 =
                query(
                    collection(
                        db,
                        "vehicles"
                    ),

                    where(
                        "userId",
                        "==",
                        user.documentId
                    )
                );


            vehicleSnapshot =
                await getDocs(q2);
        }


        // ----------------------------------------------------
        // 3. SEARCH BY EMAIL
        // ----------------------------------------------------

        if (
            (
                !vehicleSnapshot ||
                vehicleSnapshot.empty
            ) &&
            user.email
        ) {

            const q3 =
                query(
                    collection(
                        db,
                        "vehicles"
                    ),

                    where(
                        "ownerEmail",
                        "==",
                        user.email
                    )
                );


            vehicleSnapshot =
                await getDocs(q3);
        }


        // ----------------------------------------------------
        // VEHICLE FOUND
        // ----------------------------------------------------

        if (
            vehicleSnapshot &&
            !vehicleSnapshot.empty
        ) {

            const vehicle =
                vehicleSnapshot.docs[0].data();


            vehicleNumber =
                vehicle.vehicleNumber ||
                "N/A";


            console.log(
                "🚗 Vehicle found:",
                user.fullName,
                vehicleNumber
            );

        }

    }

    catch (error) {

        console.error(
            "❌ Vehicle lookup error:",
            error
        );

    }


    return vehicleNumber;
}


// ============================================================
// CREATE USER CARD
// ============================================================

async function createUserCard(
    user,
    isAdmin = false
) {

    const fullName =
        user.fullName ||
        user.name ||
        "Unknown User";


    const email =
        user.email ||
        "No email";


    const phone =
        user.phone ||
        "N/A";


    const doorNumber =
        user.doorNumber ||
        user.doorNo ||
        "N/A";


    const vehicleNumber =
        await getVehicleNumber(
            user
        );


    const avatarColor =
        isAdmin
            ? "#7C3AED"
            : "#2563EB";


    const roleClass =
        isAdmin
            ? "role-admin"
            : "role-user";


    const roleText =
        isAdmin
            ? "ADMIN"
            : "USER";


    return `

        <div class="user-card">

            <!-- USER HEADER -->

            <div class="user-top">

                <div
                    class="user-avatar"
                    style="background:${avatarColor};"
                >

                    <i class="fa-solid fa-user"></i>

                </div>


                <div>

                    <h3>
                        ${escapeHTML(fullName)}
                    </h3>

                    <p>
                        ${escapeHTML(email)}
                    </p>

                </div>

            </div>


            <!-- USER INFORMATION -->

            <div class="user-info">

                <p>
                    <strong>📞</strong>
                    ${escapeHTML(phone)}
                </p>


                <p>
                    <strong>🚗</strong>
                    ${escapeHTML(vehicleNumber)}
                </p>


                <p>
                    <strong>🏠</strong>
                    ${escapeHTML(doorNumber)}
                </p>

            </div>


            <!-- ROLE -->

            <span
                class="role-badge ${roleClass}"
            >
                ${roleText}
            </span>

        </div>

    `;
}


// ============================================================
// LOAD PARKING SLOTS
// ============================================================

async function loadSlots() {

    try {

        if (!slotsContainer) {

            console.error(
                "❌ #slotsContainer not found."
            );

            return;
        }


        slotsContainer.innerHTML = "";


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "slots"
                )
            );


        let available = 0;

        let occupied = 0;

        let reserved = 0;

        let maintenance = 0;


        // ----------------------------------------------------
        // RENDER SLOTS
        // ----------------------------------------------------

        snapshot.forEach((slotDoc) => {

            const slot =
                slotDoc.data();


            const status =
                String(
                    slot.status ||
                    "available"
                )
                    .toLowerCase();


            if (
                status === "available"
            ) {

                available++;

            }

            else if (
                status === "occupied"
            ) {

                occupied++;

            }

            else if (
                status === "reserved"
            ) {

                reserved++;

            }

            else if (
                status === "maintenance"
            ) {

                maintenance++;

            }


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "slot-card";


            card.innerHTML = `

                <div class="admin-slot-header">

                    <h3>
                        🅿 Slot
                        ${escapeHTML(
                            slot.slotNumber ||
                            slotDoc.id
                        )}
                    </h3>

                    <span
                        class="
                            status-badge
                            status-${escapeHTML(status)}
                        "
                    >
                        ${escapeHTML(
                            status.toUpperCase()
                        )}
                    </span>

                </div>


                <div class="admin-slot-body">

                    <p>

                        ${
                            status === "available"

                            ? "✅ Slot Available for Booking"

                            : status === "occupied"

                            ? "🚗 Currently Occupied"

                            : status === "reserved"

                            ? "🟡 Reserved"

                            : "🔧 Under Maintenance"

                        }

                    </p>

                </div>


                <div class="slot-actions">

                    <button
                        class="edit-btn"
                        data-id="${escapeHTML(
                            slotDoc.id
                        )}"
                        data-slot="${escapeHTML(
                            slot.slotNumber ||
                            slotDoc.id
                        )}"
                    >
                        ✏ Edit
                    </button>


                    <button
                        class="delete-btn"
                        data-id="${escapeHTML(
                            slotDoc.id
                        )}"
                        data-slot="${escapeHTML(
                            slot.slotNumber ||
                            slotDoc.id
                        )}"
                    >
                        🗑 Delete
                    </button>

                </div>

            `;


            slotsContainer.appendChild(
                card
            );

        });


        // ----------------------------------------------------
        // UPDATE STATISTICS
        // ----------------------------------------------------

        if (totalSlots) {

            totalSlots.textContent =
                snapshot.size;
        }


        if (availableSlots) {

            availableSlots.textContent =
                available;
        }


        if (occupiedSlots) {

            occupiedSlots.textContent =
                occupied;
        }


        console.log(
            "🅿 Slots loaded:",
            snapshot.size
        );


        console.log(
            "📊 Slot summary:",
            {
                available,
                occupied,
                reserved,
                maintenance
            }
        );


        attachSlotEvents();

    }

    catch (error) {

        console.error(
            "❌ Error loading slots:",
            error
        );

    }

}


// ============================================================
// SLOT EVENTS
// ============================================================

function attachSlotEvents() {


    // --------------------------------------------------------
    // EDIT
    // --------------------------------------------------------

    document
        .querySelectorAll(
            ".edit-btn"
        )
        .forEach((button) => {

            button.onclick = () => {

                editMode = true;


                oldSlotNumber =
                    button.dataset.slot;


                slotModalTitle.textContent =
                    "Edit Parking Slot";


                slotNumber.value =
                    button.dataset.slot;


                slotModal.style.display =
                    "flex";

            };

        });


    // --------------------------------------------------------
    // DELETE
    // --------------------------------------------------------

    document
        .querySelectorAll(
            ".delete-btn"
        )
        .forEach((button) => {

            button.onclick =
                async () => {

                    const slot =
                        button.dataset.slot;


                    if (
                        !confirm(
                            `Delete Slot ${slot}?`
                        )
                    ) {

                        return;
                    }


                    try {

                        // ----------------------------------------
                        // CHECK ACTIVE BOOKING
                        // ----------------------------------------

                        const bookingQuery =
                            query(
                                collection(
                                    db,
                                    "bookings"
                                ),

                                where(
                                    "slotNumber",
                                    "==",
                                    slot
                                ),

                                where(
                                    "status",
                                    "==",
                                    "active"
                                )
                            );


                        const bookingSnapshot =
                            await getDocs(
                                bookingQuery
                            );


                        if (
                            !bookingSnapshot.empty
                        ) {

                            alert(
                                "Cannot delete an active slot."
                            );

                            return;
                        }


                        // ----------------------------------------
                        // DELETE SLOT
                        // ----------------------------------------

                        await deleteDoc(
                            doc(
                                db,
                                "slots",
                                button.dataset.id
                            )
                        );


                        alert(
                            `Slot ${slot} deleted successfully.`
                        );


                        await loadSlots();

                    }

                    catch (error) {

                        console.error(
                            "❌ Slot deletion error:",
                            error
                        );


                        alert(
                            error.message
                        );

                    }

                };

        });

}


// ============================================================
// ADD SLOT
// ============================================================

if (addSlotBtn) {

    addSlotBtn.onclick = () => {

        editMode = false;

        oldSlotNumber = "";

        slotModalTitle.textContent =
            "Add Parking Slot";

        slotNumber.value = "";

        slotModal.style.display =
            "flex";

    };

}


// ============================================================
// CANCEL SLOT MODAL
// ============================================================

if (cancelSlotBtn) {

    cancelSlotBtn.onclick = () => {

        slotModal.style.display =
            "none";

    };

}


// ============================================================
// SAVE SLOT
// ============================================================

if (saveSlotBtn) {

    saveSlotBtn.onclick =
        async () => {

            const newSlot =
                slotNumber.value
                    .trim()
                    .toUpperCase();


            if (!newSlot) {

                alert(
                    "Please enter a slot number."
                );

                return;
            }


            try {

                // ------------------------------------------------
                // EDIT EXISTING SLOT
                // ------------------------------------------------

                if (editMode) {

                    if (
                        oldSlotNumber !==
                        newSlot
                    ) {

                        const existing =
                            await getDoc(
                                doc(
                                    db,
                                    "slots",
                                    newSlot
                                )
                            );


                        if (
                            existing.exists()
                        ) {

                            alert(
                                "Slot already exists."
                            );

                            return;
                        }


                        const oldDoc =
                            await getDoc(
                                doc(
                                    db,
                                    "slots",
                                    oldSlotNumber
                                )
                            );


                        if (
                            !oldDoc.exists()
                        ) {

                            alert(
                                "Original slot not found."
                            );

                            return;
                        }


                        const oldData =
                            oldDoc.data();


                        await setDoc(
                            doc(
                                db,
                                "slots",
                                newSlot
                            ),
                            {
                                slotNumber:
                                    newSlot,

                                status:
                                    oldData.status ||
                                    "available"
                            }
                        );


                        await deleteDoc(
                            doc(
                                db,
                                "slots",
                                oldSlotNumber
                            )
                        );

                    }


                    alert(
                        "Slot updated successfully."
                    );

                }

                // ------------------------------------------------
                // ADD NEW SLOT
                // ------------------------------------------------

                else {

                    const existing =
                        await getDoc(
                            doc(
                                db,
                                "slots",
                                newSlot
                            )
                        );


                    if (
                        existing.exists()
                    ) {

                        alert(
                            "Slot already exists."
                        );

                        return;
                    }


                    await setDoc(
                        doc(
                            db,
                            "slots",
                            newSlot
                        ),
                        {
                            slotNumber:
                                newSlot,

                            status:
                                "available"
                        }
                    );


                    alert(
                        "Slot added successfully."
                    );

                }


                editMode = false;

                oldSlotNumber = "";

                slotModal.style.display =
                    "none";

                slotNumber.value = "";


                await loadSlots();

            }

            catch (error) {

                console.error(
                    "❌ Save slot error:",
                    error
                );


                alert(
                    error.message
                );

            }

        };

}


// ============================================================
// CONVERT FIREBASE DATE
// ============================================================

// ============================================================
// CONVERT FIREBASE BOOKING DATE
// ============================================================

function getBookingDate(bookingTime) {

    if (!bookingTime) {
        return null;
    }

    // --------------------------------------------------------
    // FIRESTORE TIMESTAMP
    // --------------------------------------------------------

    if (
        typeof bookingTime.toDate === "function"
    ) {
        return bookingTime.toDate();
    }


    // --------------------------------------------------------
    // FIRESTORE TIMESTAMP OBJECT
    // --------------------------------------------------------

    if (
        bookingTime.seconds !== undefined
    ) {

        return new Date(
            Number(bookingTime.seconds) * 1000
        );
    }


    // --------------------------------------------------------
    // JAVASCRIPT DATE
    // --------------------------------------------------------

    if (
        bookingTime instanceof Date
    ) {
        return bookingTime;
    }


    // --------------------------------------------------------
    // NUMBER
    // --------------------------------------------------------

    if (
        typeof bookingTime === "number"
    ) {

        return new Date(bookingTime);
    }


    // --------------------------------------------------------
    // STRING
    // --------------------------------------------------------

    if (
        typeof bookingTime === "string"
    ) {

        const value =
            bookingTime.trim();


        // ----------------------------------------------------
        // FORMAT:
        // 17/8/2026, 7:07:48 pm
        // ----------------------------------------------------

        const match =
            value.match(
                /^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/i
            );


        if (match) {

            const day =
                Number(match[1]);

            const month =
                Number(match[2]) - 1;

            const year =
                Number(match[3]);

            let hour =
                Number(match[4]);

            const minute =
                Number(match[5]);

            const second =
                Number(match[6] || 0);

            const ampm =
                match[7]
                    ? match[7].toLowerCase()
                    : null;


            // ------------------------------------------------
            // CONVERT 12-HOUR TIME
            // ------------------------------------------------

            if (ampm === "pm" && hour < 12) {

                hour += 12;
            }


            if (ampm === "am" && hour === 12) {

                hour = 0;
            }


            const date =
                new Date(
                    year,
                    month,
                    day,
                    hour,
                    minute,
                    second
                );


            if (
                !isNaN(
                    date.getTime()
                )
            ) {

                return date;
            }
        }


        // ----------------------------------------------------
        // TRY NORMAL DATE FORMAT
        // ----------------------------------------------------

        const normalDate =
            new Date(value);


        if (
            !isNaN(
                normalDate.getTime()
            )
        ) {

            return normalDate;
        }
    }


    return null;
}

// ============================================================
// LOAD BOOKINGS
// ============================================================

// ============================================================
// LOAD BOOKINGS
// ============================================================

async function loadBookings() {

    try {

        if (!bookingsContainer) {

            console.error(
                "❌ #bookingsContainer not found."
            );

            return;
        }


        // ----------------------------------------------------
        // CLEAR OLD BOOKINGS
        // ----------------------------------------------------

        bookingsContainer.innerHTML = "";


        // ----------------------------------------------------
        // GET BOOKINGS
        // ----------------------------------------------------

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "bookings"
                )
            );


        if (totalBookings) {

            totalBookings.textContent =
                snapshot.size;
        }


        console.log(
            "📋 Total bookings:",
            snapshot.size
        );


        let activeBookings = 0;


        // ----------------------------------------------------
        // PROCESS BOOKINGS
        // ----------------------------------------------------

        for (
            const bookingDoc of snapshot.docs
        ) {

            const booking =
                bookingDoc.data();


            console.log(
                "📋 Booking:",
                bookingDoc.id,
                booking
            );


            // ------------------------------------------------
            // ONLY ACTIVE BOOKINGS
            // ------------------------------------------------

            const bookingStatus =
                String(
                    booking.status || ""
                )
                    .trim()
                    .toLowerCase();


            if (
                bookingStatus !== "active"
            ) {

                continue;
            }


            activeBookings++;


            // =================================================
            // FIND USER
            // =================================================

            let userName =
                booking.userName ||
                booking.fullName ||
                "Unknown User";


            let userFound =
                false;


            // ------------------------------------------------
            // 1. SEARCH USING USER ID
            // ------------------------------------------------

            if (
                booking.userId
            ) {

                try {

                    const userDoc =
                        await getDoc(
                            doc(
                                db,
                                "users",
                                booking.userId
                            )
                        );


                    if (
                        userDoc.exists()
                    ) {

                        const userData =
                            userDoc.data();


                        userName =
                            userData.fullName ||
                            userData.name ||
                            userData.email ||
                            "Unknown User";


                        userFound =
                            true;

                    }

                }

                catch (error) {

                    console.warn(
                        "⚠️ User ID lookup failed:",
                        error
                    );

                }

            }


            // ------------------------------------------------
            // 2. SEARCH USING EMAIL
            // ------------------------------------------------

            if (
                !userFound &&
                booking.email
            ) {

                try {

                    const userQuery =
                        query(
                            collection(
                                db,
                                "users"
                            ),

                            where(
                                "email",
                                "==",
                                booking.email
                            )
                        );


                    const userSnapshot =
                        await getDocs(
                            userQuery
                        );


                    if (
                        !userSnapshot.empty
                    ) {

                        const userData =
                            userSnapshot
                                .docs[0]
                                .data();


                        userName =
                            userData.fullName ||
                            userData.name ||
                            userData.email ||
                            "Unknown User";


                        userFound =
                            true;

                    }

                }

                catch (error) {

                    console.warn(
                        "⚠️ Email lookup failed:",
                        error
                    );

                }

            }


            // ------------------------------------------------
            // 3. SEARCH USING OWNER EMAIL
            // ------------------------------------------------

            if (
                !userFound &&
                booking.userEmail
            ) {

                try {

                    const userQuery =
                        query(
                            collection(
                                db,
                                "users"
                            ),

                            where(
                                "email",
                                "==",
                                booking.userEmail
                            )
                        );


                    const userSnapshot =
                        await getDocs(
                            userQuery
                        );


                    if (
                        !userSnapshot.empty
                    ) {

                        const userData =
                            userSnapshot
                                .docs[0]
                                .data();


                        userName =
                            userData.fullName ||
                            userData.name ||
                            userData.email ||
                            "Unknown User";


                        userFound =
                            true;

                    }

                }

                catch (error) {

                    console.warn(
                        "⚠️ userEmail lookup failed:",
                        error
                    );

                }

            }


            // =================================================
            // DATE & TIME
            // =================================================

            const date =
                getBookingDate(
                    booking.bookingTime
                );


            let bookingDate =
                "Unknown Date";


            let bookingTime =
                "Unknown Time";


            if (date) {

                bookingDate =
                    date.toLocaleDateString(
                        "en-IN",
                        {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                        }
                    );


                bookingTime =
                    date.toLocaleTimeString(
                        "en-IN",
                        {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true
                        }
                    );

            }


            // =================================================
            // LOG
            // =================================================

            console.log(
                "👤 Booking User:",
                userName
            );


            console.log(
                "📅 Booking Date:",
                bookingDate
            );


            console.log(
                "⏰ Booking Time:",
                bookingTime
            );


            // =================================================
            // CREATE BOOKING CARD
            // =================================================

            bookingsContainer.insertAdjacentHTML(
                "beforeend",
                `

                <div class="recent-booking">

                    <!-- LEFT -->

                    <div class="booking-left">

                        <div class="booking-icon">

                            <i
                                class="fa-solid fa-square-parking"
                            ></i>

                        </div>


                        <div>

                            <h3>
                                ${escapeHTML(
                                    userName
                                )}
                            </h3>


                            <span>
                                Slot
                                ${escapeHTML(
                                    booking.slotNumber ||
                                    "N/A"
                                )}
                            </span>

                        </div>

                    </div>


                    <!-- MIDDLE -->

                    <div class="booking-middle">

                        <strong>
                            ${escapeHTML(
                                bookingDate
                            )}
                        </strong>


                        <span>
                            ${escapeHTML(
                                bookingTime
                            )}
                        </span>

                    </div>


                    <!-- RIGHT -->

                    <div class="booking-right">

                        <span
                            class="
                                status-badge
                                status-active
                            "
                        >
                            ACTIVE
                        </span>

                    </div>

                </div>

                `
            );

        }


        // ----------------------------------------------------
        // NO ACTIVE BOOKINGS
        // ----------------------------------------------------

        if (
            activeBookings === 0
        ) {

            bookingsContainer.innerHTML = `

                <p class="empty-message">

                    No active bookings found.

                </p>

            `;
        }


        console.log(
            "📋 Active bookings:",
            activeBookings
        );

    }

    catch (error) {

        console.error(
            "❌ Error loading bookings:",
            error
        );


        bookingsContainer.innerHTML = `

            <p class="error-message">

                Unable to load bookings.

            </p>

        `;

    }

}


// ============================================================
// HISTORY BUTTON
// ============================================================

if (historyBtn) {

    historyBtn.addEventListener(
        "click",
        () => {

            window.location.href =
                "booking-history.html";

        }
    );

}


// ============================================================
// LOGOUT
// ============================================================

if (logoutBtn) {

    logoutBtn.onclick =
        async () => {

            try {

                await signOut(auth);


                window.location.href =
                    "login.html";

            }

            catch (error) {

                console.error(
                    "❌ Logout error:",
                    error
                );

                alert(
                    error.message
                );

            }

        };

}


// ============================================================
// DEBUG notific
// ============================================================

console.log(
    "🚀 admin.js loaded successfully."
);

// =====================================================
// SMARTPARK ADMIN SUPPORT NOTIFICATION LISTENER
// =====================================================
function startSupportNotificationListener() {

    console.log(
        "🔔 Starting SmartPark support notification listener..."
    );

    const notificationBtn =
        document.getElementById("notificationBtn");

    const notificationPanel =
        document.getElementById("notificationPanel");

    const notificationList =
        document.getElementById("notificationList");

    const notificationCount =
        document.getElementById("notificationCount");

    const closeNotificationBtn =
        document.getElementById("closeNotificationBtn");


    // =================================================
    // CHECK ELEMENTS
    // =================================================

    if (!notificationBtn) {
        console.error("❌ notificationBtn not found.");
        return;
    }

    if (!notificationPanel) {
        console.error("❌ notificationPanel not found.");
        return;
    }

    if (!notificationList) {
        console.error("❌ notificationList not found.");
        return;
    }

    if (!notificationCount) {
        console.error("❌ notificationCount not found.");
        return;
    }


    // =================================================
    // FIRESTORE SUPPORT MESSAGE LISTENER
    // =================================================

    const supportRef =
        collection(db, "supportMessages");


    onSnapshot(
        supportRef,

        (snapshot) => {

            console.log(
                "📩 Support messages:",
                snapshot.size
            );


            const unreadMessages = [];


            snapshot.forEach((supportDoc) => {

    const data = supportDoc.data();

    console.log(
        "📄 SUPPORT DOCUMENT:",
        supportDoc.id,
        data
    );

    console.log(
        "👤 Sender fields:",
        {
            lastSender: data.lastSender,
            senderRole: data.senderRole,
            senderType: data.senderType,
            sender: data.sender,
            role: data.role,
            readByAdmin: data.readByAdmin
        }
    );

    const isUserMessage =
        data.lastSender === "user" ||
        data.senderRole === "user" ||
        data.senderType === "user" ||
        data.sender === "user" ||
        data.role === "user";

    const isUnread =
        data.readByAdmin !== true;

    console.log(
        "🔎 Notification check:",
        {
            isUserMessage,
            isUnread,
            shouldNotify:
                isUserMessage && isUnread
        }
    );

    if (
        isUserMessage &&
        isUnread
    ) {

        unreadMessages.push({
            id: supportDoc.id,
            ...data
        });

    }

});


            console.log(
                "🔔 Unread support messages:",
                unreadMessages.length
            );


            // =================================================
            // UPDATE BELL COUNT
            // =================================================

            if (unreadMessages.length > 0) {

                notificationCount.textContent =
                    unreadMessages.length;

                notificationCount.style.display =
                    "flex";

            } else {

                notificationCount.textContent =
                    "0";

                notificationCount.style.display =
                    "none";

            }


            // =================================================
            // CLEAR OLD NOTIFICATIONS
            // =================================================

            notificationList.innerHTML = "";


            // =================================================
            // NO NOTIFICATIONS
            // =================================================

            if (unreadMessages.length === 0) {

                notificationList.innerHTML = `

                    <div class="no-notifications">

                        <i class="fa-regular fa-bell-slash"></i>

                        <p>
                            No new notifications.
                        </p>

                        <small>
                            New user support requests will appear here.
                        </small>

                    </div>

                `;

                return;
            }


            // =================================================
            // CREATE NOTIFICATIONS
            // =================================================

            unreadMessages.forEach((support) => {

                const notification =
                    document.createElement("div");


                notification.className =
                    "notification-item";


                notification.dataset.requestId =
                    support.id;


                notification.innerHTML = `

                    <div class="notification-icon">

                        <i class="fa-solid fa-headset"></i>

                    </div>


                    <div class="notification-content">

                        <strong>
                            ${
                                support.fullName ||
                                support.userName ||
                                "User"
                            }
                        </strong>


                        <span>
                            ${
                                support.subject ||
                                "Support request"
                            }
                        </span>


                        <small>
                            ${
                                support.lastMessage ||
                                support.message ||
                                "New message from user"
                            }
                        </small>

                    </div>

                `;


                // =================================================
                // CLICK NOTIFICATION
                // =================================================

                notification.addEventListener(
                    "click",
                    async (event) => {

                        event.stopPropagation();


                        const requestId =
                            support.id;


                        console.log(
                            "💬 Opening support conversation:",
                            requestId
                        );


                        try {

                            // -----------------------------------------
                            // MARK MESSAGE AS READ
                            // -----------------------------------------

                            await updateDoc(
                                doc(
                                    db,
                                    "supportMessages",
                                    requestId
                                ),
                                {
                                    readByAdmin: true
                                }
                            );


                            console.log(
                                "✅ Support request marked as read."
                            );


                            // -----------------------------------------
                            // OPEN SUPPORT CONVERSATION
                            // -----------------------------------------

                           // ================================================
// OPEN SUPPORT CONVERSATION
// ================================================

try {

    // Store the selected support request
    localStorage.setItem(
        "activeSupportRequestId",
        requestId
    );

    // Open the admin support page
    window.location.href = "admin-support.html";

} catch (error) {

    console.error(
        "❌ Failed to open support conversation:",
        error
    );

}

                        } catch (error) {

                            console.error(
                                "❌ Failed to open support conversation:",
                                error
                            );

                        }

                    }
                );


                notificationList.appendChild(
                    notification
                );

            });

        },


        // =================================================
        // FIRESTORE ERROR
        // =================================================

        (error) => {

            console.error(
                "❌ Support notification listener failed:",
                error
            );

        }
    );


    // =================================================
    // OPEN / CLOSE NOTIFICATION PANEL
    // =================================================

    notificationBtn.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();


            notificationPanel.classList.toggle(
                "show"
            );


            console.log(
                "🔔 Notification panel:",
                notificationPanel.classList.contains("show")
            );

        }
    );




    // =================================================
    // CLOSE WHEN CLICKING OUTSIDE
    // =================================================

    document.addEventListener(
        "click",
        (event) => {

            if (
                !notificationPanel.contains(event.target) &&
                !notificationBtn.contains(event.target)
            ) {

                notificationPanel.classList.remove(
                    "show"
                );

            }

        }
    );


    console.log(
        "✅ SmartPark support notification listener started."
    );
}

// ============================================================
// UPDATE NOTIFICATION BADGE
// ============================================================

function updateSupportNotificationBadge(
    count
) {

    if (!notificationCount) {
        return;
    }


    if (count > 0) {

        notificationCount.textContent =
            count > 99
                ? "99+"
                : count;


        notificationCount.style.display =
            "flex";


        // Small visual animation

        notificationCount.classList.remove(
            "notification-pulse"
        );


        void notificationCount.offsetWidth;


        notificationCount.classList.add(
            "notification-pulse"
        );

    }

    else {

        notificationCount.style.display =
            "none";

    }

}


// ============================================================
// RENDER NOTIFICATIONS
// ============================================================

function renderSupportNotificationList(
    messages
) {

    if (!notificationList) {
        return;
    }


    // --------------------------------------------------------
    // NO NEW REQUESTS
    // --------------------------------------------------------

    if (!messages.length) {

        notificationList.innerHTML = `

            <div class="notification-empty">

                <i class="fa-regular fa-bell-slash"></i>

                <p>
                    No new notifications
                </p>

                <span>
                    New user support requests
                    will appear here.
                </span>

            </div>

        `;

        return;

    }


    // --------------------------------------------------------
    // RENDER
    // --------------------------------------------------------

    notificationList.innerHTML = "";


    messages
        .slice(0, 20)
        .forEach(
            (message) => {

                const item =
                    document.createElement(
                        "button"
                    );


                item.type =
                    "button";


                item.className =
                    "support-notification-item";


                const userName =
                    message.userName ||
                    message.fullName ||
                    message.name ||
                    "SmartPark User";


                const category =
                    message.category ||
                    "General Support";


                const subject =
                    message.subject ||
                    "New support request";


                const messageText =
                    message.message ||
                    message.text ||
                    "A user needs assistance.";


                item.innerHTML = `

                    <div class="support-notification-icon">

                        <i class="fa-solid fa-headset"></i>

                    </div>


                    <div class="support-notification-body">

                        <strong>
                            New Support Request
                        </strong>

                        <span class="support-notification-user">
                            ${escapeHTML(userName)}
                        </span>

                        <span class="support-notification-category">
                            ${escapeHTML(category)}
                        </span>

                        <p>
                            ${escapeHTML(subject)}
                        </p>

                        <small>
                            ${escapeHTML(
                                messageText.length > 100
                                    ? messageText.substring(
                                        0,
                                        100
                                    ) + "..."
                                    : messageText
                            )}
                        </small>

                    </div>

                `;


                // ------------------------------------------------
                // CLICK
                // ------------------------------------------------

                item.addEventListener(
    "click",
    () => {

        console.log(
            "💬 Support request selected:",
            message.id
        );


        // Close notification dropdown

        notificationPanel?.classList.remove(
            "show"
        );


        // Open conversation

        openSupportConversation(
            message
        );

    }
);

                notificationList.appendChild(
                    item
                );

            }
        );

}


// ============================================================
// START REAL-TIME SUPPORT LISTENER
// ============================================================

startSupportNotificationListener();
// ============================================================
// ADMIN SUPPORT CONVERSATION
// ============================================================

let activeSupportRequestId = null;

let activeSupportRepliesUnsubscribe = null;


// DOM elements

const supportConversationModal =
    document.getElementById(
        "supportConversationModal"
    );


const closeSupportConversationBtn =
    document.getElementById(
        "closeSupportConversationBtn"
    );


const supportConversationUser =
    document.getElementById(
        "supportConversationUser"
    );


const supportConversationDetails =
    document.getElementById(
        "supportConversationDetails"
    );


const supportRequestCategory =
    document.getElementById(
        "supportRequestCategory"
    );


const supportRequestSubject =
    document.getElementById(
        "supportRequestSubject"
    );


const supportRequestStatus =
    document.getElementById(
        "supportRequestStatus"
    );


const supportOriginalMessage =
    document.getElementById(
        "supportOriginalMessage"
    );


const supportOriginalTime =
    document.getElementById(
        "supportOriginalTime"
    );


const supportConversationMessages =
    document.getElementById(
        "supportConversationMessages"
    );


const supportReplyInput =
    document.getElementById(
        "supportReplyInput"
    );


const sendSupportReplyBtn =
    document.getElementById(
        "sendSupportReplyBtn"
    );


const markSupportResolvedBtn =
    document.getElementById(
        "markSupportResolvedBtn"
    );


// ============================================================
// OPEN SUPPORT CONVERSATION
// ============================================================

async function openSupportConversation(
    supportMessage
) {

    if (!supportConversationModal) {

        console.error(
            "❌ Support conversation modal not found."
        );

        return;

    }


    activeSupportRequestId =
        supportMessage.id;


    console.log(
        "💬 Opening support conversation:",
        activeSupportRequestId
    );


    // --------------------------------------------------------
    // USER INFORMATION
    // --------------------------------------------------------

    const userName =
        supportMessage.userName ||
        supportMessage.fullName ||
        supportMessage.name ||
        "SmartPark User";


    const doorNumber =
        supportMessage.doorNumber ||
        supportMessage.door ||
        "N/A";


    const vehicleNumber =
        supportMessage.vehicleNumber ||
        supportMessage.vehicle ||
        "N/A";


    const category =
        supportMessage.category ||
        "General Support";


    const subject =
        supportMessage.subject ||
        "Support Request";


    const messageText =
        supportMessage.message ||
        supportMessage.text ||
        "No message provided.";


    supportConversationUser.textContent =
        userName;


    supportConversationDetails.textContent =
        `Door ${doorNumber} • Vehicle ${vehicleNumber}`;


    supportRequestCategory.textContent =
        category;


    supportRequestSubject.textContent =
        subject;


    supportOriginalMessage.textContent =
        messageText;


    supportOriginalTime.textContent =
        formatSupportTime(
            supportMessage.createdAt ||
            supportMessage.timestamp
        );


    // --------------------------------------------------------
    // STATUS
    // --------------------------------------------------------

    updateSupportStatus(
        supportMessage.status ||
        "pending"
    );


    // --------------------------------------------------------
    // SHOW MODAL
    // --------------------------------------------------------

    supportConversationModal.classList.add(
        "show"
    );


    document.body.style.overflow =
        "hidden";


    // --------------------------------------------------------
    // CLEAR REPLY
    // --------------------------------------------------------

    supportReplyInput.value = "";


    // --------------------------------------------------------
    // LOAD REPLIES
    // --------------------------------------------------------

    startSupportRepliesListener(
        activeSupportRequestId
    );


    // --------------------------------------------------------
    // MARK AS READ
    // --------------------------------------------------------

    try {

        await updateDoc(

            doc(
                db,
                "supportMessages",
                activeSupportRequestId
            ),

            {
                readByAdmin: true,
                adminRead: true
            }

        );

        console.log(
            "✅ Support request marked as read."
        );

    }

    catch (error) {

        console.warn(
            "⚠️ Could not mark support request as read:",
            error
        );

    }

}


// ============================================================
// CLOSE SUPPORT CONVERSATION
// ============================================================

function closeSupportConversation() {

    supportConversationModal?.classList.remove(
        "show"
    );


    document.body.style.overflow =
        "";


    activeSupportRequestId =
        null;


    if (
        activeSupportRepliesUnsubscribe
    ) {

        activeSupportRepliesUnsubscribe();

        activeSupportRepliesUnsubscribe =
            null;

    }

}


if (closeSupportConversationBtn) {

    closeSupportConversationBtn.addEventListener(
        "click",
        closeSupportConversation
    );

}


if (supportConversationModal) {

    supportConversationModal.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                supportConversationModal
            ) {

                closeSupportConversation();

            }

        }
    );

}


// ============================================================
// REAL-TIME REPLY LISTENER
// ============================================================

function startSupportRepliesListener(
    requestId
) {

    if (
        activeSupportRepliesUnsubscribe
    ) {

        activeSupportRepliesUnsubscribe();

        activeSupportRepliesUnsubscribe =
            null;

    }


    supportConversationMessages.innerHTML = `

        <div class="support-loading">

            <i class="fa-solid fa-spinner fa-spin"></i>

            Loading conversation...

        </div>

    `;


    const repliesRef =
        collection(
            db,
            "supportMessages",
            requestId,
            "replies"
        );


    const repliesQuery =
        query(
            repliesRef,
            orderBy(
                "createdAt",
                "asc"
            )
        );


    activeSupportRepliesUnsubscribe =
        onSnapshot(

            repliesQuery,

            (snapshot) => {

                renderSupportReplies(
                    snapshot
                );

            },

            (error) => {

                console.error(
                    "❌ Reply listener failed:",
                    error
                );


                supportConversationMessages.innerHTML = `

                    <div class="support-loading">

                        Unable to load conversation.

                    </div>

                `;

            }

        );

}


// ============================================================
// RENDER REPLIES
// ============================================================

function renderSupportReplies(
    snapshot
) {

    if (
        !snapshot.docs.length
    ) {

        supportConversationMessages.innerHTML = `

            <div class="support-loading">

                No replies yet.

                <br>

                Send a reply to start the conversation.

            </div>

        `;

        return;

    }


    supportConversationMessages.innerHTML =
        "";


    snapshot.forEach(
        (replyDoc) => {

            const reply =
                replyDoc.data();


            const senderRole =
                String(
                    reply.senderRole ||
                    reply.senderType ||
                    ""
                )
                .toLowerCase();


            const isAdmin =
                senderRole === "admin" ||
                senderRole === "administrator";


            const message =
                reply.message ||
                reply.text ||
                "";


            const senderName =
                isAdmin
                    ? "Administrator"
                    : (
                        reply.senderName ||
                        "User"
                    );


            const time =
                formatSupportTime(
                    reply.createdAt
                );


            const messageElement =
                document.createElement(
                    "div"
                );


            messageElement.className =
                `support-message ${
                    isAdmin
                        ? "admin"
                        : "user"
                }`;


            messageElement.innerHTML = `

                <div class="support-message-sender">

                    ${escapeHTML(senderName)}

                </div>


                <div class="support-message-text">

                    ${escapeHTML(message)}

                </div>


                <div class="support-message-time-small">

                    ${escapeHTML(time)}

                </div>

            `;


            supportConversationMessages.appendChild(
                messageElement
            );

        }
    );


    // Scroll to latest message

    supportConversationMessages.scrollTop =
        supportConversationMessages.scrollHeight;

}


// ============================================================
// SEND ADMIN REPLY
// ============================================================

async function sendSupportReply() {

    // ============================================================
    // CHECK ACTIVE SUPPORT REQUEST
    // ============================================================

    if (!activeSupportRequestId) {
        console.error("❌ No active support request selected.");
        return;
    }

    // ============================================================
    // GET MESSAGE
    // ============================================================

    const message = supportReplyInput.value.trim();

    if (!message) {
        supportReplyInput.focus();
        return;
    }

    // ============================================================
    // DISABLE SEND BUTTON
    // ============================================================

    sendSupportReplyBtn.disabled = true;

    sendSupportReplyBtn.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Sending...
    `;

    try {

        console.log(
            "📤 Sending admin reply to:",
            activeSupportRequestId
        );

        // ========================================================
        // 1. ADD ADMIN REPLY TO REPLIES SUBCOLLECTION
        // ========================================================

        const repliesRef = collection(
            db,
            "supportMessages",
            activeSupportRequestId,
            "replies"
        );

        await addDoc(
            repliesRef,
            {
                message: message,

                senderRole: "admin",

                senderType: "admin",

                senderName: "Administrator",

                createdAt: serverTimestamp()
            }
        );

        console.log("✅ Admin reply added to replies.");

        // ========================================================
        // 2. UPDATE PARENT SUPPORT DOCUMENT
        // ========================================================

        const supportDocRef = doc(
            db,
            "supportMessages",
            activeSupportRequestId
        );

        await updateDoc(
            supportDocRef,
            {
                status: "in-progress",

                lastMessage: message,

                lastSender: "admin",

                senderRole: "admin",

                senderType: "admin",

                lastMessageAt: serverTimestamp(),

                // Admin has already read the conversation
                readByAdmin: true
            }
        );

        console.log(
            "✅ Support document updated successfully."
        );

        // ========================================================
        // 3. CLEAR INPUT
        // ========================================================

        supportReplyInput.value = "";

        // ========================================================
        // 4. UPDATE UI STATUS
        // ========================================================

        if (
            typeof updateSupportStatus === "function"
        ) {

            updateSupportStatus("in-progress");

        }

        // ========================================================
        // 5. RELOAD / REFRESH CONVERSATION IF AVAILABLE
        // ========================================================

        if (
            typeof loadSupportConversation === "function"
        ) {

            await loadSupportConversation(
                activeSupportRequestId
            );

        }

        console.log(
            "✅ Admin reply sent successfully."
        );

    } catch (error) {

        console.error(
            "❌ FAILED TO SEND ADMIN REPLY"
        );

        console.error(
            "Error object:",
            error
        );

        console.error(
            "Error code:",
            error?.code
        );

        console.error(
            "Error message:",
            error?.message
        );

        alert(
            "Unable to send the reply.\n\n" +
            "Code: " +
            (error?.code || "unknown") +
            "\nMessage: " +
            (error?.message || "unknown")
        );

    } finally {

        // ========================================================
        // ENABLE SEND BUTTON AGAIN
        // ========================================================

        sendSupportReplyBtn.disabled = false;

        sendSupportReplyBtn.innerHTML = `
            <i class="fa-solid fa-paper-plane"></i>
            Send Reply
        `;
    }
}

// ============================================================
// ENTER TO SEND
// ============================================================

if (supportReplyInput) {

    supportReplyInput.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendSupportReply();

            }

        }
    );

}


// ============================================================
// MARK REQUEST RESOLVED
// ============================================================

async function markSupportResolved() {

    if (
        !activeSupportRequestId
    ) {

        return;

    }


    try {

        await updateDoc(

            doc(
                db,
                "supportMessages",
                activeSupportRequestId
            ),

            {

                status:
                    "resolved",

                resolvedAt:
                    serverTimestamp(),

                resolvedBy:
                    "admin"

            }

        );


        updateSupportStatus(
            "resolved"
        );


        console.log(
            "✅ Support request resolved."
        );

    }

    catch (error) {

        console.error(
            "❌ Failed to resolve support request:",
            error
        );


        alert(
            "Unable to resolve this request."
        );

    }

}


if (markSupportResolvedBtn) {

    markSupportResolvedBtn.addEventListener(
        "click",
        markSupportResolved
    );

}


// ============================================================
// UPDATE STATUS UI
// ============================================================

function updateSupportStatus(
    status
) {

    if (!supportRequestStatus) {
        return;
    }


    const normalized =
        String(status)
            .toLowerCase();


    supportRequestStatus.className =
        "support-status";


    if (
        normalized === "resolved"
    ) {

        supportRequestStatus.textContent =
            "Resolved";


        supportRequestStatus.classList.add(
            "resolved"
        );

    }

    else if (
        normalized === "in-progress" ||
        normalized === "in_progress" ||
        normalized === "progress"
    ) {

        supportRequestStatus.textContent =
            "In Progress";


        supportRequestStatus.classList.add(
            "progress"
        );

    }

    else {

        supportRequestStatus.textContent =
            "Pending";


        supportRequestStatus.classList.add(
            "pending"
        );

    }

}


// ============================================================
// FORMAT TIME
// ============================================================

function formatSupportTime(
    timestamp
) {

    if (!timestamp) {

        return "";

    }


    try {

        const date =
            timestamp.toDate
                ? timestamp.toDate()
                : new Date(timestamp);


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

    catch {

        return "";

    }

}