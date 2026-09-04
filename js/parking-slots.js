import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


// ============================================================
// GLOBAL DATA
// ============================================================

let allSlots = [];
let allBookings = [];
let selectedSlotId = null;

let slotContainer = null;


// ============================================================
// PAGE START
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    console.log("SmartPark Parking Slots Started");

    initializeParkingPage();

});


// ============================================================
// INITIALIZE
// ============================================================

async function initializeParkingPage() {

    try {

        findSlotContainer();

        setupActionButtons();

        await loadParkingData();

        // Refresh every 15 seconds
        setInterval(() => {

            loadParkingData();

        }, 15000);

        console.log("SmartPark Parking Slots Ready");

    }

    catch (error) {

        console.error(
            "Parking page initialization error:",
            error
        );

    }

}


// ============================================================
// FIND PARKING SLOT CONTAINER
// ============================================================

function findSlotContainer() {

    // If already created, use it
    const existingContainer =
        document.querySelector(".dynamic-parking-slots");

    if (existingContainer) {

        slotContainer = existingContainer;

        return;

    }


    // Find existing parking slots from HTML
    const existingSlots =
        Array.from(
            document.querySelectorAll(
                ".parking-slot, .slot"
            )
        );


    if (!existingSlots.length) {

        console.error(
            "No parking slots found in HTML."
        );

        return;

    }


    // The original parent containing the slots
    const originalParent =
        existingSlots[0].parentElement;


    // Create a NEW dedicated grid
    const newContainer =
        document.createElement("div");


    newContainer.className =
        "dynamic-parking-slots";


    // Insert the new grid before the first old slot
    originalParent.insertBefore(
        newContainer,
        existingSlots[0]
    );


    // Move all existing slots into the new grid
    existingSlots.forEach(slot => {

        newContainer.appendChild(slot);

    });


    // ========================================================
// GRID STYLING
// ========================================================

newContainer.style.setProperty(
    "display",
    "grid",
    "important"
);

newContainer.style.setProperty(
    "grid-template-columns",
    "repeat(3, minmax(0, 1fr))",
    "important"
);

newContainer.style.setProperty(
    "gap",
    "16px",
    "important"
);

newContainer.style.setProperty(
    "width",
    "100%",
    "important"
);

newContainer.style.setProperty(
    "max-width",
    "100%",
    "important"
);

newContainer.style.setProperty(
    "margin",
    "20px 0",
    "important"
);

newContainer.style.setProperty(
    "padding",
    "0",
    "important"
);

newContainer.style.setProperty(
    "box-sizing",
    "border-box",
    "important"
);

}


// ============================================================
// CREATE SLOT ELEMENT
// ============================================================


function createSlotElement(slot) {

    const slotElement = document.createElement("button");

    slotElement.type = "button";

    slotElement.className = "parking-slot";

    slotElement.dataset.slot =
        String(
            slot.slotNumber ||
            slot.id
        )
        .trim()
        .toUpperCase();

    slotElement.dataset.firestoreId = slot.id;


    // ========================================================
    // FORCE SLOT SIZE AND GRID BEHAVIOR
    // ========================================================

    slotElement.style.setProperty(
        "width",
        "100%",
        "important"
    );

    slotElement.style.setProperty(
        "min-width",
        "0",
        "important"
    );

    slotElement.style.setProperty(
        "max-width",
        "none",
        "important"
    );

    slotElement.style.setProperty(
        "height",
        "110px",
        "important"
    );

    slotElement.style.setProperty(
        "min-height",
        "110px",
        "important"
    );

    slotElement.style.setProperty(
        "box-sizing",
        "border-box",
        "important"
    );

    slotElement.style.setProperty(
        "margin",
        "0",
        "important"
    );

    slotElement.style.setProperty(
        "justify-self",
        "stretch",
        "important"
    );

    slotElement.style.setProperty(
        "align-self",
        "stretch",
        "important"
    );


    // ========================================================
    // CLICK EVENT
    // ========================================================

    slotElement.addEventListener(
        "click",
        () => {

            selectSlot(
                slotElement.dataset.slot
            );

        }
    );


    return slotElement;
}


// ============================================================
// RENDER SLOTS FROM FIRESTORE
// ============================================================

function renderSlotsFromFirestore() {

    if (!slotContainer) {

        findSlotContainer();

    }


    if (!slotContainer) {

        console.error(
            "Parking slot container not found."
        );

        return;

    }


    // Remove old slots
    slotContainer
        .querySelectorAll(
            ".parking-slot, .slot"
        )
        .forEach(slot => {

            slot.remove();

        });


    // Sort slots
    const sortedSlots =
        [...allSlots].sort(
            (a, b) => {

                const aNumber =
                    String(
                        a.slotNumber ||
                        a.id ||
                        ""
                    );

                const bNumber =
                    String(
                        b.slotNumber ||
                        b.id ||
                        ""
                    );


                return aNumber.localeCompare(
                    bNumber,
                    undefined,
                    {
                        numeric: true,
                        sensitivity: "base"
                    }
                );

            }
        );


    // Create slots
    sortedSlots.forEach(slot => {

        const slotElement =
            createSlotElement(slot);


        slotContainer.appendChild(
            slotElement
        );

    });


    console.log(
        `${sortedSlots.length} parking slots displayed.`
    );

}

// ============================================================
// LOAD FIREBASE DATA
// ============================================================

async function loadParkingData() {

    try {

        // ====================================================
        // LOAD SLOTS
        // ====================================================

        const slotSnapshot =
            await getDocs(
                collection(
                    db,
                    "slots"
                )
            );


        allSlots = [];


        slotSnapshot.forEach(
            slotDoc => {

                allSlots.push({

                    id: slotDoc.id,

                    ...slotDoc.data()

                });

            }
        );


        console.log(
            "Firestore slots:",
            allSlots
        );


        // ====================================================
        // LOAD BOOKINGS
        // ====================================================

        const bookingSnapshot =
            await getDocs(
                collection(
                    db,
                    "bookings"
                )
            );


        allBookings = [];


        bookingSnapshot.forEach(
            bookingDoc => {

                allBookings.push({

                    id: bookingDoc.id,

                    ...bookingDoc.data()

                });

            }
        );


        // ====================================================
        // IMPORTANT:
        // REBUILD SLOT UI FROM FIRESTORE
        // ====================================================

        renderSlotsFromFirestore();


        // ====================================================
        // UPDATE UI
        // ====================================================

        updateSlotUI();

        updateParkingSummary();

        updateAIRecommendation();


        // ====================================================
        // RESTORE SELECTED SLOT
        // ====================================================

        if (selectedSlotId) {

            const selectedElement =
                document.querySelector(
                    `.parking-slot[data-slot="${selectedSlotId}"]`
                );


            if (selectedElement) {

                selectSlot(
                    selectedSlotId
                );

            }

            else {

                // Selected slot was deleted
                selectedSlotId = null;

                clearSlotDetails();

            }

        }


        console.log(
            "Parking data updated successfully."
        );

    }

    catch (error) {

        console.error(
            "Firebase parking data error:",
            error
        );


        const reason =
            document.getElementById(
                "recommendReason"
            );


        if (reason) {

            reason.textContent =
                "Unable to load parking data.";

        }

    }

}


// ============================================================
// FIND ACTIVE BOOKING
// ============================================================

function getActiveBooking(slotId) {

    return allBookings.find(
        booking => {

            const bookingSlot =
                String(
                    booking.slotNumber ||
                    booking.slotId ||
                    ""
                )
                .trim()
                .toUpperCase();


            const status =
                String(
                    booking.status ||
                    ""
                )
                .trim()
                .toLowerCase();


            return (

                bookingSlot ===
                String(slotId)
                    .trim()
                    .toUpperCase()

                &&

                (
                    status === "active" ||
                    status === "reserved"
                )

            );

        }
    );

}


// ============================================================
// GET SLOT STATUS
// ============================================================

function getSlotStatus(
    firebaseSlot,
    booking
) {

    // Maintenance has highest priority
    if (
        firebaseSlot &&

        String(
            firebaseSlot.status ||
            ""
        )
        .trim()
        .toLowerCase() ===
        "maintenance"
    ) {

        return "maintenance";

    }


    // Active booking = occupied
    if (
        booking &&

        String(
            booking.status ||
            ""
        )
        .trim()
        .toLowerCase() ===
        "active"
    ) {

        return "occupied";

    }


    // Reserved booking
    if (
        booking &&

        String(
            booking.status ||
            ""
        )
        .trim()
        .toLowerCase() ===
        "reserved"
    ) {

        return "reserved";

    }


    // Firebase slot status
    if (
        firebaseSlot &&
        firebaseSlot.status
    ) {

        const status =
            String(
                firebaseSlot.status
            )
            .trim()
            .toLowerCase();


        if (
            [
                "available",
                "occupied",
                "reserved",
                "maintenance"
            ].includes(status)
        ) {

            return status;

        }

    }


    return "available";

}


// ============================================================
// UPDATE SLOT UI
// ============================================================

function updateSlotUI() {

    const slots =
        document.querySelectorAll(
            ".parking-slot"
        );


    slots.forEach(
        slotElement => {

            const slotId =
                String(
                    slotElement.dataset.slot ||
                    ""
                )
                .trim()
                .toUpperCase();


            if (!slotId) return;


            // =================================================
            // FIND FIREBASE SLOT
            // =================================================

            const firebaseSlot =
                allSlots.find(
                    slot => {

                        return (

                            String(
                                slot.slotNumber ||
                                ""
                            )
                            .trim()
                            .toUpperCase()

                            ===

                            slotId

                        );

                    }
                );


            // =================================================
            // SAFETY
            // =================================================

            if (!firebaseSlot) {

                // This should normally never happen because
                // renderSlotsFromFirestore removes deleted slots.

                slotElement.remove();

                return;

            }


            // =================================================
            // FIND BOOKING
            // =================================================

            const booking =
                getActiveBooking(
                    slotId
                );


            // =================================================
            // GET STATUS
            // =================================================

            const status =
                getSlotStatus(
                    firebaseSlot,
                    booking
                );


            slotElement.dataset.status =
                status;


            // =================================================
            // RESET CLASSES
            // =================================================

            slotElement.classList.remove(
                "available",
                "occupied",
                "reserved",
                "maintenance",
                "has-car",
                "selected",
                "active"
            );


            slotElement.classList.add(
                status
            );


            // =================================================
            // SLOT DISPLAY
            // =================================================

            if (status === "occupied") {

                slotElement.classList.add(
                    "has-car"
                );


                slotElement.innerHTML = `

                    <div class="slot-vehicle">
                        🚗
                    </div>

                    <div class="slot-number">
                        ${escapeHTML(slotId)}
                    </div>

                `;

            }

            else if (status === "reserved") {

                slotElement.innerHTML = `

                    <div class="slot-icon">
                        🔒
                    </div>

                    <div class="slot-number">
                        ${escapeHTML(slotId)}
                    </div>

                `;

            }

            else if (status === "maintenance") {

                slotElement.innerHTML = `

                    <div class="slot-icon">
                        🔧
                    </div>

                    <div class="slot-number">
                        ${escapeHTML(slotId)}
                    </div>

                `;

            }

            else {

                slotElement.innerHTML = `

                    <div class="slot-icon">
                        🅿
                    </div>

                    <div class="slot-number">
                        ${escapeHTML(slotId)}
                    </div>

                `;

            }


            // =================================================
            // RESTORE SELECTION
            // =================================================

            if (
                selectedSlotId ===
                slotId
            ) {

                slotElement.classList.add(
                    "selected"
                );

            }

        }
    );

}


// ============================================================
// PARKING SUMMARY
// ============================================================

function updateParkingSummary() {

    let available = 0;

    let occupied = 0;

    let reserved = 0;

    let maintenance = 0;


    const slots =
        document.querySelectorAll(
            ".parking-slot"
        );


    slots.forEach(
        slot => {

            const status =
                slot.dataset.status;


            switch (status) {

                case "available":

                    available++;

                    break;


                case "occupied":

                    occupied++;

                    break;


                case "reserved":

                    reserved++;

                    break;


                case "maintenance":

                    maintenance++;

                    break;

            }

        }
    );


    // ========================================================
    // UPDATE COUNTERS
    // ========================================================

    const availableCount =
        document.getElementById(
            "availableCount"
        );


    const occupiedCount =
        document.getElementById(
            "occupiedCount"
        );


    const reservedCount =
        document.getElementById(
            "reservedCount"
        );


    const maintenanceCount =
        document.getElementById(
            "maintenanceCount"
        );


    if (availableCount) {

        availableCount.textContent =
            available;

    }


    if (occupiedCount) {

        occupiedCount.textContent =
            occupied;

    }


    if (reservedCount) {

        reservedCount.textContent =
            reserved;

    }


    if (maintenanceCount) {

        maintenanceCount.textContent =
            maintenance;

    }


    console.log(
        "Parking Summary:",
        {
            available,
            occupied,
            reserved,
            maintenance
        }
    );

}


// ============================================================
// SETUP ACTION BUTTONS
// ============================================================

function setupActionButtons() {

    const reserveBtn =
        document.getElementById(
            "reserveBtn"
        );


    const releaseBtn =
        document.getElementById(
            "releaseBtn"
        );


    const maintenanceBtn =
        document.getElementById(
            "maintenanceBtn"
        );


    const clearMaintenanceBtn =
        document.getElementById(
            "clearMaintenanceBtn"
        );


    if (reserveBtn) {

        reserveBtn.addEventListener(
            "click",
            reserveSelectedSlot
        );

    }


    if (releaseBtn) {

        releaseBtn.addEventListener(
            "click",
            releaseSelectedSlot
        );

    }


    if (maintenanceBtn) {

        maintenanceBtn.addEventListener(
            "click",
            markSelectedSlotMaintenance
        );

    }


    if (clearMaintenanceBtn) {

        clearMaintenanceBtn.addEventListener(
            "click",
            clearSelectedMaintenance
        );

    }


    console.log(
        "Slot action buttons connected."
    );

}


// ============================================================
// SELECT SLOT
// ============================================================

function selectSlot(slotId) {

    selectedSlotId =
        String(slotId)
            .trim()
            .toUpperCase();


    // ========================================================
    // REMOVE OLD SELECTION
    // ========================================================

    document.querySelectorAll(
        ".parking-slot"
    ).forEach(
        slot => {

            slot.classList.remove(
                "selected"
            );

        }
    );


    // ========================================================
    // SELECT CURRENT SLOT
    // ========================================================

    const selectedElement =
        document.querySelector(
            `.parking-slot[data-slot="${selectedSlotId}"]`
        );


    if (selectedElement) {

        selectedElement.classList.add(
            "selected"
        );

    }


    // ========================================================
    // FIND FIREBASE SLOT
    // ========================================================

    const firebaseSlot =
        allSlots.find(
            slot => {

                return (

                    String(
                        slot.slotNumber ||
                        ""
                    )
                    .trim()
                    .toUpperCase()

                    ===

                    selectedSlotId

                );

            }
        );


    // ========================================================
    // SLOT WAS DELETED
    // ========================================================

    if (!firebaseSlot) {

        clearSlotDetails();

        selectedSlotId = null;

        return;

    }


    // ========================================================
    // FIND BOOKING
    // ========================================================

    const booking =
        getActiveBooking(
            selectedSlotId
        );


    // ========================================================
    // GET STATUS
    // ========================================================

    const status =
        getSlotStatus(
            firebaseSlot,
            booking
        );


    // ========================================================
    // SHOW DETAILS
    // ========================================================

    updateSlotDetails(
        selectedSlotId,
        status,
        firebaseSlot,
        booking
    );

}


// ============================================================
// CLEAR SLOT DETAILS
// ============================================================

function clearSlotDetails() {

    const slotNumber =
        document.getElementById(
            "slotNumber"
        );


    const slotStatus =
        document.getElementById(
            "slotStatus"
        );


    const slotOwner =
        document.getElementById(
            "slotOwner"
        );


    const slotVehicle =
        document.getElementById(
            "slotVehicle"
        );


    const slotTime =
        document.getElementById(
            "slotTime"
        );


    if (slotNumber) {

        slotNumber.textContent =
            "-";

    }


    if (slotStatus) {

        slotStatus.textContent =
            "-";

    }


    if (slotOwner) {

        slotOwner.textContent =
            "-";

    }


    if (slotVehicle) {

        slotVehicle.textContent =
            "-";

    }


    if (slotTime) {

        slotTime.textContent =
            "-";

    }


    [
        "reserveBtn",
        "releaseBtn",
        "maintenanceBtn",
        "clearMaintenanceBtn"
    ]
    .forEach(id => {

        const btn =
            document.getElementById(id);

        if (btn) {

            btn.style.display =
                "none";

        }

    });


    const maintenanceReasonRow =
        document.getElementById(
            "maintenanceReasonRow"
        );


    if (maintenanceReasonRow) {

        maintenanceReasonRow.style.display =
            "none";

    }

}


// ============================================================
// UPDATE SLOT DETAILS
// ============================================================

function updateSlotDetails(
    slotId,
    status,
    firebaseSlot,
    booking
) {

    const slotNumber =
        document.getElementById(
            "slotNumber"
        );


    const slotStatus =
        document.getElementById(
            "slotStatus"
        );


    const slotOwner =
        document.getElementById(
            "slotOwner"
        );


    const slotVehicle =
        document.getElementById(
            "slotVehicle"
        );


    const slotTime =
        document.getElementById(
            "slotTime"
        );


    const maintenanceReasonRow =
        document.getElementById(
            "maintenanceReasonRow"
        );


    const maintenanceReason =
        document.getElementById(
            "maintenanceReason"
        );


    const reserveBtn =
        document.getElementById(
            "reserveBtn"
        );


    const releaseBtn =
        document.getElementById(
            "releaseBtn"
        );


    const maintenanceBtn =
        document.getElementById(
            "maintenanceBtn"
        );


    const clearMaintenanceBtn =
        document.getElementById(
            "clearMaintenanceBtn"
        );


    // ========================================================
    // SLOT NUMBER
    // ========================================================

    if (slotNumber) {

        slotNumber.textContent =
            slotId;

    }


    // ========================================================
    // STATUS
    // ========================================================

    if (slotStatus) {

        slotStatus.textContent =
            formatStatus(status);

    }


    // ========================================================
    // HIDE ALL ACTION BUTTONS
    // ========================================================

    if (reserveBtn) {

        reserveBtn.style.display =
            "none";

    }


    if (releaseBtn) {

        releaseBtn.style.display =
            "none";

    }


    if (maintenanceBtn) {

        maintenanceBtn.style.display =
            "none";

    }


    if (clearMaintenanceBtn) {

        clearMaintenanceBtn.style.display =
            "none";

    }


    if (maintenanceReasonRow) {

        maintenanceReasonRow.style.display =
            "none";

    }


    // ========================================================
    // MAINTENANCE
    // ========================================================

    if (
        status ===
        "maintenance"
    ) {

        if (slotOwner) {

            slotOwner.textContent =
                "Maintenance";

        }


        if (slotVehicle) {

            slotVehicle.textContent =
                "-";

        }


        if (slotTime) {

            slotTime.textContent =
                formatTimestamp(
                    firebaseSlot?.maintenanceAt
                );

        }


        if (maintenanceReason) {

            maintenanceReason.textContent =
                firebaseSlot?.maintenanceReason ||
                "Under maintenance";

        }


        if (maintenanceReasonRow) {

            maintenanceReasonRow.style.display =
                "block";

        }


        if (clearMaintenanceBtn) {

            clearMaintenanceBtn.style.display =
                "block";

        }


        return;

    }


    // ========================================================
    // OCCUPIED
    // ========================================================

    if (
        status ===
        "occupied"
    ) {

        if (slotOwner) {

            slotOwner.textContent =
                booking?.fullName ||
                booking?.ownerName ||
                "-";

        }


        if (slotVehicle) {

            slotVehicle.textContent =
                booking?.vehicleNumber ||
                booking?.vehicle ||
                "-";

        }


        if (slotTime) {

            slotTime.textContent =
                booking?.bookingTime ||
                booking?.bookedTime ||
                "-";

        }


        return;

    }


    // ========================================================
    // RESERVED
    // ========================================================

    if (
        status ===
        "reserved"
    ) {

        if (slotOwner) {

            slotOwner.textContent =
                booking?.fullName ||
                booking?.ownerName ||
                firebaseSlot?.reservedBy ||
                "Admin";

        }


        if (slotVehicle) {

            slotVehicle.textContent =
                booking?.vehicleNumber ||
                "-";

        }


        if (slotTime) {

            slotTime.textContent =
                booking?.bookingTime ||
                firebaseSlot?.reservedAt ||
                "-";

        }


        if (releaseBtn) {

            releaseBtn.style.display =
                "block";

        }


        return;

    }


    // ========================================================
    // AVAILABLE
    // ========================================================

    if (slotOwner) {

        slotOwner.textContent =
            "-";

    }


    if (slotVehicle) {

        slotVehicle.textContent =
            "-";

    }


    if (slotTime) {

        slotTime.textContent =
            "-";

    }


    if (reserveBtn) {

        reserveBtn.style.display =
            "block";

    }


    if (maintenanceBtn) {

        maintenanceBtn.style.display =
            "block";

    }

}


// ============================================================
// RESERVE SELECTED SLOT
// ============================================================

async function reserveSelectedSlot() {

    if (!selectedSlotId) {

        alert(
            "Please select a parking slot first."
        );

        return;

    }


    const firebaseSlot =
        allSlots.find(
            slot => {

                return (

                    String(
                        slot.slotNumber ||
                        ""
                    )
                    .trim()
                    .toUpperCase()

                    ===

                    selectedSlotId

                );

            }
        );


    if (!firebaseSlot) {

        alert(
            "Parking slot not found."
        );

        await loadParkingData();

        return;

    }


    const currentStatus =
        getSlotStatus(
            firebaseSlot,
            getActiveBooking(
                selectedSlotId
            )
        );


    if (
        currentStatus !==
        "available"
    ) {

        alert(
            "Only available slots can be reserved."
        );

        return;

    }


    const confirmed =
        confirm(
            `Reserve parking slot ${selectedSlotId}?`
        );


    if (!confirmed) return;


    try {

        const slotRef =
            doc(
                db,
                "slots",
                firebaseSlot.id
            );


        await updateDoc(
            slotRef,
            {

                status:
                    "reserved",

                reservedAt:
                    new Date()
                        .toLocaleString(),

                reservedBy:
                    "Admin"

            }
        );


        alert(
            `Slot ${selectedSlotId} has been reserved.`
        );


        await loadParkingData();

    }

    catch (error) {

        console.error(
            "Reserve slot error:",
            error
        );


        alert(
            "Failed to reserve slot:\n" +
            error.message
        );

    }

}


// ============================================================
// RELEASE RESERVED SLOT
// ============================================================

async function releaseSelectedSlot() {

    if (!selectedSlotId) {

        alert(
            "Please select a slot first."
        );

        return;

    }


    const firebaseSlot =
        allSlots.find(
            slot => {

                return (

                    String(
                        slot.slotNumber ||
                        ""
                    )
                    .trim()
                    .toUpperCase()

                    ===

                    selectedSlotId

                );

            }
        );


    if (!firebaseSlot) {

        alert(
            "Parking slot not found."
        );

        return;

    }


    const confirmed =
        confirm(
            `Release reserved slot ${selectedSlotId}?`
        );


    if (!confirmed) return;


    try {

        const slotRef =
            doc(
                db,
                "slots",
                firebaseSlot.id
            );


        await updateDoc(
            slotRef,
            {

                status:
                    "available",

                reservedAt:
                    null,

                reservedBy:
                    null

            }
        );


        alert(
            `Slot ${selectedSlotId} is now available.`
        );


        await loadParkingData();

    }

    catch (error) {

        console.error(
            "Release slot error:",
            error
        );


        alert(
            "Failed to release slot:\n" +
            error.message
        );

    }

}


// ============================================================
// MARK SLOT AS MAINTENANCE
// ============================================================

async function markSelectedSlotMaintenance() {

    if (!selectedSlotId) {

        alert(
            "Please select a slot first."
        );

        return;

    }


    const firebaseSlot =
        allSlots.find(
            slot => {

                return (

                    String(
                        slot.slotNumber ||
                        ""
                    )
                    .trim()
                    .toUpperCase()

                    ===

                    selectedSlotId

                );

            }
        );


    if (!firebaseSlot) {

        alert(
            "Parking slot not found."
        );

        return;

    }


    const currentStatus =
        getSlotStatus(
            firebaseSlot,
            getActiveBooking(
                selectedSlotId
            )
        );


    if (
        currentStatus !==
        "available"
    ) {

        alert(
            "Only available slots can be placed under maintenance."
        );

        return;

    }


    const reason =
        prompt(
            `Enter maintenance reason for Slot ${selectedSlotId}:`
        );


    if (reason === null) return;


    const maintenanceReason =
        reason.trim() ||
        "General maintenance";


    const confirmed =
        confirm(
            `Mark Slot ${selectedSlotId} as maintenance?\n\nReason: ${maintenanceReason}`
        );


    if (!confirmed) return;


    try {

        const slotRef =
            doc(
                db,
                "slots",
                firebaseSlot.id
            );


        await updateDoc(
            slotRef,
            {

                status:
                    "maintenance",

                maintenanceReason:
                    maintenanceReason,

                maintenanceAt:
                    new Date()
                        .toLocaleString()

            }
        );


        alert(
            `Slot ${selectedSlotId} is now under maintenance.`
        );


        await loadParkingData();

    }

    catch (error) {

        console.error(
            "Maintenance error:",
            error
        );


        alert(
            "Failed to update maintenance status:\n" +
            error.message
        );

    }

}


// ============================================================
// CLEAR MAINTENANCE
// ============================================================

async function clearSelectedMaintenance() {

    if (!selectedSlotId) {

        alert(
            "Please select a slot first."
        );

        return;

    }


    const firebaseSlot =
        allSlots.find(
            slot => {

                return (

                    String(
                        slot.slotNumber ||
                        ""
                    )
                    .trim()
                    .toUpperCase()

                    ===

                    selectedSlotId

                );

            }
        );


    if (!firebaseSlot) {

        alert(
            "Parking slot not found."
        );

        return;

    }


    const confirmed =
        confirm(
            `Mark Slot ${selectedSlotId} as available?`
        );


    if (!confirmed) return;


    try {

        const slotRef =
            doc(
                db,
                "slots",
                firebaseSlot.id
            );


        await updateDoc(
            slotRef,
            {

                status:
                    "available",

                maintenanceReason:
                    null,

                maintenanceAt:
                    null

            }
        );


        alert(
            `Slot ${selectedSlotId} is now available.`
        );


        await loadParkingData();

    }

    catch (error) {

        console.error(
            "Clear maintenance error:",
            error
        );


        alert(
            "Failed to clear maintenance:\n" +
            error.message
        );

    }

}


// ============================================================
// FORMAT STATUS
// ============================================================

function formatStatus(status) {

    if (!status) {

        return "-";

    }


    return (

        status
            .charAt(0)
            .toUpperCase()

        +

        status
            .slice(1)
            .toLowerCase()

    );

}


// ============================================================
// FORMAT TIMESTAMP
// ============================================================

function formatTimestamp(timestamp) {

    if (!timestamp) {

        return "-";

    }


    // Firestore Timestamp
    if (
        typeof timestamp.toDate ===
        "function"
    ) {

        return timestamp
            .toDate()
            .toLocaleString();

    }


    return String(timestamp);

}


// ============================================================
// AI SMART RECOMMENDATION
// ============================================================

function updateAIRecommendation() {

    const recommendedSlot =
        document.getElementById(
            "recommendedSlot"
        );


    const recommendReason =
        document.getElementById(
            "recommendReason"
        );


    if (
        !recommendedSlot ||
        !recommendReason
    ) {

        return;

    }


    const slots =
        document.querySelectorAll(
            ".parking-slot"
        );


    let firstAvailable =
        null;


    // Find first available slot
    for (
        const slotElement of slots
    ) {

        const status =
            slotElement.dataset.status;


        if (
            status ===
            "available"
        ) {

            firstAvailable =
                slotElement.dataset.slot;

            break;

        }

    }


    // Remove old recommendation
    document.querySelectorAll(
        ".parking-slot"
    ).forEach(
        slot => {

            slot.classList.remove(
                "active"
            );

        }
    );


    // Show recommendation
    if (firstAvailable) {

        recommendedSlot.textContent =
            firstAvailable;


        recommendReason.textContent =
            "Nearest available parking slot";


        const recommendedElement =
            document.querySelector(
                `.parking-slot[data-slot="${firstAvailable}"]`
            );


        if (recommendedElement) {

            recommendedElement.classList.add(
                "active"
            );

        }

    }

    else {

        recommendedSlot.textContent =
            "FULL";


        recommendReason.textContent =
            "No parking slots are currently available.";

    }

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

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
// END
// ============================================================

console.log(
    "parking-slots.js loaded successfully."
);