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
// ===============================
// HTML ELEMENTS
// ===============================

const welcome = document.getElementById("welcome");

const name = document.getElementById("name");
const email = document.getElementById("email");
const phone = document.getElementById("phone");
const vehicle = document.getElementById("vehicle");
const vehiclesContainer = document.getElementById("vehiclesContainer");

const newVehicleNumber =
    document.getElementById(
        "newVehicleNumber"
    );

const newVehicleImage =
    document.getElementById(
        "newVehicleImage"
    );

const newVehicleType =
    document.getElementById(
        "newVehicleType"
    );

const newVehicleBrand =
    document.getElementById(
        "newVehicleBrand"
    );

const newVehicleModel =
    document.getElementById(
        "newVehicleModel"
    );

const newVehicleColor =
    document.getElementById(
        "newVehicleColor"
    );

const addVehicleBtn =
    document.getElementById(
        "addVehicleBtn"
    );
const role = document.getElementById("role");
const door = document.getElementById("door");
const slotsContainer = document.getElementById("slotsContainer");
const bookingContainer = document.getElementById("bookingContainer");
const historyContainer = document.getElementById("historyContainer");
const editProfileBtn = document.getElementById("editProfileBtn");
const visitorName = document.getElementById("visitorName");
const visitorPhone = document.getElementById("visitorPhone");
const visitorVehicle = document.getElementById("visitorVehicle");
const visitorPurpose = document.getElementById("visitorPurpose");
const visitorSlot = document.getElementById("visitorSlot");
const visitDate = document.getElementById("visitDate");
const arrivalTime = document.getElementById("arrivalTime");
const registerVisitorBtn =
document.getElementById("registerVisitorBtn");
const editModal = document.getElementById("editModal");
const editName = document.getElementById("editName");
const editPhone = document.getElementById("editPhone");
const editVehicle = document.getElementById("editVehicle");
const editDoor = document.getElementById("editDoor");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const closeModal = document.getElementById("closeModal");
const logoutBtn = document.getElementById("logoutBtn");
// ============================================================
// CONTACT ADMIN / SUPPORT
// ============================================================

const contactAdminBtn =
    document.getElementById("contactAdminBtn");

const supportModal =
    document.getElementById("supportModal");

const closeSupportModal =
    document.getElementById("closeSupportModal");

const cancelSupportBtn =
    document.getElementById("cancelSupportBtn");

const sendSupportMessageBtn =
    document.getElementById("sendSupportMessageBtn");

const supportCategory =
    document.getElementById("supportCategory");

const supportSubject =
    document.getElementById("supportSubject");

const supportMessage =
    document.getElementById("supportMessage");

// ============================================================
// OPEN SUPPORT MODAL
// ============================================================

if (contactAdminBtn) {

    contactAdminBtn.addEventListener("click", () => {

        supportModal.style.display = "flex";

    });

}


// ============================================================
// CLOSE SUPPORT MODAL
// ============================================================

function closeSupportForm() {

    supportModal.style.display = "none";

}


if (closeSupportModal) {

    closeSupportModal.addEventListener(
        "click",
        closeSupportForm
    );

}


if (cancelSupportBtn) {

    cancelSupportBtn.addEventListener(
        "click",
        closeSupportForm
    );

}


// Click outside modal

if (supportModal) {

    supportModal.addEventListener(
        "click",
        (event) => {

            if (event.target === supportModal) {

                closeSupportForm();

            }

        }
    );

}
// ============================================================
// SEND SUPPORT MESSAGE
// ============================================================

if (sendSupportMessageBtn) {

    sendSupportMessageBtn.addEventListener(
        "click",
        async () => {

            if (!currentUser || !auth.currentUser) {

                showToast(
                    "Please login before contacting admin.",
                    "error"
                );

                return;

            }


            const category =
                supportCategory.value.trim();

            const subject =
                supportSubject.value.trim();

            const message =
                supportMessage.value.trim();


            // ----------------------------------------
            // VALIDATION
            // ----------------------------------------

            if (!category) {

                showToast(
                    "Please select a problem category.",
                    "error"
                );

                supportCategory.focus();

                return;

            }


            if (!subject) {

                showToast(
                    "Please enter a subject.",
                    "error"
                );

                supportSubject.focus();

                return;

            }


            if (!message) {

                showToast(
                    "Please describe your problem.",
                    "error"
                );

                supportMessage.focus();

                return;

            }


            // ----------------------------------------
            // DISABLE BUTTON
            // ----------------------------------------

            sendSupportMessageBtn.disabled = true;

            sendSupportMessageBtn.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Sending...
            `;


            try {

                // ----------------------------------------
                // SAVE TO FIRESTORE
                // ----------------------------------------

                await addDoc(
    collection(
        db,
        "supportMessages"
    ),
    {

        userId:
            currentUser.uid,

        userName:
            currentUser.fullName ||
            "User",

        userEmail:
            currentUser.email ||
            auth.currentUser.email ||
            "",

        phone:
            currentUser.phone ||
            "",

        doorNumber:
            currentUser.doorNumber ||
            "N/A",

        category:
            category,

        subject:
            subject,

        message:
            message,

        // IMPORTANT: identify this as a USER message
        senderRole:
            "user",

        senderType:
            "user",

        senderName:
            currentUser.fullName ||
            "User",

        // IMPORTANT: admin has NOT read this yet
        readByAdmin:
            false,

        status:
            "open",

        adminReply:
            "",

        createdAt:
            serverTimestamp(),

        updatedAt:
            serverTimestamp()

    }
);


                console.log(
                    "✅ Support request submitted successfully."
                );


                // ----------------------------------------
                // CLEAR FORM
                // ----------------------------------------

                supportCategory.value = "";

                supportSubject.value = "";

                supportMessage.value = "";


                // ----------------------------------------
                // CLOSE MODAL
                // ----------------------------------------

                closeSupportForm();


                // ----------------------------------------
                // SUCCESS MESSAGE
                // ----------------------------------------

                showToast(
                    "Your message has been sent to the admin.",
                    "success"
                );

            }


            catch (error) {

                console.error(
                    "❌ Support request failed:",
                    error
                );


                showToast(
                    error.message ||
                    "Unable to send your message.",
                    "error"
                );

            }


            finally {

                sendSupportMessageBtn.disabled = false;

                sendSupportMessageBtn.innerHTML = `
                    <i class="fa-solid fa-paper-plane"></i>
                    Send Message
                `;

            }

        }
    );

}

let currentUser = null;
// ===============================
// AUTHENTICATION
// ===============================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        location.href = "login.html";

        return;

    }


    const userSnap = await getDoc(doc(db, "users", user.uid));

    if (!userSnap.exists()) {

        showToast("User not found.", "error");

        location.href = "login.html";

        return;

    }

    const userData = userSnap.data();
    currentUser = {
    uid: user.uid,
    ...userData
};
    startSupportNotificationListener();
    welcome.textContent = `Welcome, ${userData.fullName}!`;

    name.textContent = userData.fullName;
    email.textContent = userData.email;
    phone.textContent = userData.phone;
    // Load vehicle for Profile Overview
const vehicleQuery = query(
    collection(db, "vehicles"),
    where("userId", "==", user.uid)
);

const vehicleSnapshot = await getDocs(vehicleQuery);

if (!vehicleSnapshot.empty) {

    const vehicleData =
        vehicleSnapshot.docs[0].data();

    vehicle.textContent =
        vehicleData.vehicleNumber || "N/A";

} else {

    vehicle.textContent = "N/A";

}
    door.textContent = userData.doorNumber || "N/A";
    role.textContent = userData.role;
    await migrateOldVehicle();

    initialize();

});
// ============================================================
// MIGRATE OLD VEHICLE TO VEHICLES COLLECTION
// ============================================================

async function migrateOldVehicle() {

    if (!currentUser) {
        return;
    }


    // If the resident has no old vehicle, nothing to migrate
    if (!currentUser.vehicleNumber) {
        return;
    }


    const oldVehicleNumber =
        currentUser.vehicleNumber
            .trim()
            .toUpperCase();


    if (!oldVehicleNumber) {
        return;
    }


    try {

        // Check whether this vehicle already exists
        // in the new vehicles collection

        const vehicleQuery =
            query(
                collection(db, "vehicles"),
                where(
                    "userId",
                    "==",
                    currentUser.uid
                ),
                where(
                    "vehicleNumber",
                    "==",
                    oldVehicleNumber
                )
            );


        const snapshot =
            await getDocs(vehicleQuery);


        // Already migrated
        if (!snapshot.empty) {

            console.log(
                "🚗 Vehicle already exists:",
                oldVehicleNumber
            );

            return;

        }


        // Create the new vehicle document

        await addDoc(
            collection(db, "vehicles"),
            {

                userId:
                    currentUser.uid,

                ownerName:
                    currentUser.fullName,

                vehicleNumber:
                    oldVehicleNumber,

                vehicleType:
                    "bike", 

                status:
                    "active",

                createdAt:
                    serverTimestamp()

            }
        );


        console.log(
            "✅ Old vehicle migrated:",
            oldVehicleNumber
        );

    }

    catch (error) {

        console.error(
            "❌ Vehicle migration failed:",
            error
        );

    }

}
// ===============================
// INITIALIZE
// ===============================


// ===============================
// EDIT PROFILE
// ===============================

editProfileBtn.onclick = async () => {

    const userSnap = await getDoc(doc(db, "users", currentUser.uid));

    const userData = userSnap.data();

    editName.value = userData.fullName;
    editPhone.value = userData.phone;
    editVehicle.value = userData.vehicleNumber;
    editDoor.value = userData.doorNumber || "";

    editModal.style.display = "flex";

};
closeModal.onclick = () => {

    editModal.style.display = "none";

};

saveProfileBtn.onclick = async () => {

    await updateDoc(

    doc(db,"users",currentUser.uid),

    {

        fullName: editName.value,

        phone: editPhone.value,

        vehicleNumber: editVehicle.value,

        doorNumber: editDoor.value.trim()

    }

);

    showToast("Profile updated successfully!", "success");

    location.reload();

};
// ===============================
// LOAD PARKING SLOTS
// ===============================
async function loadSlots() {

    slotsContainer.innerHTML = "";

    const snapshot =
        await getDocs(
            collection(db, "slots")
        );

    let available = 0;
    let occupied = 0;


    snapshot.forEach(slotDoc => {

        const slot =
            slotDoc.data();


        if (
            slot.status === "available"
        ) {

            available++;

        } else {

            occupied++;

        }


        const card =
            document.createElement("div");


        card.className =
            "slot-card";


        card.innerHTML = `

            <div class="slot-header">

                <h3>

                    <i
                        class="fa-solid fa-square-parking">
                    </i>

                    Slot ${slot.slotNumber}

                </h3>


                <span
                    class="slot-status ${slot.status}">

                    ${slot.status.toUpperCase()}

                </span>

            </div>


            <div class="slot-body">

                <p>

                    ${
                        slot.status === "available"
                        ? "✅ Ready for Parking"
                        : "🚗 Currently Occupied"
                    }

                </p>

            </div>

        `;


        const button =
            document.createElement("button");


        if (
            slot.status === "available"
        ) {

            button.textContent =
                "Book Slot";


            button.className =
                "primary-btn";


            button.addEventListener(
                "click",
                () => {

                    openVehicleSelection(
                        slotDoc.id,
                        slot.slotNumber
                    );

                }
            );

        }

        else {

            button.textContent =
                "Occupied";


            button.className =
                "danger-btn";


            button.disabled =
                true;

        }


        card.appendChild(button);

        slotsContainer.appendChild(card);

    });


    document.getElementById(
        "availableCount"
    ).textContent = available;


    document.getElementById(
        "occupiedCount"
    ).textContent = occupied;

}
// ============================================================
// VEHICLE SELECTION FOR PARKING
// ============================================================
// ============================================================
// VEHICLE SELECTION MODAL
// ============================================================

async function openVehicleSelection(slotId, slotNumber) {

    console.log("🚗 Opening vehicle selection...");
    console.log("Slot ID:", slotId);
    console.log("Slot Number:", slotNumber);


    // --------------------------------------------------------
    // CHECK LOGIN
    // --------------------------------------------------------

    if (!currentUser || !auth.currentUser) {

        showToast(
            "Please login before booking.",
            "error"
        );

        return;
    }


    try {

        // ----------------------------------------------------
        // LOAD VEHICLES
        // ----------------------------------------------------

        const vehicleQuery = query(
            collection(db, "vehicles"),
            where(
                "userId",
                "==",
                currentUser.uid
            )
        );


        const snapshot =
            await getDocs(vehicleQuery);


        console.log(
            "Vehicles found:",
            snapshot.size
        );


        // ----------------------------------------------------
        // NO VEHICLES
        // ----------------------------------------------------

        if (snapshot.empty) {

            showToast(
                "No registered vehicles found. Please add a vehicle first.",
                "error"
            );

            return;
        }


        // ----------------------------------------------------
        // CREATE MODAL
        // ----------------------------------------------------

        const modal =
            document.createElement("div");


        modal.className =
            "modal";


        modal.id =
            "vehicleBookingModal";


        // IMPORTANT
        modal.style.display =
            "flex";


        modal.style.position =
            "fixed";


        modal.style.inset =
            "0";


        modal.style.zIndex =
            "99999";


        modal.style.pointerEvents =
            "auto";


        // ----------------------------------------------------
        // VEHICLE OPTIONS
        // ----------------------------------------------------

        let options = "";


        snapshot.forEach(
            vehicleDoc => {

                const vehicle =
                    vehicleDoc.data();


                const number =
                    vehicle.vehicleNumber ||
                    "Unknown Vehicle";


                const type =
                    vehicle.vehicleType ||
                    "Vehicle";


                options += `
                    <option value="${vehicleDoc.id}">
                        ${number} - ${type}
                    </option>
                `;

            }
        );


        // ----------------------------------------------------
        // MODAL HTML
        // ----------------------------------------------------

        modal.innerHTML = `

            <div
                class="modal-content"
                style="
                    position:relative;
                    z-index:100000;
                    pointer-events:auto;
                "
            >

                <h2>
                    🚗 Book Parking Slot
                </h2>


                <p class="modal-slot">
                    Slot:
                    <strong>
                        ${slotNumber}
                    </strong>
                </p>


                <label
                    for="bookingVehicleSelect"
                >
                    Select Vehicle
                </label>


                <select
                    id="bookingVehicleSelect"
                    style="pointer-events:auto;"
                >

                    ${options}

                </select>


                <div
                    class="modal-buttons"
                >

                    <button
                        type="button"
                        id="confirmVehicleBooking"
                        class="primary-btn"
                    >
                        ✅ Confirm Booking
                    </button>


                    <button
                        type="button"
                        id="cancelVehicleBooking"
                        class="danger-btn"
                    >
                        ❌ Cancel
                    </button>

                </div>

            </div>

        `;


        // ----------------------------------------------------
        // ADD MODAL TO PAGE
        // ----------------------------------------------------

        document.body.appendChild(
            modal
        );


        console.log(
            "✅ Booking modal created"
        );


        // ----------------------------------------------------
        // GET BUTTONS DIRECTLY FROM MODAL
        // ----------------------------------------------------

        const confirmButton =
            modal.querySelector(
                "#confirmVehicleBooking"
            );


        const cancelButton =
            modal.querySelector(
                "#cancelVehicleBooking"
            );


        const vehicleSelect =
            modal.querySelector(
                "#bookingVehicleSelect"
            );


        // ----------------------------------------------------
        // SAFETY CHECK
        // ----------------------------------------------------

        if (
            !confirmButton ||
            !cancelButton ||
            !vehicleSelect
        ) {

            console.error(
                "❌ Booking modal elements not found."
            );


            modal.remove();

            return;
        }


        console.log(
            "✅ Booking buttons connected"
        );


        // ----------------------------------------------------
        // CANCEL BUTTON
        // ----------------------------------------------------

        cancelButton.onclick =
            function () {

                console.log(
                    "❌ Booking cancelled"
                );


                modal.remove();

            };


        // ----------------------------------------------------
        // CONFIRM BUTTON
        // ----------------------------------------------------

        confirmButton.onclick =
            async function () {

                console.log(
                    "✅ Confirm Booking clicked"
                );


                // Prevent double clicking

                confirmButton.disabled =
                    true;


                confirmButton.textContent =
                    "Booking...";


                try {

                    // ----------------------------------------
                    // GET SELECTED VEHICLE
                    // ----------------------------------------

                    const vehicleId =
                        vehicleSelect.value;


                    console.log(
                        "Selected vehicle ID:",
                        vehicleId
                    );


                    const vehicleDoc =
                        snapshot.docs.find(
                            doc =>
                                doc.id ===
                                vehicleId
                        );


                    if (!vehicleDoc) {

                        showToast(
                            "Please select a vehicle.",
                            "error"
                        );


                        confirmButton.disabled =
                            false;


                        confirmButton.textContent =
                            "✅ Confirm Booking";


                        return;
                    }


                    const vehicleData =
                        vehicleDoc.data();


                    const selectedVehicle = {

                        id:
                            vehicleDoc.id,

                        ...vehicleData

                    };


                    console.log(
                        "Selected vehicle:",
                        selectedVehicle
                    );


                    // ----------------------------------------
                    // CLOSE MODAL
                    // ----------------------------------------

                    modal.remove();


                    // ----------------------------------------
                    // BOOK SLOT
                    // ----------------------------------------

                    await bookSlot(
                        slotId,
                        selectedVehicle
                    );

                }

                catch (error) {

                    console.error(
                        "❌ Confirm booking error:",
                        error
                    );


                    if (
                        document.body.contains(
                            modal
                        )
                    ) {

                        modal.remove();

                    }


                    showToast(
                        error.message ||
                        "Unable to complete booking.",
                        "error"
                    );

                }

            };


        // ----------------------------------------------------
        // CLICK OUTSIDE MODAL = CLOSE
        // ----------------------------------------------------

        modal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target === modal
                ) {

                    modal.remove();

                }

            }
        );

    }

    catch (error) {

        console.error(
            "❌ Vehicle selection error:",
            error
        );


        showToast(
            error.message ||
            "Unable to load vehicles.",
            "error"
        );

    }

}
// ===============================
// BOOK SLOT
// ===============================
// ============================================================
// BOOK PARKING SLOT
// ============================================================

async function bookSlot(
    slotId,
    selectedVehicle
) {

    console.log(
        "🚗 BOOK SLOT STARTED"
    );


    console.log(
        "Slot:",
        slotId
    );


    console.log(
        "Vehicle:",
        selectedVehicle
    );


    // --------------------------------------------------------
    // CHECK LOGIN
    // --------------------------------------------------------

    if (
        !currentUser ||
        !auth.currentUser
    ) {

        showToast(
            "Please login before booking.",
            "error"
        );

        return;
    }


    // --------------------------------------------------------
    // CHECK VEHICLE
    // --------------------------------------------------------

    if (
        !selectedVehicle
    ) {

        showToast(
            "Please select a vehicle.",
            "error"
        );

        return;
    }


    const vehicleNumber =
        String(
            selectedVehicle.vehicleNumber ||
            ""
        )
            .trim()
            .toUpperCase();


    if (!vehicleNumber) {

        showToast(
            "Selected vehicle number is missing.",
            "error"
        );

        return;
    }


    try {

        // ----------------------------------------------------
        // GET SLOT
        // ----------------------------------------------------

        const slotRef =
            doc(
                db,
                "slots",
                slotId
            );


        const slotSnap =
            await getDoc(
                slotRef
            );


        if (
            !slotSnap.exists()
        ) {

            showToast(
                "Parking slot not found.",
                "error"
            );

            return;
        }


        const slot =
            slotSnap.data();


        // ----------------------------------------------------
        // CHECK SLOT
        // ----------------------------------------------------

        if (
            String(
                slot.status || ""
            )
                .toLowerCase()
            !== "available"
        ) {

            showToast(
                "This parking slot is no longer available.",
                "error"
            );


            await loadSlots();

            return;
        }


        // ----------------------------------------------------
        // CHECK ACTIVE BOOKING
        // ----------------------------------------------------

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


        const bookingSnapshot =
            await getDocs(
                bookingQuery
            );


        if (
            !bookingSnapshot.empty
        ) {

            showToast(
                "You already have an active booking.",
                "error"
            );

            return;
        }


        // ----------------------------------------------------
        // FINAL CONFIRMATION
        // ----------------------------------------------------

        const confirmed =
            confirm(

                `Book Slot ${
                    slot.slotNumber ||
                    slotId
                } for ${
                    vehicleNumber
                }?`

            );


        if (!confirmed) {

            return;
        }


        // ----------------------------------------------------
        // UPDATE SLOT
        // ----------------------------------------------------

        console.log(
            "Updating parking slot..."
        );


        await updateDoc(
            slotRef,
            {

                status:
                    "occupied",

                occupiedBy:
                    currentUser.uid,

                occupiedVehicle:
                    vehicleNumber,

                occupiedAt:
                    serverTimestamp()

            }
        );


        // ----------------------------------------------------
        // CREATE BOOKING
        // ----------------------------------------------------

        console.log(
            "Creating booking..."
        );


        try {

            await addDoc(
                collection(
                    db,
                    "bookings"
                ),
                {

                    userId:
                        currentUser.uid,

                    fullName:
                        currentUser.fullName ||
                        "",


                    vehicleId:
                        selectedVehicle.id ||
                        "",

                    vehicleNumber:
                        vehicleNumber,

                    vehicleType:
                        selectedVehicle.vehicleType ||
                        "other",

                    vehicleBrand:
                        selectedVehicle.vehicleBrand ||
                        "N/A",

                    vehicleModel:
                        selectedVehicle.vehicleModel ||
                        "N/A",

                    vehicleColor:
                        selectedVehicle.vehicleColor ||
                        "N/A",

                    vehicleImage:
                        selectedVehicle.vehicleImage ||
                        "",


                    slotId:
                        slotId,

                    slotNumber:
                        slot.slotNumber ||
                        slotId,


                    bookingTime:
                        new Date().toLocaleString(),

                    createdAt:
                        serverTimestamp(),

                    status:
                        "active"

                }
            );

        }

        catch (bookingError) {

            console.error(
                "Booking creation failed:",
                bookingError
            );


            // ----------------------------------------------
            // RESTORE SLOT
            // ----------------------------------------------

            await updateDoc(
                slotRef,
                {

                    status:
                        "available",

                    occupiedBy:
                        null,

                    occupiedVehicle:
                        null,

                    occupiedAt:
                        null

                }
            );


            throw bookingError;

        }


        // ----------------------------------------------------
        // SUCCESS
        // ----------------------------------------------------

        console.log(
            "✅ BOOKING SUCCESSFUL"
        );


        showToast(

            `🎉 ${
                vehicleNumber
            } booked successfully!`,

            "success"

        );


        // ----------------------------------------------------
        // REFRESH PAGE DATA
        // ----------------------------------------------------

        await loadSlots();

        await loadBookings();

    }

    catch (error) {

        console.error(
            "❌ Booking error:",
            error
        );


        showToast(

            error.message ||
            "Unable to book parking slot.",

            "error"

        );

    }

}
// ===============================
// LOAD MY BOOKINGS
// ===============================

async function loadBookings() {

    // Clear previous cards
    bookingContainer.innerHTML = "";
    historyContainer.innerHTML = "";

    const bookingQuery = query(
        collection(db, "bookings"),
        where("userId", "==", currentUser.uid)
    );

    const snapshot = await getDocs(bookingQuery);

    let activeCount = 0;
    let historyCount = 0;

    if (snapshot.empty) {

        bookingContainer.innerHTML = `
            <div class="empty-card">
                <i class="fa-solid fa-car"></i>
                <h3>No Active Bookings</h3>
                <p>Book a parking slot to see it here.</p>
            </div>
        `;

        historyContainer.innerHTML = `
            <div class="empty-card">
                <i class="fa-solid fa-clock-rotate-left"></i>
                <h3>No Booking History</h3>
                <p>Your completed bookings will appear here.</p>
            </div>
        `;

        document.getElementById("bookingCount").textContent = 0;
        document.getElementById("historyCount").textContent = 0;

        return;
    }

    let hasActive = false;
    let hasHistory = false;

    snapshot.forEach((bookingDoc) => {

        const booking = bookingDoc.data();

        const card = document.createElement("div");

        card.className = "booking-card";


        // =====================================================
        // VEHICLE INFORMATION
        // =====================================================

        const vehicleNumber =
            booking.vehicleNumber || "N/A";

        const vehicleType =
            booking.vehicleType
                ? booking.vehicleType
                    .charAt(0)
                    .toUpperCase()
                    +
                    booking.vehicleType.slice(1)
                : "Vehicle";

        const vehicleBrand =
            booking.vehicleBrand || "N/A";

        const vehicleModel =
            booking.vehicleModel || "N/A";

        const vehicleColor =
            booking.vehicleColor || "N/A";


        // =====================================================
        // BOOKING CARD
        // =====================================================

        card.innerHTML = `

            <div class="booking-top">

                <div>

                    <h3>

                        <i
                            class="fa-solid fa-square-parking">
                        </i>

                        Slot ${booking.slotNumber}

                    </h3>

                    <small>
                        SmartPark Booking
                    </small>

                </div>


                <span
                    class="booking-status ${booking.status}">

                    ${booking.status.toUpperCase()}

                </span>

            </div>


            <!-- VEHICLE DETAILS -->

            <div class="booking-vehicle">

                <h4>

                    <i
                        class="fa-solid fa-car">
                    </i>

                    Vehicle

                </h4>


                <div class="vehicle-booking-details">

                    <div>

                        <span>
                            Vehicle Number
                        </span>

                        <strong>
                            ${vehicleNumber}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Type
                        </span>

                        <strong>
                            ${vehicleType}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Brand
                        </span>

                        <strong>
                            ${vehicleBrand}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Model
                        </span>

                        <strong>
                            ${vehicleModel}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Color
                        </span>

                        <strong>
                            ${vehicleColor}
                        </strong>

                    </div>

                </div>

            </div>


            <!-- BOOKING DATE -->

            <div class="booking-info">

                <div>

                    <i
                        class="fa-solid fa-calendar-days">
                    </i>

                    <span>
                        Booking Date
                    </span>

                </div>


                <strong>
                    ${booking.bookingTime || "N/A"}
                </strong>

            </div>

        `;


        // =====================================================
        // ACTIVE BOOKING
        // =====================================================

        if (
            booking.status === "active"
        ) {

            activeCount++;

            hasActive = true;


            const cancelBtn =
                document.createElement(
                    "button"
                );


            cancelBtn.textContent =
                "Cancel Booking";


            cancelBtn.className =
                "danger-btn";


            cancelBtn.addEventListener(
                "click",
                () => {

                    cancelBooking(
                        bookingDoc.id,
                        booking.slotId
                    );

                }
            );


            card.appendChild(
                cancelBtn
            );


            bookingContainer.appendChild(
                card
            );

        }


        // =====================================================
        // BOOKING HISTORY
        // =====================================================

        else {

            historyCount++;

            hasHistory = true;


            historyContainer.appendChild(
                card
            );

        }

    });


    // =========================================================
    // NO ACTIVE BOOKINGS
    // =========================================================

    if (!hasActive) {

        bookingContainer.innerHTML = `

            <div class="empty-card">

                <i
                    class="fa-solid fa-car">
                </i>

                <h3>
                    No Active Bookings
                </h3>

                <p>
                    Book a parking slot to see it here.
                </p>

            </div>

        `;

    }


    // =========================================================
    // NO BOOKING HISTORY
    // =========================================================

    if (!hasHistory) {

        historyContainer.innerHTML = `

            <div class="empty-card">

                <i
                    class="fa-solid fa-clock-rotate-left">
                </i>

                <h3>
                    No Booking History
                </h3>

                <p>
                    Your completed bookings
                    will appear here.
                </p>

            </div>

        `;

    }


    // =========================================================
    // UPDATE COUNTS
    // =========================================================

    document.getElementById(
        "bookingCount"
    ).textContent = activeCount;


    document.getElementById(
        "historyCount"
    ).textContent = historyCount;

}
// ===============================
// CANCEL BOOKING
// ===============================

async function cancelBooking(bookingId, slotId) {

    if (!confirm("Cancel this booking?")) return;

    try {

        // 1. Cancel booking
        await updateDoc(
    doc(db, "bookings", bookingId),
    {
        status: "cancelled"
    }
);

await updateDoc(
    doc(db, "slots", slotId),
    {
        status: "available"
    }
);

        showToast("Booking cancelled successfully!", "info");

        await loadSlots();
        await loadBookings();

    } catch (error) {

        console.error(error);
        showToast(error.message, "error");

    }
}
async function initialize(){

    await loadSlots();

    await loadBookings();

    await loadUserVehicles();

}
// ===============================
// LOGOUT
// ===============================

logoutBtn.addEventListener("click", async () => {

    try {

        await signOut(auth);

        showToast("Logged out successfully!", "info");

        window.location.href = "login.html";

    } catch (error) {

        console.error(error);

        showToast(error.message, "error");

    }

});
// ============================================================
// USER SUPPORT NOTIFICATIONS
// ============================================================

const notificationBtn =
    document.getElementById("notificationBtn");

const notificationPanel =
    document.getElementById("notificationPanel");

const notificationList =
    document.getElementById("notificationList");

const notificationCount =
    document.getElementById("notificationCount");


// Open / close notification panel
if (notificationBtn) {

    notificationBtn.addEventListener("click", () => {

        if (notificationPanel) {

            notificationPanel.classList.toggle("active");

        }

    });

}
function escapeHTML(value) {
    if (value === null || value === undefined) {
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
// REAL-TIME ADMIN REPLY NOTIFICATIONS
// ============================================================

let supportNotificationUnsubscribe = null;

function startSupportNotificationListener() {

    // Make sure user is logged in
    if (!currentUser || !currentUser.uid) {

        console.warn(
            "⚠️ Cannot start support notification listener: user not ready."
        );

        return;

    }

    // Remove previous listener if one exists
    if (supportNotificationUnsubscribe) {

        supportNotificationUnsubscribe();

        supportNotificationUnsubscribe = null;

    }

    console.log(
        "🔔 Starting support notification listener for:",
        currentUser.uid
    );

    const supportQuery = query(
        collection(db, "supportMessages"),
        where(
            "userId",
            "==",
            currentUser.uid
        )
    );

    supportNotificationUnsubscribe =
        onSnapshot(

            supportQuery,

            (snapshot) => {

                let unreadCount = 0;

                // Clear current notifications
                if (notificationList) {

                    notificationList.innerHTML = "";

                }

                snapshot.forEach(
                    (supportDoc) => {

                        const support =
                            supportDoc.data();

                        /*
                         * Only show a notification when:
                         *
                         * 1. Admin sent the latest message
                         * 2. User has not read it
                         */

                        if (
                            support.lastSender === "admin" &&
                            support.readByUser !== true
                        ) {

                            unreadCount++;

                            const notification =
                                document.createElement("div");

                            notification.className =
                                "notification-item";

                            notification.innerHTML = `

                                <div class="notification-item-icon">
                                    <i class="fa-solid fa-headset"></i>
                                </div>

                                <div class="notification-item-content">

                                    <strong>
                                        Admin replied
                                    </strong>

                                    <p>
                                        ${escapeHTML(
                                            support.subject ||
                                            "Support Request"
                                        )}
                                    </p>

                                    <small>
                                        ${escapeHTML(
                                            support.lastMessage ||
                                            "You have a new reply."
                                        )}
                                    </small>

                                </div>

                            `;

                            notification.addEventListener(
                                "click",
                                () => {

                                    openUserSupportConversation(
                                        supportDoc.id
                                    );

                                }
                            );

                            if (notificationList) {

                                notificationList.appendChild(
                                    notification
                                );

                            }

                        }

                    }
                );

                // ------------------------------------------------
                // UPDATE BELL COUNT
                // ------------------------------------------------

                if (
                    notificationCount
                ) {

                    if (
                        unreadCount > 0
                    ) {

                        notificationCount.textContent =
                            unreadCount;

                        notificationCount.style.display =
                            "flex";

                    }

                    else {

                        notificationCount.textContent =
                            "0";

                        notificationCount.style.display =
                            "none";

                    }

                }

                // ------------------------------------------------
                // EMPTY STATE
                // ------------------------------------------------

                if (
                    notificationList &&
                    unreadCount === 0
                ) {

                    notificationList.innerHTML = `

                        <div class="no-notifications">

                            <i class="fa-regular fa-bell-slash"></i>

                            <p>
                                No new notifications.
                            </p>

                        </div>

                    `;

                }

                console.log(
                    "🔔 Unread admin replies:",
                    unreadCount
                );

            },

            (error) => {

                console.error(
                    "❌ Support notification listener error:",
                    error
                );

            }

        );

}
function showToast(message, type = "success") {

    const container = document.getElementById("toastContainer");

    const toast = document.createElement("div");

    toast.className = `toast ${type}`;

    let icon = "✅";

    if (type === "error") icon = "❌";

    if (type === "info") icon = "ℹ️";

    toast.innerHTML = `
        <span>${icon}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {

        toast.style.animation = "slideOut .3s ease forwards";

        setTimeout(() => {

            toast.remove();

        }, 300);

    }, 3000);

}
// ===============================
// REGISTER VISITOR
// ===============================

registerVisitorBtn.addEventListener("click", async () => {

    const user = auth.currentUser;

    if (!user) {

        alert("Please login first.");

        return;

    }

    // Get logged-in resident details
    const residentSnap = await getDoc(doc(db, "users", user.uid));

    const resident = residentSnap.data();

    // Validate input
    if (
        visitorName.value.trim() === "" ||
        visitorPhone.value.trim() === "" ||
        visitorPurpose.value.trim() === "" ||
        visitDate.value === "" ||
        arrivalTime.value === ""
    ) {

        alert("Please fill all required fields.");

        return;

    }

    // Save visitor
    await addDoc(collection(db, "visitors"), {

    // Visitor details
    visitorName: visitorName.value.trim(),
    phone: visitorPhone.value.trim(),
    vehicleNumber: visitorVehicle.value.trim(),
    purpose: visitorPurpose.value.trim(),

    // Visit schedule
    visitDate: visitDate.value,
    arrivalTime: arrivalTime.value,

    // Visitor slot
    visitorSlot: visitorSlot.value || "Not Assigned",

    // Resident details
    residentId: user.uid,
    residentName: resident.fullName,
    doorNumber: resident.doorNumber || "N/A",

    // Visitor management
    residentApproval: "pending",
    status: "expected",

    // Security actions start disabled
    emergencyEntry: false,
    adminOverride: false,

    // Creation time
    createdAt: serverTimestamp()

});

    alert("Visitor Registered Successfully!");

    // Clear form
   visitorName.value = "";
visitorPhone.value = "";
visitorVehicle.value = "";
visitorPurpose.value = "";
visitorSlot.value = "";
visitDate.value = "";
arrivalTime.value = "";

});
// ============================================================
// LOAD USER VEHICLES
// ============================================================


// ============================================================
// LOAD USER VEHICLES
// ============================================================

async function loadUserVehicles() {

    if (!currentUser) {
        return;
    }

    vehiclesContainer.innerHTML = `
        <p>
            Loading vehicles...
        </p>
    `;


    try {

        const vehiclesQuery = query(
            collection(db, "vehicles"),
            where(
                "userId",
                "==",
                currentUser.uid
            )
        );


        const snapshot =
            await getDocs(vehiclesQuery);


        vehiclesContainer.innerHTML = "";


        // ------------------------------------------
        // NO VEHICLES
        // ------------------------------------------

        if (snapshot.empty) {

            vehiclesContainer.innerHTML = `

                <div class="empty-state">

                    <i class="fa-solid fa-car"></i>

                    <h3>
                        No vehicles registered
                    </h3>

                    <p>
                        Add your first vehicle below.
                    </p>

                </div>

            `;

            return;
        }


        // ------------------------------------------
        // DISPLAY VEHICLES
        // ------------------------------------------

        snapshot.forEach((vehicleDoc) => {

            const vehicleData =
                vehicleDoc.data();


            const vehicleId =
                vehicleDoc.id;


            const vehicleNumber =
                vehicleData.vehicleNumber ||
                "Unknown";


            const vehicleType =
                vehicleData.vehicleType ||
                "other";


            const vehicleBrand =
                vehicleData.vehicleBrand ||
                "N/A";


            const vehicleModel =
                vehicleData.vehicleModel ||
                "N/A";


            const vehicleColor =
                vehicleData.vehicleColor ||
                "N/A";


            let icon = "🚗";


            if (vehicleType === "bike") {

                icon = "🏍️";

            }
            else if (
                vehicleType === "scooter"
            ) {

                icon = "🛵";

            }
            else if (
                vehicleType === "other"
            ) {

                icon = "🚙";

            }


            const vehicleImage =
                vehicleData.vehicleImage;


            vehiclesContainer.innerHTML += `

                <div class="vehicle-card">


                    <!-- VEHICLE PHOTO -->

                    <div class="vehicle-icon">

                        ${
                            vehicleImage
                            ?
                            `
                            <img
                                src="${vehicleImage}"
                                alt="Vehicle"
                                class="vehicle-photo"
                            >
                            `
                            :
                            `
                            <span>
                                ${icon}
                            </span>
                            `
                        }

                    </div>


                    <!-- VEHICLE INFORMATION -->

                    <div class="vehicle-info">

                        <h3>
                            ${vehicleNumber}
                        </h3>

                        <p>
                            <strong>
                                Type:
                            </strong>

                            ${vehicleType.toUpperCase()}
                        </p>

                        <p>
                            <strong>
                                Brand:
                            </strong>

                            ${vehicleBrand}
                        </p>

                        <p>
                            <strong>
                                Model:
                            </strong>

                            ${vehicleModel}
                        </p>

                        <p>
                            <strong>
                                Color:
                            </strong>

                            ${vehicleColor}
                        </p>


                        <div
                            class="vehicle-actions"
                        >

                            <button
                                type="button"
                                class="primary-btn"
                                onclick="editVehicle('${vehicleId}')"
                            >

                                <i
                                    class="fa-solid fa-pen"
                                ></i>

                                Edit

                            </button>


                            <button
                                type="button"
                                class="danger-btn"
                                onclick="removeVehicle('${vehicleId}')"
                            >

                                <i
                                    class="fa-solid fa-trash"
                                ></i>

                                Remove

                            </button>

                        </div>

                    </div>

                </div>

            `;

        });

    }

    catch (error) {

        console.error(
            "Error loading vehicles:",
            error
        );


        vehiclesContainer.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <h3>
                    Failed to load vehicles
                </h3>

                <p>
                    Please try again.
                </p>

            </div>

        `;

    }

}
// ============================================================
// ADD VEHICLE
// ============================================================
// ============================================================
// ADD VEHICLE
// ============================================================

if (addVehicleBtn) {

    addVehicleBtn.addEventListener(
        "click",
        async () => {

            if (!currentUser) {

                alert(
                    "Please login first."
                );

                return;

            }


            const vehicleNumber =
                newVehicleNumber.value
                    .trim()
                    .toUpperCase();


            const vehicleType =
                newVehicleType.value;


            const vehicleBrand =
                newVehicleBrand.value
                    .trim();


            const vehicleModel =
                newVehicleModel.value
                    .trim();


            const vehicleColor =
                newVehicleColor.value
                    .trim();


            const vehicleImageFile =
                newVehicleImage.files[0];


            // ------------------------------------------
            // VALIDATION
            // ------------------------------------------

            if (!vehicleNumber) {

                alert(
                    "Please enter vehicle number."
                );

                return;

            }


            if (!vehicleBrand) {

                alert(
                    "Please enter vehicle brand."
                );

                return;

            }


            if (!vehicleModel) {

                alert(
                    "Please enter vehicle model."
                );

                return;

            }


            if (!vehicleColor) {

                alert(
                    "Please enter vehicle color."
                );

                return;

            }


            try {

                // ------------------------------------------
                // CHECK DUPLICATE
                // ------------------------------------------

                const existingQuery =
                    query(
                        collection(
                            db,
                            "vehicles"
                        ),

                        where(
                            "vehicleNumber",
                            "==",
                            vehicleNumber
                        )
                    );


                const existingSnapshot =
                    await getDocs(
                        existingQuery
                    );


                if (
                    !existingSnapshot.empty
                ) {

                    alert(
                        "This vehicle is already registered."
                    );

                    return;

                }


                // ------------------------------------------
                // UPLOAD IMAGE
                // ------------------------------------------

                let vehicleImageUrl = "";


                if (vehicleImageFile) {

                    const formData =
                        new FormData();


                    formData.append(
                        "file",
                        vehicleImageFile
                    );


                    formData.append(
                        "upload_preset",
                        "vehicle_upload"
                    );


                    const response =
                        await fetch(
                            "https://api.cloudinary.com/v1_1/ytcppvcr/image/upload",
                            {
                                method:
                                    "POST",

                                body:
                                    formData
                            }
                        );


                    if (!response.ok) {

                        throw new Error(
                            "Vehicle photo upload failed."
                        );

                    }


                    const imageData =
                        await response.json();


                    vehicleImageUrl =
                        imageData.secure_url;

                }


                // ------------------------------------------
                // SAVE VEHICLE
                // ------------------------------------------

                await addDoc(
                    collection(
                        db,
                        "vehicles"
                    ),
                    {

                        userId:
                            currentUser.uid,

                        ownerName:
                            currentUser.fullName,

                        ownerEmail:
                            currentUser.email,

                        vehicleNumber:
                            vehicleNumber,

                        vehicleType:
                            vehicleType,

                        vehicleBrand:
                            vehicleBrand,

                        vehicleModel:
                            vehicleModel,

                        vehicleColor:
                            vehicleColor,

                        vehicleImage:
                            vehicleImageUrl,

                        status:
                            "active",

                        createdAt:
                            serverTimestamp()

                    }
                );


                showToast(
                    "Vehicle added successfully!",
                    "success"
                );


                // ------------------------------------------
                // CLEAR FORM
                // ------------------------------------------

                newVehicleNumber.value =
                    "";

                newVehicleBrand.value =
                    "";

                newVehicleModel.value =
                    "";

                newVehicleColor.value =
                    "";

                newVehicleImage.value =
                    "";

                newVehicleType.value =
                    "car";


                // ------------------------------------------
                // REFRESH VEHICLES
                // ------------------------------------------

                await loadUserVehicles();

            }

            catch (error) {

                console.error(
                    "Error adding vehicle:",
                    error
                );


                showToast(
                    "Failed to add vehicle.",
                    "error"
                );

            }

        }
    );

}
// ============================================================
// REMOVE VEHICLE
// ============================================================

window.removeVehicle =
    async function(vehicleId) {

        const confirmed =
            confirm(
                "Remove this vehicle from your account?"
            );


        if (!confirmed) {

            return;

        }


        try {

            await deleteDoc(
                doc(
                    db,
                    "vehicles",
                    vehicleId
                )
            );


            alert(
                "Vehicle removed successfully."
            );


            await loadUserVehicles();

        }

        catch (error) {

            console.error(
                "Error removing vehicle:",
                error
            );


            alert(
                "Failed to remove vehicle.\n\n" +
                error.message
            );

        }

    };
    // ============================================================
// EDIT VEHICLE
// ============================================================

window.editVehicle =
    async function(vehicleId) {

        try {

            const vehicleRef =
                doc(
                    db,
                    "vehicles",
                    vehicleId
                );


            const vehicleSnap =
                await getDoc(
                    vehicleRef
                );


            if (!vehicleSnap.exists()) {

                alert(
                    "Vehicle not found."
                );

                return;

            }


            const vehicleData =
                vehicleSnap.data();


            const newNumber =
                prompt(
                    "Vehicle Number:",
                    vehicleData.vehicleNumber || ""
                );


            if (
                newNumber === null
            ) {

                return;

            }


            const newBrand =
                prompt(
                    "Vehicle Brand:",
                    vehicleData.vehicleBrand || ""
                );


            if (
                newBrand === null
            ) {

                return;

            }


            const newModel =
                prompt(
                    "Vehicle Model:",
                    vehicleData.vehicleModel || ""
                );


            if (
                newModel === null
            ) {

                return;

            }


            const newColor =
                prompt(
                    "Vehicle Color:",
                    vehicleData.vehicleColor || ""
                );


            if (
                newColor === null
            ) {

                return;

            }


            await updateDoc(
                vehicleRef,
                {

                    vehicleNumber:
                        newNumber
                            .trim()
                            .toUpperCase(),

                    vehicleBrand:
                        newBrand.trim(),

                    vehicleModel:
                        newModel.trim(),

                    vehicleColor:
                        newColor.trim()

                }
            );


            showToast(
                "Vehicle updated successfully!",
                "success"
            );


            await loadUserVehicles();

        }

        catch (error) {

            console.error(
                "Error editing vehicle:",
                error
            );


            showToast(
                "Failed to update vehicle.",
                "error"
            );

        }

    };
// ============================================================
// FORGOT PASSWORD
// ============================================================

const forgotPassword = document.getElementById("forgotPassword");

if (forgotPassword) {

    forgotPassword.addEventListener("click", async function (e) {

        e.preventDefault();

        const emailInput = document.getElementById("email");
        const loginError = document.getElementById("loginError");

        if (!emailInput) {
            console.error("Email input not found.");
            return;
        }

        const email = emailInput.value.trim();

        // ------------------------------------------
        // CHECK EMAIL
        // ------------------------------------------

        if (email === "") {

            if (loginError) {
                loginError.style.display = "block";
                loginError.style.color = "#ef4444";
                loginError.textContent =
                    "Please enter your email address first.";
            }

            emailInput.focus();

            return;
        }

        // ------------------------------------------
        // VALIDATE EMAIL FORMAT
        // ------------------------------------------

        if (!emailInput.checkValidity()) {

            if (loginError) {
                loginError.style.display = "block";
                loginError.style.color = "#ef4444";
                loginError.textContent =
                    "Please enter a valid email address.";
            }

            emailInput.focus();

            return;
        }

        // ------------------------------------------
        // SHOW SENDING MESSAGE
        // ------------------------------------------

        forgotPassword.disabled = true;
        forgotPassword.textContent = "Sending...";

        try {

            console.log("Sending password reset email to:", email);

            await sendPasswordResetEmail(
                auth,
                email
            );

            // ------------------------------------------
            // SUCCESS
            // ------------------------------------------

            if (loginError) {

                loginError.style.display = "block";
                loginError.style.color = "#22c55e";

                loginError.textContent =
                    "Password reset email sent. Check your inbox.";
            }

            console.log(
                "Password reset email sent successfully."
            );

        } catch (error) {

            console.error(
                "Password reset error:",
                error
            );

            if (loginError) {

                loginError.style.display = "block";
                loginError.style.color = "#ef4444";

                switch (error.code) {

                    case "auth/user-not-found":

                        loginError.textContent =
                            "No account found with this email.";

                        break;

                    case "auth/invalid-email":

                        loginError.textContent =
                            "Please enter a valid email address.";

                        break;

                    case "auth/too-many-requests":

                        loginError.textContent =
                            "Too many requests. Please try again later.";

                        break;

                    case "auth/network-request-failed":

                        loginError.textContent =
                            "Network error. Check your internet connection.";

                        break;

                    default:

                        loginError.textContent =
                            "Unable to send reset email. Please try again.";
                }
            }

        } finally {

            forgotPassword.disabled = false;
            forgotPassword.textContent =
                "Forgot password?";
        }

    });

}
// =====================================================
// USER SUPPORT CONVERSATION
// =====================================================
// =====================================================
// OPEN USER SUPPORT CONVERSATION
// =====================================================

// =====================================================
// OPEN USER SUPPORT CONVERSATION
// =====================================================

async function openUserSupportConversation(requestId) {

    // Store current conversation ID
    window.activeUserSupportRequestId = requestId;

    console.log(
        "💬 Opening support conversation:",
        requestId
    );

    if (!requestId) {
        console.error("❌ No support request ID.");
        return;
    }

    try {

        // -------------------------------------------------
        // GET SUPPORT REQUEST
        // -------------------------------------------------

        const requestRef = doc(
            db,
            "supportMessages",
            requestId
        );

        const requestSnap =
            await getDoc(requestRef);

        if (!requestSnap.exists()) {

            console.error(
                "❌ Support request not found:",
                requestId
            );

            alert(
                "Support request could not be found."
            );

            return;
        }

        const requestData =
            requestSnap.data();


        // -------------------------------------------------
        // GET CONVERSATION REPLIES
        // -------------------------------------------------

        const repliesRef = collection(
            db,
            "supportMessages",
            requestId,
            "replies"
        );

        const repliesQuery = query(
            repliesRef,
            orderBy("createdAt", "asc")
        );

        const repliesSnap =
            await getDocs(repliesQuery);


        let repliesHTML = "";


        repliesSnap.forEach((replyDoc) => {

            const reply =
                replyDoc.data();

            const isAdmin =
                reply.senderRole === "admin" ||
                reply.senderType === "admin";


            let time = "Just now";


            if (
                reply.createdAt &&
                typeof reply.createdAt.toDate ===
                    "function"
            ) {

                time =
                    reply.createdAt
                        .toDate()
                        .toLocaleString();

            }


            repliesHTML += `

                <div class="
                    support-message
                    ${
                        isAdmin
                            ? "admin-message"
                            : "user-message"
                    }
                ">

                    <div class="support-message-sender">

                        ${
                            isAdmin
                                ? "Administrator"
                                : "You"
                        }

                    </div>

                    <div class="support-message-text">

                        ${reply.message || ""}

                    </div>

                    <div class="support-message-time">

                        ${time}

                    </div>

                </div>

            `;

        });


        // -------------------------------------------------
        // REMOVE EXISTING MODAL
        // -------------------------------------------------

        const existingModal =
            document.getElementById(
                "userSupportConversationModal"
            );

        if (existingModal) {
            existingModal.remove();
        }


        // -------------------------------------------------
        // CREATE MODAL
        // -------------------------------------------------

        const modal =
            document.createElement("div");

        modal.id =
            "userSupportConversationModal";

        modal.className =
            "user-support-modal";


        modal.innerHTML = `

            <div class="user-support-modal-content">

                <!-- HEADER -->

                <div class="user-support-modal-header">

                    <div>

                        <h2>
                            💬
                            ${
                                requestData.subject ||
                                "Support Request"
                            }
                        </h2>

                        <p>
                            ${
                                requestData.category ||
                                "Support"
                            }
                        </p>

                    </div>


                    <button
                        type="button"
                        id="closeUserSupportModal"
                    >
                        ×
                    </button>

                </div>


                <!-- CONVERSATION -->

                <div
                    id="userSupportConversationMessages"
                    class="user-support-conversation"
                >

                    <!-- ORIGINAL USER REQUEST -->

                    <div class="user-original-request">

                        <strong>
                            Your Request
                        </strong>

                        <p>
                            ${
                                requestData.message ||
                                ""
                            }
                        </p>

                    </div>


                    <!-- REPLIES -->

                    ${
                        repliesHTML ||

                        `
                        <div class="no-replies">

                            <i class="
                                fa-regular
                                fa-comments
                            "></i>

                            <p>
                                No replies yet.
                            </p>

                        </div>
                        `
                    }

                </div>


                <!-- REPLY AREA -->

                <div
                    class="user-support-reply-area"
                >

                    <textarea
                        id="userSupportReplyInput"
                        placeholder="Type your reply to the administrator..."
                    ></textarea>


                    <button
                        id="userSupportReplyBtn"
                        type="button"
                        class="primary-btn"
                    >

                        <i class="
                            fa-solid
                            fa-paper-plane
                        "></i>

                        Send Reply

                    </button>

                </div>

            </div>

        `;


        // Add modal to page
        document.body.appendChild(modal);


        // -------------------------------------------------
        // CLOSE MODAL
        // -------------------------------------------------

        const closeBtn =
            document.getElementById(
                "closeUserSupportModal"
            );

        if (closeBtn) {

            closeBtn.addEventListener(
                "click",
                () => {

                    modal.remove();

                }
            );

        }


        // -------------------------------------------------
        // SEND USER REPLY BUTTON
        // -------------------------------------------------

        const replyBtn =
            document.getElementById(
                "userSupportReplyBtn"
            );

        if (replyBtn) {

            replyBtn.addEventListener(
                "click",
                () => {

                    sendUserSupportReply(
                        requestId
                    );

                }
            );

        }


        // -------------------------------------------------
        // MARK ADMIN REPLIES AS READ
        // -------------------------------------------------

        await updateDoc(
            requestRef,
            {
                readByUser: true
            }
        );


        console.log(
            "✅ Support conversation opened."
        );


    } catch (error) {

        console.error(
            "❌ Failed to open support conversation:",
            error
        );

        alert(
            "Unable to open the support conversation.\n\n" +
            "Code: " +
            (error?.code || "unknown") +
            "\nMessage: " +
            (error?.message || "Unknown error")
        );

    }

}


// =====================================================
// SEND USER SUPPORT REPLY
// =====================================================

async function sendUserSupportReply(requestId) {

    if (!requestId) {

        console.error(
            "❌ No support request ID."
        );

        return;
    }


    const input =
        document.getElementById(
            "userSupportReplyInput"
        );


    if (!input) {

        console.error(
            "❌ Reply input not found."
        );

        return;
    }


    const message =
        input.value.trim();


    if (!message) {

        input.focus();

        return;
    }


    try {

        // -------------------------------------------------
        // ADD USER REPLY
        // -------------------------------------------------

        await addDoc(

            collection(
                db,
                "supportMessages",
                requestId,
                "replies"
            ),

            {

                message: message,

                senderRole: "user",

                senderType: "user",

                senderName: "User",

                createdAt:
                    serverTimestamp()

            }

        );


        // -------------------------------------------------
        // UPDATE SUPPORT REQUEST
        // -------------------------------------------------

        await updateDoc(

            doc(
                db,
                "supportMessages",
                requestId
            ),

            {

                lastMessage:
                    message,

                lastSender:
                    "user",

                lastMessageAt:
                    serverTimestamp(),

                // IMPORTANT:
                // Admin has not read this message
                readByAdmin:
                    false,

                status:
                    "in-progress"

            }

        );


        // Clear input
        input.value = "";


        console.log(
            "✅ User reply sent."
        );

        console.log(
            "📩 Admin notification enabled."
        );


    } catch (error) {

        console.error(
            "❌ Failed to send user reply:",
            error
        );

        alert(
            "Unable to send reply.\n\n" +
            "Code: " +
            (error?.code || "unknown") +
            "\nMessage: " +
            (error?.message || "Unknown error")
        );

    }

}

