import { db } from "./firebase.js";
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    query,
    where,
    doc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

// ==========================================================
// HTML ELEMENTS
// ==========================================================

const verifyBtn =
    document.getElementById("verifyBtn");

const sendOtpBtn =
    document.getElementById("sendOtpBtn");

const verifyOtpBtn =
    document.getElementById("verifyOtpBtn");

const resultContainer =
    document.getElementById("resultContainer");

const otpSection =
    document.getElementById("otpSection");

const ownerSection =
    document.getElementById("ownerSection");

const ownerSlot =
    document.getElementById("ownerSlot");

const entryDecision =
    document.getElementById("entryDecision");

const entryDecisionTitle =
    document.getElementById("entryDecisionTitle");

const entryDecisionMessage =
    document.getElementById("entryDecisionMessage");

const entryActions =
    document.getElementById("entryActions");

const allowEntryBtn =
    document.getElementById("allowEntryBtn");

const denyEntryBtn =
    document.getElementById("denyEntryBtn");
// ===============================
// VEHICLE EXIT ELEMENTS
// ===============================

const exitVehicleNumber =
    document.getElementById("exitVehicleNumber");

const verifyExitBtn =
    document.getElementById("verifyExitBtn");

const exitResult =
    document.getElementById("exitResult");

const exitVehicleDisplay =
    document.getElementById("exitVehicleDisplay");

const exitOwnerDisplay =
    document.getElementById("exitOwnerDisplay");

const exitDoorDisplay =
    document.getElementById("exitDoorDisplay");

const exitSlotDisplay =
    document.getElementById("exitSlotDisplay");

const exitEntryTimeDisplay =
    document.getElementById("exitEntryTimeDisplay");

const exitDecision =
    document.getElementById("exitDecision");

const exitDecisionTitle =
    document.getElementById("exitDecisionTitle");

const exitDecisionMessage =
    document.getElementById("exitDecisionMessage");

const allowExitBtn =
    document.getElementById("allowExitBtn");


// Stores the entry found during exit verification
let currentExitEntry = null;


// ==========================================================
// VARIABLES
// ==========================================================

let generatedOTP = "";

let currentVehicle = null;

let currentOwner = null;

let currentBooking = null;


// ==========================================================
// VERIFY VEHICLE BUTTON
// ==========================================================

verifyBtn.addEventListener(
    "click",
    verifyVehicle
);


// ==========================================================
// VERIFY VEHICLE
// ==========================================================

async function verifyVehicle() {

    const input =
        document
            .getElementById("aiPrompt")
            .value
            .trim()
            .toUpperCase();


    if (input === "") {

        alert(
            "Please enter a vehicle number."
        );

        return;

    }


    // Extract Indian vehicle number

    const match =
        input.match(
            /[A-Z]{2}[0-9]{2}[A-Z]{1,3}[0-9]{4}/
        );


    if (!match) {

        alert(
            "Vehicle number not found."
        );

        return;

    }


    const vehicleNumber =
        match[0];


    console.log(
        "🔎 Searching vehicle:",
        vehicleNumber
    );


    try {

        // ==================================================
        // STEP 1 — FIND VEHICLE
        // ==================================================

        const vehicleQuery =
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


        const vehicleSnapshot =
            await getDocs(
                vehicleQuery
            );


        // Vehicle doesn't exist

        if (
            vehicleSnapshot.empty
        ) {

            showVehicleNotFound(
                vehicleNumber
            );

            return;

        }


        const vehicleDoc =
            vehicleSnapshot.docs[0];


        const vehicle =
            vehicleDoc.data();


        currentVehicle = {

            id:
                vehicleDoc.id,

            ...vehicle

        };


        console.log(
            "🚗 Vehicle found:",
            currentVehicle
        );


        // ==================================================
        // STEP 2 — FIND OWNER
        // ==================================================

        if (!vehicle.userId) {

            showVerificationResult(
                "REGISTERED",
                "Vehicle is registered but owner information is missing."
            );

            return;

        }


        const ownerRef =
            doc(
                db,
                "users",
                vehicle.userId
            );


        const ownerSnapshot =
            await getDoc(
                ownerRef
            );


        if (
            !ownerSnapshot.exists()
        ) {

            showVerificationResult(
                "ERROR",
                "Vehicle owner account was not found."
            );

            return;

        }


        currentOwner =
            ownerSnapshot.data();


        console.log(
            "👤 Owner found:",
            currentOwner
        );


        // ==================================================
        // STEP 3 — FIND ACTIVE BOOKING
        // ==================================================

        const bookingQuery =
            query(
                collection(
                    db,
                    "bookings"
                ),

                where(
                    "userId",
                    "==",
                    vehicle.userId
                ),

                where(
                    "vehicleNumber",
                    "==",
                    vehicleNumber
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


        // No active booking

        if (
            bookingSnapshot.empty
        ) {

            currentBooking = null;


            showVehicleDetails(
                "NO ACTIVE BOOKING"
            );


            sendOtpBtn.style.display =
                "none";


            otpSection.style.display =
                "none";


            ownerSection.style.display =
                "none";


            entryActions.style.display =
                "none";


            alert(
                "This vehicle is registered, but it does not have an active parking booking."
            );


            return;

        }


        // ==================================================
        // ACTIVE BOOKING FOUND
        // ==================================================

        const bookingDoc =
            bookingSnapshot.docs[0];


        currentBooking = {

            id:
                bookingDoc.id,

            ...bookingDoc.data()

        };


        console.log(
            "🅿 Active booking:",
            currentBooking
        );


        // ==================================================
        // SHOW VEHICLE
        // ==================================================

        showVehicleDetails(
            "BOOKING VERIFIED"
        );


        sendOtpBtn.style.display =
            "inline-block";


        otpSection.style.display =
            "none";


        ownerSection.style.display =
            "none";


        entryActions.style.display =
            "none";


        entryDecision.style.display =
            "none";


        document
            .getElementById("otpInput")
            .value = "";

    }

    catch (error) {

        console.error(
            "Vehicle verification error:",
            error
        );


        alert(
            "Verification failed: " +
            error.message
        );

    }

}


// ==========================================================
// SHOW VEHICLE DETAILS
// ==========================================================

function showVehicleDetails(
    status
) {

    resultContainer.style.display =
        "block";


    const badge =
        document.getElementById(
            "vehicleBadge"
        );


    badge.innerText =
        status;


    badge.className =
        "verified-badge";


    document
        .getElementById("vehicleNumber")
        .innerText =
        currentVehicle.vehicleNumber ||
        "--";


    document
        .getElementById("vehicleBrand")
        .innerText =
        currentVehicle.vehicleBrand ||
        "--";


    document
        .getElementById("vehicleModel")
        .innerText =
        currentVehicle.vehicleModel ||
        "--";


    document
        .getElementById("vehicleColor")
        .innerText =
        currentVehicle.vehicleColor ||
        "--";


    document
        .getElementById("verificationStatus")
        .innerText =
        status;


    // Vehicle image

    const vehicleImage =
        document.getElementById(
            "vehicleImage"
        );


    if (
        currentVehicle.vehicleImage
    ) {

        vehicleImage.src =
            currentVehicle.vehicleImage;

    }

    else {

        vehicleImage.src =
            "https://placehold.co/500x300/111827/FFFFFF?text=No+Vehicle+Photo";

    }

}


// ==========================================================
// VEHICLE NOT FOUND
// ==========================================================

function showVehicleNotFound(
    vehicleNumber
) {

    currentVehicle = null;

    currentOwner = null;

    currentBooking = null;


    resultContainer.style.display =
        "block";


    const badge =
        document.getElementById(
            "vehicleBadge"
        );


    badge.innerText =
        "NOT REGISTERED";


    badge.className =
        "visitor-badge";


    document
        .getElementById("vehicleNumber")
        .innerText =
        vehicleNumber;


    document
        .getElementById("vehicleBrand")
        .innerText =
        "--";


    document
        .getElementById("vehicleModel")
        .innerText =
        "--";


    document
        .getElementById("vehicleColor")
        .innerText =
        "--";


    document
        .getElementById("verificationStatus")
        .innerText =
        "Vehicle Not Registered";


    document
        .getElementById("vehicleImage")
        .src =
        "https://placehold.co/500x300/111827/FFFFFF?text=Vehicle+Not+Registered";


    sendOtpBtn.style.display =
        "none";


    otpSection.style.display =
        "none";


    ownerSection.style.display =
        "none";


    entryActions.style.display =
        "none";


    entryDecision.style.display =
        "none";


    alert(
        "This vehicle is not registered in SmartPark."
    );

}


// ==========================================================
// SEND OTP
// ==========================================================

sendOtpBtn.addEventListener(
    "click",
    sendOTP
);


function sendOTP() {

    if (!currentVehicle) {

        alert(
            "Please verify a vehicle first."
        );

        return;

    }


    if (!currentBooking) {

        alert(
            "This vehicle does not have an active booking."
        );

        return;

    }


    generatedOTP =
        Math.floor(
            100000 +
            Math.random() * 900000
        ).toString();


    console.log(
        "🔐 Generated OTP:",
        generatedOTP
    );


    otpSection.style.display =
        "block";


    alert(
        "Demo OTP: " +
        generatedOTP
    );

}


// ==========================================================
// VERIFY OTP
// ==========================================================

verifyOtpBtn.addEventListener(
    "click",
    verifyOTP
);


async function verifyOTP() {

    const enteredOTP =
        document
            .getElementById("otpInput")
            .value
            .trim();


    if (enteredOTP === "") {

        alert(
            "Please enter the OTP."
        );

        return;

    }


    if (
        enteredOTP !==
        generatedOTP
    ) {

        alert(
            "Invalid OTP."
        );

        return;

    }


    if (
        !currentVehicle ||
        !currentOwner ||
        !currentBooking
    ) {

        alert(
            "Vehicle verification information is incomplete."
        );

        return;

    }


    try {

        verifyOtpBtn.disabled =
            true;


        verifyOtpBtn.innerText =
            "Verifying...";


        // ==================================================
        // CREATE VERIFICATION LOG
        // ==================================================
await addDoc(
    collection(db, "verificationLogs"),
    {
        vehicleId: currentVehicle.id,

        vehicleNumber:
            currentVehicle.vehicleNumber || "",

        vehicleType:
            currentVehicle.vehicleType || "",

        vehicleBrand:
            currentVehicle.vehicleBrand || "",

        vehicleModel:
            currentVehicle.vehicleModel || "",

        vehicleColor:
            currentVehicle.vehicleColor || "",

        userId:
            currentVehicle.userId || "",

        ownerName:
            currentOwner.fullName || "",

        phone:
            currentOwner.phone || "",

        doorNumber:
            currentOwner.doorNumber || "",

        bookingId:
            currentBooking.id || "",

        slotId:
            currentBooking.slotId || "",

        slotNumber:
            currentBooking.slotNumber || "",

        // Firebase timestamp
        verifiedAt: serverTimestamp(),

        // Easy date filtering
        verifiedDate:
            new Date().toISOString().split("T")[0],

        // Keep status lowercase
        status: "verified",

        // Verification type
        verificationType: "vehicle"
    }
);


        // ==================================================
        // SHOW OWNER
        // ==================================================

        ownerSection.style.display =
            "block";


        document
            .getElementById("ownerName")
            .innerText =
            currentOwner.fullName ||
            "--";


        document
            .getElementById("ownerPhone")
            .innerText =
            currentOwner.phone ||
            "--";


        document
            .getElementById("ownerDoor")
            .innerText =
            currentOwner.doorNumber ||
            "--";


        // ==================================================
        // SHOW SLOT
        // ==================================================

        ownerSlot.innerText =
            currentBooking.slotNumber ||
            "--";


        // ==================================================
        // SHOW ENTRY BUTTONS
        // ==================================================

        entryDecision.style.display =
            "none";


        entryActions.style.display =
            "flex";


        // ==================================================
        // UPDATE STATUS
        // ==================================================

        document
            .getElementById(
                "verificationStatus"
            )
            .innerText =
            "VERIFIED";


        document
            .getElementById(
                "vehicleBadge"
            )
            .innerText =
            "VERIFIED";


        document
            .getElementById(
                "vehicleBadge"
            )
            .className =
            "verified-badge";


        verifyOtpBtn.innerText =
            "Verified";


        alert(
            "✅ Vehicle Verified Successfully!\n\n" +
            "Vehicle: " +
            currentVehicle.vehicleNumber +
            "\n" +
            "Owner: " +
            currentOwner.fullName +
            "\n" +
            "Slot: " +
            currentBooking.slotNumber
        );

    }

    catch (error) {

        console.error(
            "OTP verification error:",
            error
        );


        alert(
            "Verification failed: " +
            error.message
        );


        verifyOtpBtn.disabled =
            false;


        verifyOtpBtn.innerText =
            "Verify OTP";

    }

}


// ==========================================================
// ENTRY BUTTONS
// ==========================================================

allowEntryBtn.addEventListener(
    "click",
    allowEntry
);


denyEntryBtn.addEventListener(
    "click",
    denyEntry
);


// ==========================================================
// ALLOW ENTRY
// ==========================================================

async function allowEntry() {

    if (
        !currentVehicle ||
        !currentOwner ||
        !currentBooking
    ) {

        alert(
            "Vehicle verification is incomplete."
        );

        return;

    }


    const confirmed =
        confirm(
            `Allow ${currentVehicle.vehicleNumber} to enter?\n\n` +
            `Owner: ${currentOwner.fullName}\n` +
            `Slot: ${currentBooking.slotNumber}`
        );


    if (!confirmed) return;


    try {

        allowEntryBtn.disabled =
            true;

        denyEntryBtn.disabled =
            true;


        allowEntryBtn.innerText =
            "Processing...";


        // ==================================================
        // CREATE ENTRY LOG
        // ==================================================

        await addDoc(
            collection(
                db,
                "entryLogs"
            ),
            {

                vehicleId:
                    currentVehicle.id,

                vehicleNumber:
                    currentVehicle.vehicleNumber,

                vehicleType:
                    currentVehicle.vehicleType ||
                    "",

                vehicleBrand:
                    currentVehicle.vehicleBrand ||
                    "",

                vehicleModel:
                    currentVehicle.vehicleModel ||
                    "",

                vehicleColor:
                    currentVehicle.vehicleColor ||
                    "",

                userId:
                    currentVehicle.userId,

                ownerName:
                    currentOwner.fullName ||
                    "",

                phone:
                    currentOwner.phone ||
                    "",

                doorNumber:
                    currentOwner.doorNumber ||
                    "",

                bookingId:
                    currentBooking.id,

                slotId:
                    currentBooking.slotId,

                slotNumber:
                    currentBooking.slotNumber,

                entryTime:
                    new Date().toLocaleString(),

                status:
                    "inside"

            }
        );


        // ==================================================
        // SHOW SUCCESS
        // ==================================================

        entryDecision.style.display =
            "block";


        entryActions.style.display =
            "none";


        entryDecisionTitle.innerText =
            "🟢 ENTRY ALLOWED";


        entryDecisionMessage.innerText =
            `${currentVehicle.vehicleNumber} is allowed to enter. ` +
            `Proceed to Slot ${currentBooking.slotNumber}.`;


        entryDecision.style.background =
            "#123d24";


        entryDecision.style.border =
            "1px solid #22c55e";


        document
            .getElementById(
                "verificationStatus"
            )
            .innerText =
            "ENTRY ALLOWED";


        alert(
            "✅ Entry Allowed!\n\n" +
            "Vehicle: " +
            currentVehicle.vehicleNumber +
            "\n" +
            "Slot: " +
            currentBooking.slotNumber
        );


        console.log(
            "🟢 Entry allowed:",
            currentVehicle.vehicleNumber
        );

    }

    catch (error) {

        console.error(
            "Entry log error:",
            error
        );


        alert(
            "Failed to allow entry:\n" +
            error.message
        );


        allowEntryBtn.disabled =
            false;


        denyEntryBtn.disabled =
            false;


        allowEntryBtn.innerText =
            "Allow Entry";

    }

}
// ==================================================
// VERIFY VEHICLE EXIT
// ==================================================

async function verifyVehicleExit() {

    const vehicleNumber =
        exitVehicleNumber.value.trim().toUpperCase();


    // --------------------------------------------------
    // Validate input
    // --------------------------------------------------

    if (!vehicleNumber) {

        alert("Please enter a vehicle number.");

        return;

    }


    try {

        verifyExitBtn.disabled = true;

        verifyExitBtn.innerText =
            "Searching...";


        // --------------------------------------------------
        // Find active entry log
        // --------------------------------------------------

        const entryQuery =
            query(
                collection(db, "entryLogs"),
                where(
                    "vehicleNumber",
                    "==",
                    vehicleNumber
                ),
                where(
                    "status",
                    "==",
                    "inside"
                )
            );


        const entrySnapshot =
            await getDocs(entryQuery);


        // --------------------------------------------------
        // Vehicle is not inside
        // --------------------------------------------------

        if (entrySnapshot.empty) {

            exitResult.style.display = "none";

            alert(
                "No active entry found for this vehicle.\n\n" +
                "The vehicle may already have exited."
            );

            verifyExitBtn.disabled = false;

            verifyExitBtn.innerText =
                "🔍 Verify Vehicle Exit";

            return;

        }


        // --------------------------------------------------
        // Get active entry
        // --------------------------------------------------

        const entryDoc =
            entrySnapshot.docs[0];


        const entry =
            entryDoc.data();


        currentExitEntry = {

            id: entryDoc.id,

            ...entry

        };


        console.log(
            "🚗 Active exit entry found:",
            currentExitEntry
        );


        // --------------------------------------------------
        // Display details
        // --------------------------------------------------

        exitVehicleDisplay.textContent =
            entry.vehicleNumber || vehicleNumber;


        exitOwnerDisplay.textContent =
            entry.ownerName || "N/A";


        exitDoorDisplay.textContent =
            entry.doorNumber || "N/A";


        exitSlotDisplay.textContent =
            entry.slotNumber || "N/A";


        exitEntryTimeDisplay.textContent =
            entry.entryTime || "N/A";


        // --------------------------------------------------
        // Show result
        // --------------------------------------------------

        exitResult.style.display =
            "block";


        exitDecisionTitle.textContent =
            "🟢 VEHICLE FOUND INSIDE";


        exitDecisionMessage.textContent =
            `${entry.vehicleNumber} is currently inside the parking area. ` +
            `Parking Slot ${entry.slotNumber} is occupied by this vehicle.`;


        exitDecision.style.background =
            "#123d24";


        exitDecision.style.border =
            "1px solid #22c55e";


        allowExitBtn.disabled = false;


        console.log(
            "🟢 Vehicle ready for exit:",
            vehicleNumber
        );

    }

    catch (error) {

        console.error(
            "Exit verification error:",
            error
        );


        alert(
            "Failed to verify vehicle exit:\n" +
            error.message
        );

    }

    finally {

        verifyExitBtn.disabled = false;

        verifyExitBtn.innerText =
            "🔍 Verify Vehicle Exit";

    }

}
// ==========================================================
// ALLOW VEHICLE EXIT
// ==========================================================

async function allowVehicleExit() {

    // ------------------------------------------------------
    // Check whether vehicle was verified for exit
    // ------------------------------------------------------

    if (!currentExitEntry) {

        alert(
            "Please verify the vehicle first."
        );

        return;

    }


    // ------------------------------------------------------
    // Confirmation
    // ------------------------------------------------------

    const confirmed =
        confirm(
            `Allow ${currentExitEntry.vehicleNumber} to exit?\n\n` +
            `Owner: ${currentExitEntry.ownerName || "N/A"}\n` +
            `Slot: ${currentExitEntry.slotNumber || "N/A"}`
        );


    if (!confirmed) {

        return;

    }


    // ------------------------------------------------------
    // Find the button
    // Supports both IDs
    // ------------------------------------------------------

    const button =
        document.querySelector(
            "#allowExitBtn, #allowVehicleExitBtn"
        );


    try {

        // --------------------------------------------------
        // Disable button
        // --------------------------------------------------

        if (button) {

            button.disabled = true;

            button.innerText =
                "Processing...";

        }


        // ==================================================
        // 1. UPDATE ENTRY LOG
        // ==================================================

        await updateDoc(

            doc(
                db,
                "entryLogs",
                currentExitEntry.id
            ),

            {

                status: "exited",

                exitTime:
                    new Date().toLocaleString()

            }

        );


        console.log(
            "✅ Entry log updated."
        );


        // ==================================================
        // 2. COMPLETE BOOKING
        // ==================================================

        if (
            currentExitEntry.bookingId
        ) {

            await updateDoc(

                doc(
                    db,
                    "bookings",
                    currentExitEntry.bookingId
                ),

                {

                    status: "completed",

                    exitTime:
                        new Date().toLocaleString()

                }

            );


            console.log(
                "✅ Booking completed."
            );

        }


        // ==================================================
        // 3. FREE PARKING SLOT
        // ==================================================

        if (
            currentExitEntry.slotId
        ) {

            await updateDoc(

                doc(
                    db,
                    "slots",
                    currentExitEntry.slotId
                ),

                {

                    status: "available"

                }

            );


            console.log(
                "✅ Parking slot is now available."
            );

        }


        // ==================================================
        // 4. SHOW SUCCESS
        // ==================================================

        if (exitDecision) {

            exitDecision.style.display =
                "block";

            exitDecision.style.background =
                "#123d24";

            exitDecision.style.border =
                "1px solid #22c55e";

        }


        if (exitDecisionTitle) {

            exitDecisionTitle.textContent =
                "🟢 EXIT ALLOWED";

        }


        if (exitDecisionMessage) {

            exitDecisionMessage.textContent =
                `${currentExitEntry.vehicleNumber} has been allowed to exit. ` +
                `Slot ${currentExitEntry.slotNumber} is now available.`;

        }


        // --------------------------------------------------
        // Hide Allow Exit button
        // --------------------------------------------------

        if (button) {

            button.style.display =
                "none";

        }


        // ==================================================
        // SUCCESS MESSAGE
        // ==================================================

        alert(

            "✅ Vehicle Exit Successful!\n\n" +

            "Vehicle: " +
            currentExitEntry.vehicleNumber +

            "\nSlot: " +
            currentExitEntry.slotNumber +

            "\n\nParking slot is now available."

        );


        console.log(
            "🟢 Vehicle exited:",
            currentExitEntry.vehicleNumber
        );


        // ==================================================
        // CLEAR CURRENT EXIT
        // ==================================================

        currentExitEntry = null;


        // --------------------------------------------------
        // Clear exit input
        // --------------------------------------------------

        if (exitVehicleNumber) {

            exitVehicleNumber.value = "";

        }

    }


    catch (error) {

        console.error(
            "❌ Vehicle exit error:",
            error
        );


        alert(
            "Failed to process vehicle exit:\n\n" +
            error.message
        );


        // --------------------------------------------------
        // Re-enable button
        // --------------------------------------------------

        if (button) {

            button.disabled =
                false;

            button.innerText =
                "Allow Vehicle Exit";

        }

    }

}


// ==========================================================
// DENY ENTRY
// ==========================================================

async function denyEntry() {

    if (!currentVehicle) {

        alert(
            "No vehicle selected."
        );

        return;

    }


    const confirmed =
        confirm(
            `Deny entry for ${currentVehicle.vehicleNumber}?`
        );


    if (!confirmed) return;


    try {

        allowEntryBtn.disabled =
            true;

        denyEntryBtn.disabled =
            true;


        denyEntryBtn.innerText =
            "Processing...";


        // ==================================================
        // CREATE DENIED ENTRY LOG
        // ==================================================

        await addDoc(
            collection(
                db,
                "entryLogs"
            ),
            {

                vehicleId:
                    currentVehicle.id,

                vehicleNumber:
                    currentVehicle.vehicleNumber,

                vehicleType:
                    currentVehicle.vehicleType ||
                    "",

                vehicleBrand:
                    currentVehicle.vehicleBrand ||
                    "",

                vehicleModel:
                    currentVehicle.vehicleModel ||
                    "",

                vehicleColor:
                    currentVehicle.vehicleColor ||
                    "",

                userId:
                    currentVehicle.userId ||
                    "",

                ownerName:
                    currentOwner
                        ? currentOwner.fullName
                        : "",

                phone:
                    currentOwner
                        ? currentOwner.phone
                        : "",

                doorNumber:
                    currentOwner
                        ? currentOwner.doorNumber
                        : "",

                bookingId:
                    currentBooking
                        ? currentBooking.id
                        : "",

                slotId:
                    currentBooking
                        ? currentBooking.slotId
                        : "",

                slotNumber:
                    currentBooking
                        ? currentBooking.slotNumber
                        : "",

                entryTime:
                    new Date().toLocaleString(),

                status:
                    "denied"

            }
        );


        // ==================================================
        // SHOW DENIED
        // ==================================================

        entryDecision.style.display =
            "block";


        entryActions.style.display =
            "none";


        entryDecisionTitle.innerText =
            "🔴 ENTRY DENIED";


        entryDecisionMessage.innerText =
            `${currentVehicle.vehicleNumber} is not allowed to enter the premises.`;


        entryDecision.style.background =
            "#451a1a";


        entryDecision.style.border =
            "1px solid #ef4444";


        document
            .getElementById(
                "verificationStatus"
            )
            .innerText =
            "ENTRY DENIED";


        alert(
            "🔴 Entry Denied."
        );


        console.log(
            "🔴 Entry denied:",
            currentVehicle.vehicleNumber
        );

    }

    catch (error) {

        console.error(
            "Denied entry log error:",
            error
        );


        alert(
            "Failed to record entry decision:\n" +
            error.message
        );


        allowEntryBtn.disabled =
            false;


        denyEntryBtn.disabled =
            false;


        denyEntryBtn.innerText =
            "Deny Entry";

    }

}


// ==========================================================
// FALLBACK RESULT FUNCTION
// ==========================================================

function showVerificationResult(
    status,
    message
) {

    resultContainer.style.display =
        "block";


    const badge =
        document.getElementById(
            "vehicleBadge"
        );


    badge.innerText =
        status;


    document
        .getElementById(
            "verificationStatus"
        )
        .innerText =
        message;


    sendOtpBtn.style.display =
        "none";


    otpSection.style.display =
        "none";


    ownerSection.style.display =
        "none";


    entryActions.style.display =
        "none";


    entryDecision.style.display =
        "none";

}
// ==========================================================
// VEHICLE EXIT BUTTON CONNECTION
// ==========================================================

console.log("🚪 Setting up Vehicle Exit...");


// ----------------------------------------------------------
// VERIFY VEHICLE EXIT
// ----------------------------------------------------------

const exitVerifyButton =
    document.getElementById("verifyExitBtn");


if (exitVerifyButton) {

    exitVerifyButton.addEventListener(
        "click",
        async function () {

            console.log(
                "🚪 Verify Vehicle Exit clicked"
            );

            await verifyVehicleExit();

        }
    );


    console.log(
        "✅ Vehicle Exit button connected."
    );

}
else {

    console.error(
        "❌ verifyExitBtn not found in HTML."
    );

}


// ==========================================================
// ALLOW VEHICLE EXIT BUTTON
// ==========================================================
//
// IMPORTANT:
// The Allow Vehicle Exit button appears only after
// Verify Vehicle Exit is clicked.
//
// Therefore we use EVENT DELEGATION instead of searching
// for the button only once when the page loads.
// ==========================================================

document.addEventListener(
    "click",
    async function (event) {

        const button =
            event.target.closest(
                "#allowExitBtn, #allowVehicleExitBtn"
            );


        if (!button) {

            return;

        }


        console.log(
            "🚪 Allow Vehicle Exit clicked"
        );


        // Prevent multiple clicks
        if (button.disabled) {

            return;

        }


        await allowVehicleExit();

    }
);


console.log(
    "✅ Allow Vehicle Exit listener ready."
);