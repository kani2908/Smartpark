/* =========================================================
   SMARTPARK AI
   SIMPLE VEHICLE VERIFICATION
========================================================= */


import { db } from "./firebase.js";

import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


console.log(
    "🚗 SmartPark Simple Vehicle Verification loaded"
);


/* =========================================================
   HTML ELEMENTS
========================================================= */

const vehicleNumberInput =
    document.getElementById(
        "vehicleNumber"
    );


const checkVehicleBtn =
    document.getElementById(
        "checkVehicleBtn"
    );


const vehicleSearchStatus =
    document.getElementById(
        "vehicleSearchStatus"
    );


const vehicleVerificationResult =
    document.getElementById(
        "vehicleVerificationResult"
    );


/* =========================================================
   VALIDATE ELEMENTS
========================================================= */

console.log(
    "🔍 Vehicle number input:",
    vehicleNumberInput
);


console.log(
    "🔍 Check vehicle button:",
    checkVehicleBtn
);


console.log(
    "🔍 Result container:",
    vehicleVerificationResult
);


/* =========================================================
   NORMALIZE VEHICLE NUMBER
========================================================= */

function normalizeVehicleNumber(
    value
) {

    return String(
        value || ""
    )
        .toUpperCase()
        .replace(
            /[^A-Z0-9]/g,
            ""
        );

}


/* =========================================================
   VALIDATE INDIAN VEHICLE NUMBER
========================================================= */

function isValidVehicleNumber(
    number
) {

    /*
     * Examples:
     *
     * KA03NT8821
     * TN01AB1234
     * MH12XY4567
     */

    return /^[A-Z]{2}[0-9]{2}[A-Z]{1,3}[0-9]{4}$/
        .test(number);

}


/* =========================================================
   SHOW SEARCH STATUS
========================================================= */

function showSearchStatus(
    message,
    type = "info"
) {

    if (!vehicleSearchStatus) {
        return;
    }


    vehicleSearchStatus.textContent =
        message;


    vehicleSearchStatus.className =
        `vehicle-search-status show ${type}`;

}


/* =========================================================
   CLEAR SEARCH STATUS
========================================================= */

function clearSearchStatus() {

    if (!vehicleSearchStatus) {
        return;
    }


    vehicleSearchStatus.textContent =
        "";


    vehicleSearchStatus.className =
        "vehicle-search-status";

}


/* =========================================================
   CLEAR RESULT
========================================================= */

function clearResult() {

    if (!vehicleVerificationResult) {
        return;
    }


    vehicleVerificationResult.innerHTML =
        "";


    vehicleVerificationResult.className =
        "vehicle-verification-result";

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
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


/* =========================================================
   SHOW REGISTERED VEHICLE
========================================================= */

function showRegisteredVehicle(
    vehicle,
    owner = null
) {

    if (!vehicleVerificationResult) {
        return;
    }


    const vehicleNumber =
        vehicle.vehicleNumber ||
        vehicle.vehicleNo ||
        vehicle.registrationNumber ||
        vehicle.registrationNo ||
        vehicle.numberPlate ||
        "N/A";


    const ownerName =
        vehicle.ownerName ||
        vehicle.name ||
        vehicle.fullName ||
        owner?.fullName ||
        owner?.name ||
        "Registered Resident";


    const doorNumber =
        vehicle.doorNumber ||
        vehicle.flatNumber ||
        vehicle.apartmentNumber ||
        owner?.doorNumber ||
        owner?.flatNumber ||
        "N/A";


    const phone =
        vehicle.phone ||
        owner?.phone ||
        "N/A";


    const vehicleType =
        vehicle.vehicleType ||
        "N/A";


    const vehicleBrand =
        vehicle.vehicleBrand ||
        vehicle.brand ||
        "N/A";


    const vehicleModel =
        vehicle.vehicleModel ||
        vehicle.model ||
        "N/A";


    const vehicleColor =
        vehicle.vehicleColor ||
        vehicle.color ||
        "N/A";


    const status =
        vehicle.status ||
        "active";


    vehicleVerificationResult.innerHTML = `

        <div class="result-header">

            <div class="result-icon">

                <i class="fa-solid fa-check"></i>

            </div>

            <div>

                <h3>
                    Vehicle Registered
                </h3>

                <p>
                    This vehicle exists in the apartment database.
                </p>

            </div>

        </div>


        <div class="vehicle-details">


            <div class="detail-item">

                <span class="detail-label">
                    Registration Number
                </span>

                <span class="detail-value">
                    ${escapeHTML(vehicleNumber)}
                </span>

            </div>


            <div class="detail-item">

                <span class="detail-label">
                    Resident
                </span>

                <span class="detail-value">
                    ${escapeHTML(ownerName)}
                </span>

            </div>


            <div class="detail-item">

                <span class="detail-label">
                    Apartment / Door
                </span>

                <span class="detail-value">
                    ${escapeHTML(doorNumber)}
                </span>

            </div>


            <div class="detail-item">

                <span class="detail-label">
                    Phone
                </span>

                <span class="detail-value">
                    ${escapeHTML(phone)}
                </span>

            </div>


            <div class="detail-item">

                <span class="detail-label">
                    Vehicle Type
                </span>

                <span class="detail-value">
                    ${escapeHTML(vehicleType)}
                </span>

            </div>


            <div class="detail-item">

                <span class="detail-label">
                    Brand
                </span>

                <span class="detail-value">
                    ${escapeHTML(vehicleBrand)}
                </span>

            </div>


            <div class="detail-item">

                <span class="detail-label">
                    Model
                </span>

                <span class="detail-value">
                    ${escapeHTML(vehicleModel)}
                </span>

            </div>


            <div class="detail-item">

                <span class="detail-label">
                    Color
                </span>

                <span class="detail-value">
                    ${escapeHTML(vehicleColor)}
                </span>

            </div>


            <div class="detail-item">

                <span class="detail-label">
                    Registration Status
                </span>

                <span class="detail-value">
                    ${escapeHTML(status)}
                </span>

            </div>


        </div>

    `;


    vehicleVerificationResult.className =
        "vehicle-verification-result show success";

}


/* =========================================================
   SHOW UNREGISTERED VEHICLE
========================================================= */

function showUnregisteredVehicle(
    vehicleNumber
) {

    if (!vehicleVerificationResult) {
        return;
    }


    vehicleVerificationResult.innerHTML = `

        <div class="result-header">

            <div class="result-icon">

                <i class="fa-solid fa-xmark"></i>

            </div>

            <div>

                <h3>
                    Vehicle Not Registered
                </h3>

                <p>
                    No matching vehicle was found
                    in the apartment records.
                </p>

            </div>

        </div>


        <div class="vehicle-details">

            <div class="detail-item">

                <span class="detail-label">
                    Vehicle Number
                </span>

                <span class="detail-value">
                    ${escapeHTML(vehicleNumber)}
                </span>

            </div>


            <div class="detail-item">

                <span class="detail-label">
                    Registration Status
                </span>

                <span class="detail-value">
                    Not Registered
                </span>

            </div>

        </div>

    `;


    vehicleVerificationResult.className =
        "vehicle-verification-result show error";

}


/* =========================================================
   GET VEHICLE OWNER
========================================================= */

async function getVehicleOwner(
    vehicle
) {

    /*
     * If owner information is already
     * stored inside vehicle document,
     * no extra Firebase request is required.
     */

    if (
        vehicle.ownerName ||
        vehicle.fullName ||
        vehicle.name
    ) {

        return null;

    }


    /*
     * Existing project stores userId
     * inside the vehicles collection.
     */

    if (!vehicle.userId) {

        return null;

    }


    try {

        const ownerReference =
            doc(
                db,
                "users",
                vehicle.userId
            );


        const ownerSnapshot =
            await getDoc(
                ownerReference
            );


        if (
            !ownerSnapshot.exists()
        ) {

            return null;

        }


        return ownerSnapshot.data();

    }

    catch (error) {

        console.warn(
            "⚠️ Could not load vehicle owner:",
            error
        );


        return null;

    }

}
function showVehicleNotRegistered(vehicleNumber) {

    if (!vehicleVerificationResult) {
        console.error(
            "❌ Result container not found."
        );
        return;
    }

    console.log(
        "🔴 Showing vehicle not registered:",
        vehicleNumber
    );

    vehicleVerificationResult.innerHTML = `

        <div class="vehicle-not-registered">

            <div class="not-registered-header">

                <div class="not-registered-icon">
                    <i class="fa-solid fa-xmark"></i>
                </div>

                <div>
                    <h3>
                        Vehicle Not Registered
                    </h3>

                    <p>
                        No matching vehicle was found
                        in the apartment records.
                    </p>
                </div>

            </div>


            <div class="vehicle-details">

                <div class="detail-item">

                    <span class="detail-label">
                        Vehicle Number
                    </span>

                    <span class="detail-value">
                        ${escapeHTML(vehicleNumber)}
                    </span>

                </div>


                <div class="detail-item">

                    <span class="detail-label">
                        Registration Status
                    </span>

                    <span class="detail-value">
                        Not Registered
                    </span>

                </div>

            </div>


            <div class="vehicle-action-buttons">

    <button
        type="button"
        id="markVehicleReviewBtn"
        class="review-vehicle-btn"
    >
        <i class="fa-solid fa-flag"></i>
        Mark for Review
    </button>

    <button
        type="button"
        id="dismissVehicleBtn"
        class="dismiss-vehicle-btn"
    >
        Dismiss
    </button>

</div>

        </div>

    `;

    vehicleVerificationResult.className =
        "vehicle-verification-result show error";
        /* =====================================================
   MARK UNKNOWN VEHICLE FOR REVIEW
===================================================== */

const reviewBtn =
    document.getElementById(
        "markVehicleReviewBtn"
    );

if (reviewBtn) {

    reviewBtn.addEventListener(
        "click",
        async () => {
            const normalizedVehicleNumber =
    normalizeVehicleNumber(vehicleNumber);

            console.log(
                "🚩 Marking vehicle for review:",
                vehicleNumber
            );

            reviewBtn.disabled = true;

            reviewBtn.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Saving...
            `;

            try {

                await addDoc(
                    collection(
                        db,
                        "vehicleReviews"
                    ),
                    {
                        vehicleNumber:
                            normalizeVehicleNumber(
                                vehicleNumber
                            ),

                        status:
                            "pending",

                        reason:
                            "Vehicle not registered",

                        createdAt:
                            serverTimestamp()
                    }
                );


               vehicleVerificationResult.innerHTML = `

    <div class="vehicle-result review-success">

        <div class="result-header">

            <div class="result-icon">
                <i class="fa-solid fa-flag"></i>
            </div>

            <div>
                <h3>
                    Vehicle Marked for Review
                </h3>

                <p>
                    The unknown vehicle has been added
                    to the admin review list.
                </p>
            </div>

        </div>


        <div class="vehicle-details">

            <div class="detail-item">

                <span class="detail-label">
                    Vehicle Number
                </span>

                <strong>
                    ${escapeVehicleHTML(
                        normalizedVehicleNumber
                    )}
                </strong>

            </div>


            <div class="detail-item">

                <span class="detail-label">
                    Review Status
                </span>

                <strong>
                    Pending Review
                </strong>

            </div>

        </div>


        <div class="verification-message">

            <i class="fa-solid fa-circle-info"></i>

            The vehicle is waiting for administrator
            verification.

        </div>


        <!-- REVIEW PAGE BUTTON -->

        <div class="vehicle-action-buttons">

            <button
                type="button"
                id="openVehicleReviewsBtn"
                class="review-vehicle-btn"
            >

                <i class="fa-solid fa-clipboard-check"></i>

                Review Vehicle

            </button>

        </div>

    </div>

`;

                vehicleVerificationResult.className =
                    "vehicle-verification-result show success";
                    const openVehicleReviewsBtn =
    document.getElementById(
        "openVehicleReviewsBtn"
    );

if (openVehicleReviewsBtn) {

    openVehicleReviewsBtn.addEventListener(
        "click",
        () => {

            console.log(
                "📋 Opening Vehicle Reviews page..."
            );

            window.location.href =
                "vehicle-reviews.html";

        }
    );

}

                console.log(
                    "✅ Vehicle review saved successfully."
                );

            }

            catch (error) {

                console.error(
                    "❌ Failed to mark vehicle for review:",
                    error
                );

                reviewBtn.disabled = false;

                reviewBtn.innerHTML = `
                    <i class="fa-solid fa-flag"></i>
                    Mark for Review
                `;

                alert(
                    "Unable to save vehicle review."
                );

            }

        }
    );

}


    /* DISMISS */

    const dismissBtn =
        document.getElementById(
            "dismissVehicleBtn"
        );

    if (dismissBtn) {

        dismissBtn.addEventListener(
            "click",
            () => {

                vehicleVerificationResult.innerHTML =
                    "";

                vehicleVerificationResult.className =
                    "vehicle-verification-result";

            }
        );

    }

}


/* =========================================================
   SEARCH FIREBASE
========================================================= */
/* =========================================================
   VEHICLE REGISTRATION CHECK
   Searches vehicle and then fetches resident information
   from users/{userId}
========================================================= */

async function checkVehicleRegistration(vehicleNumber) {

    console.log(
        "🔎 Checking Firebase registration for:",
        vehicleNumber
    );

    try {

        /* -------------------------------------------------
           NORMALIZE VEHICLE NUMBER
        ------------------------------------------------- */

        const normalizedNumber =
            String(vehicleNumber || "")
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, "")
                .trim();


        if (!normalizedNumber) {

            throw new Error(
                "Please enter a valid vehicle registration number."
            );

        }


        console.log(
            "🔍 Normalized vehicle number:",
            normalizedNumber
        );


        /* -------------------------------------------------
           SEARCH VEHICLES COLLECTION
        ------------------------------------------------- */

        const vehiclesRef =
            collection(
                db,
                "vehicles"
            );


        const vehicleQuery =
            query(
                vehiclesRef,
                where(
                    "vehicleNumber",
                    "==",
                    normalizedNumber
                )
            );


        const vehicleSnapshot =
            await getDocs(
                vehicleQuery
            );


        /* -------------------------------------------------
           VEHICLE NOT FOUND
        ------------------------------------------------- */

        if (vehicleSnapshot.empty) {

            console.log(
                "❌ Vehicle NOT registered:",
                normalizedNumber
            );


            showVehicleNotRegistered(
                normalizedNumber
            );


            return {
                registered: false,
                vehicle: null,
                resident: null
            };

        }


        /* -------------------------------------------------
           GET VEHICLE DOCUMENT
        ------------------------------------------------- */

        const vehicleDoc =
            vehicleSnapshot.docs[0];


        const vehicle =
            vehicleDoc.data();


        console.log(
            "✅ Vehicle record found:",
            vehicle
        );


        /* -------------------------------------------------
           GET USER ID
        ------------------------------------------------- */

        const userId =
            vehicle.userId ||
            vehicle.ownerUid ||
            vehicle.uid ||
            "";


        console.log(
            "👤 Vehicle owner userId:",
            userId
        );


        let resident = null;


        /* -------------------------------------------------
           FETCH USER DOCUMENT
           users/{userId}
        ------------------------------------------------- */

        if (userId) {

            try {

                const userRef =
                    doc(
                        db,
                        "users",
                        userId
                    );


                const userSnapshot =
                    await getDoc(
                        userRef
                    );


                if (
                    userSnapshot.exists()
                ) {

                    resident =
                        userSnapshot.data();


                    console.log(
                        "👤 Resident record found:",
                        resident
                    );

                }
                else {

                    console.warn(
                        "⚠️ User document not found:",
                        userId
                    );

                }

            }
            catch (userError) {

                console.warn(
                    "⚠️ Unable to fetch resident information:",
                    userError
                );

            }

        }


        /* -------------------------------------------------
           COMBINE VEHICLE + RESIDENT DATA
        ------------------------------------------------- */

        const finalData = {

            /* Vehicle information */

            vehicleNumber:
                vehicle.vehicleNumber ||
                normalizedNumber,

            vehicleType:
                vehicle.vehicleType ||
                vehicle.type ||
                "N/A",

            brand:
                vehicle.vehicleBrand ||
                vehicle.brand ||
                "N/A",

            model:
                vehicle.vehicleModel ||
                vehicle.model ||
                "N/A",

            color:
                vehicle.vehicleColor ||
                vehicle.color ||
                "N/A",

            status:
                vehicle.status ||
                "active",


            /* Resident information */

            residentName:
                resident?.name ||
                resident?.fullName ||
                resident?.displayName ||
                vehicle.ownerName ||
                "N/A",

           doorNumber:
    resident?.doorNumber ||
    resident?.doorNo ||
    resident?.flatNumber ||
    resident?.flatNo ||
    "N/A",

            phone:
                resident?.phone ||
                resident?.phoneNumber ||
                resident?.mobile ||
                resident?.mobileNumber ||
                vehicle.phone ||
                vehicle.phoneNumber ||
                "N/A",

            email:
                resident?.email ||
                vehicle.ownerEmail ||
                "N/A",

            userId:
                userId

        };


        console.log(
            "📋 FINAL VEHICLE VERIFICATION DATA:",
            finalData
        );


        /* -------------------------------------------------
           DISPLAY RESULT
        ------------------------------------------------- */

        showVehicleRegistered(
            finalData
        );


        return {

            registered: true,

            vehicle:
                finalData,

            resident:
                resident

        };

    }
    catch (error) {

        console.error(
            "❌ Vehicle registration check failed:",
            error
        );


        showVehicleVerificationResult(
            `
            <strong>
                <i class="fa-solid fa-circle-xmark"></i>
                Verification Failed
            </strong>

            <br><br>

            ${error.message ||
            "Unable to check vehicle registration."}
            `,
            "error"
        );


        return {

            registered: false,

            vehicle: null,

            resident: null

        };

    }

}
/* =========================================================
   DISPLAY REGISTERED VEHICLE
========================================================= */

function showVehicleRegistered(data) {

    console.log(
        "✅ Displaying registered vehicle:",
        data
    );


    const resultHTML = `

        <div class="vehicle-result registered">

            <div class="result-header">

                <div class="result-icon">

                    <i class="fa-solid fa-circle-check"></i>

                </div>

                <div>

                    <h3>
                        Vehicle Registered
                    </h3>

                    <p>
                        This vehicle exists in the apartment database.
                    </p>

                </div>

            </div>


            <div class="vehicle-details">

                <!-- Registration Number -->

                <div class="detail-item">

                    <span class="detail-label">
                        Registration Number
                    </span>

                    <strong>
                        ${escapeVehicleHTML(
                            data.vehicleNumber
                        )}
                    </strong>

                </div>


                <!-- Resident -->

                <div class="detail-item">

                    <span class="detail-label">
                        Resident
                    </span>

                    <strong>
                        ${escapeVehicleHTML(
                            data.residentName
                        )}
                    </strong>

                </div>


                <!-- Apartment -->

                <div class="detail-item">

                    <span class="detail-label">
                        Door Number
                    </span>

                    <strong>
                        ${escapeVehicleHTML(
                            data.doorNumber
                        )}
                    </strong>

                </div>


                <!-- Phone -->

                <div class="detail-item">

                    <span class="detail-label">
                        Phone
                    </span>

                    <strong>
                        ${escapeVehicleHTML(
                            data.phone
                        )}
                    </strong>

                </div>


                <!-- Vehicle Type -->

                <div class="detail-item">

                    <span class="detail-label">
                        Vehicle Type
                    </span>

                    <strong>
                        ${escapeVehicleHTML(
                            data.vehicleType
                        )}
                    </strong>

                </div>


                <!-- Brand -->

                <div class="detail-item">

                    <span class="detail-label">
                        Brand
                    </span>

                    <strong>
                        ${escapeVehicleHTML(
                            data.brand
                        )}
                    </strong>

                </div>


                <!-- Model -->

                <div class="detail-item">

                    <span class="detail-label">
                        Model
                    </span>

                    <strong>
                        ${escapeVehicleHTML(
                            data.model
                        )}
                    </strong>

                </div>


                <!-- Color -->

                <div class="detail-item">

                    <span class="detail-label">
                        Color
                    </span>

                    <strong>
                        ${escapeVehicleHTML(
                            data.color
                        )}
                    </strong>

                </div>


                <!-- Status -->

                <div class="detail-item">

                    <span class="detail-label">
                        Registration Status
                    </span>

                    <strong>
                        ${escapeVehicleHTML(
                            data.status
                        )}
                    </strong>

                </div>

            </div>


            <div class="verification-message">

                <i class="fa-solid fa-circle-check"></i>

                This vehicle is registered in the
                apartment premises.

            </div>

        </div>

    `;


    showVehicleVerificationResult(
        resultHTML,
        "success"
    );

}
/* =========================================================
   SHOW VEHICLE MESSAGE
========================================================= */

function showVehicleMessage(
    message,
    type = "info"
) {

    if (!vehicleVerificationResult) {
        return;
    }

    vehicleVerificationResult.innerHTML = `

        <div class="vehicle-review-message">

            <div class="result-header">

                <div class="result-icon">

                    <i class="fa-solid fa-clock"></i>

                </div>

                <div>

                    <h3>
                        Vehicle Marked for Review
                    </h3>

                    <p>
                        ${escapeHTML(message)}
                    </p>

                </div>

            </div>

            <div class="verification-message">

                <i class="fa-solid fa-circle-info"></i>

                Admin review is required before
                this vehicle can be registered.

            </div>

        </div>

    `;

    vehicleVerificationResult.className =
        "vehicle-verification-result show info";

}
/* =========================================================
   DISPLAY NOT REGISTERED VEHICLE
========================================================= */
async function openVehicleRegistrationForm(vehicleNumber) {

    if (!vehicleVerificationResult) {
        return;
    }


    /* =====================================================
       SHOW FORM
    ===================================================== */

    vehicleVerificationResult.innerHTML = `

        <div class="vehicle-registration-form">

            <div class="form-header">

                <div class="form-icon">
                    <i class="fa-solid fa-car"></i>
                </div>

                <div>

                    <h3>
                        Register Vehicle
                    </h3>

                    <p>
                        Select the resident who owns this vehicle.
                    </p>

                </div>

            </div>


            <!-- VEHICLE NUMBER -->

            <div class="form-group">

                <label>
                    Vehicle Registration Number
                </label>

                <input
                    type="text"
                    id="newVehicleNumber"
                    value="${escapeVehicleHTML(vehicleNumber)}"
                    readonly
                >

            </div>


            <!-- RESIDENT -->

            <div class="form-group">

                <label>
                    Resident / Apartment
                </label>

                <select
                    id="newVehicleResident"
                >

                    <option value="">
                        Loading residents...
                    </option>

                </select>

            </div>


            <!-- SELECTED RESIDENT DETAILS -->

            <div
                id="selectedResidentDetails"
                style="display:none;"
            >

                <div class="detail-item">

                    <span class="detail-label">
                        Resident
                    </span>

                    <strong
                        id="selectedResidentName"
                    >
                    </strong>

                </div>


                <div class="detail-item">

                    <span class="detail-label">
                        Door Number
                    </span>

                    <strong
                        id="selectedResidentDoor"
                    >
                    </strong>

                </div>

            </div>


            <!-- ACTIONS -->

            <div class="vehicle-registration-actions">

                <button
                    type="button"
                    id="saveVehicleRegistrationBtn"
                    class="register-vehicle-btn"
                    disabled
                >

                    <i class="fa-solid fa-check"></i>

                    Register Vehicle

                </button>


                <button
                    type="button"
                    id="cancelVehicleRegistrationBtn"
                    class="dismiss-vehicle-btn"
                >

                    Cancel

                </button>

            </div>

        </div>

    `;


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const residentSelect =
        document.getElementById(
            "newVehicleResident"
        );


    const saveBtn =
        document.getElementById(
            "saveVehicleRegistrationBtn"
        );


    const selectedDetails =
        document.getElementById(
            "selectedResidentDetails"
        );


    const selectedName =
        document.getElementById(
            "selectedResidentName"
        );


    const selectedDoor =
        document.getElementById(
            "selectedResidentDoor"
        );


    /* =====================================================
       LOAD RESIDENTS
    ===================================================== */

    try {

        console.log(
            "🔎 Loading apartment residents..."
        );


        const usersSnapshot =
            await getDocs(
                collection(
                    db,
                    "users"
                )
            );


        residentSelect.innerHTML = `

            <option value="">
                Select resident / apartment
            </option>

        `;


        let residentCount = 0;


        usersSnapshot.forEach(
            (userDoc) => {

                const user =
                    userDoc.data();


                /*
                 * Only residents with a door number
                 * should appear.
                 */

                const doorNumber =
                    user.doorNumber ||
                    user.doorNo ||
                    user.flatNumber ||
                    user.flatNo;


                if (!doorNumber) {
                    return;
                }


                /*
                 * Optional: ignore inactive users.
                 */

                if (
                    user.status &&
                    user.status !== "active" &&
                    user.status !== "approved"
                ) {
                    return;
                }


                const residentName =
                    user.fullName ||
                    user.name ||
                    user.displayName ||
                    "Unknown Resident";


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    userDoc.id;


                option.textContent =
                    `${doorNumber} - ${residentName}`;


                option.dataset.name =
                    residentName;


                option.dataset.door =
                    doorNumber;


                residentSelect.appendChild(
                    option
                );


                residentCount++;

            }
        );


        console.log(
            "👥 Residents loaded:",
            residentCount
        );


        if (!residentCount) {

            residentSelect.innerHTML = `

                <option value="">
                    No residents available
                </option>

            `;

            return;

        }


    }
    catch (error) {

        console.error(
            "❌ Failed to load residents:",
            error
        );


        residentSelect.innerHTML = `

            <option value="">
                Unable to load residents
            </option>

        `;

        return;

    }


    /* =====================================================
       RESIDENT SELECTION
    ===================================================== */

    residentSelect.addEventListener(
        "change",
        () => {

            const selectedOption =
                residentSelect.options[
                    residentSelect.selectedIndex
                ];


            if (
                !residentSelect.value ||
                !selectedOption
            ) {

                selectedDetails.style.display =
                    "none";

                saveBtn.disabled =
                    true;

                return;

            }


            const name =
                selectedOption.dataset.name;


            const door =
                selectedOption.dataset.door;


            selectedName.textContent =
                name;


            selectedDoor.textContent =
                door;


            selectedDetails.style.display =
                "block";


            saveBtn.disabled =
                false;


            console.log(
                "👤 Selected resident:",
                name
            );


            console.log(
                "🏠 Selected door:",
                door
            );

        }
    );


    /* =====================================================
       SAVE VEHICLE
    ===================================================== */

    saveBtn.addEventListener(
        "click",
        () => {

            const selectedUserId =
                residentSelect.value;


            if (!selectedUserId) {

                alert(
                    "Please select a resident."
                );

                return;

            }


            saveNewVehicleRegistration(
                vehicleNumber,
                selectedUserId
            );

        }
    );


    /* =====================================================
       CANCEL
    ===================================================== */

    const cancelBtn =
        document.getElementById(
            "cancelVehicleRegistrationBtn"
        );


    if (cancelBtn) {

        cancelBtn.addEventListener(
            "click",
            () => {

                vehicleVerificationResult.innerHTML =
                    "";

                vehicleVerificationResult.className =
                    "vehicle-verification-result";

            }
        );

    }

}
/* =========================================================
   SAVE NEW VEHICLE REGISTRATION
========================================================= */

async function saveNewVehicleRegistration(
    vehicleNumber,
    selectedUserId
) {

    const saveBtn =
        document.getElementById(
            "saveVehicleRegistrationBtn"
        );



    const normalizedVehicleNumber =
        normalizeVehicleNumber(
            vehicleNumber
        );


    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!selectedUserId) {

    alert(
        "Please select a resident."
    );

    return;

}


    if (!normalizedVehicleNumber) {

        alert(
            "Vehicle registration number is missing."
        );

        return;

    }


    console.log(
        "🚗 Registering vehicle:",
        normalizedVehicleNumber
    );

    console.log(
        "🏠 Door number:",
        doorNumber
    );


    /* =====================================================
       DISABLE BUTTON
    ===================================================== */

    if (saveBtn) {

        saveBtn.disabled = true;

        saveBtn.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Registering...
        `;

    }


    try {

        /* =================================================
           1. CHECK WHETHER VEHICLE ALREADY EXISTS
        ================================================= */

        const vehicleQuery =
            query(
                collection(
                    db,
                    "vehicles"
                ),
                where(
                    "vehicleNumber",
                    "==",
                    normalizedVehicleNumber
                )
            );


        const vehicleSnapshot =
            await getDocs(
                vehicleQuery
            );


        if (!vehicleSnapshot.empty) {

            console.warn(
                "⚠️ Vehicle already registered:",
                normalizedVehicleNumber
            );


            throw new Error(
                "This vehicle is already registered."
            );

        }

/* =================================================
   2. GET SELECTED RESIDENT
================================================= */

console.log(
    "🔎 Loading selected resident:",
    selectedUserId
);


const residentRef =
    doc(
        db,
        "users",
        selectedUserId
    );


const residentSnapshot =
    await getDoc(
        residentRef
    );


if (!residentSnapshot.exists()) {

    throw new Error(
        "The selected resident could not be found."
    );

}


const resident =
    residentSnapshot.data();


const residentUserId =
    residentSnapshot.id;


/* =================================================
   3. GET RESIDENT DOOR NUMBER
================================================= */

const doorNumber =
    resident.doorNumber ||
    resident.doorNo ||
    resident.flatNumber ||
    resident.flatNo;


if (!doorNumber) {

    throw new Error(
        "The selected resident does not have an apartment door number."
    );

}


console.log(
    "👤 Resident found:",
    resident
);


console.log(
    "🏠 Resident door:",
    doorNumber
);


        /* =================================================
           4. SAVE VEHICLE
        ================================================= */

        const vehicleData = {

            vehicleNumber:
                normalizedVehicleNumber,

            userId:
                residentUserId,

            ownerName:
                resident.fullName ||
                resident.name ||
                resident.displayName ||
                "N/A",

            ownerEmail:
                resident.email ||
                "",

            doorNumber:
                doorNumber,

            vehicleType:
                "car",

            vehicleBrand:
                "N/A",

            vehicleModel:
                "N/A",

            vehicleColor:
                "N/A",

            status:
                "active",

            createdAt:
                serverTimestamp(),

            updatedAt:
                serverTimestamp()

        };


        console.log(
            "💾 Saving vehicle:",
            vehicleData
        );


        await addDoc(
            collection(
                db,
                "vehicles"
            ),
            vehicleData
        );


        /* =================================================
           5. SUCCESS
        ================================================= */

        console.log(
            "✅ Vehicle registered successfully."
        );


        vehicleVerificationResult.innerHTML = `

            <div class="vehicle-result registered">

                <div class="result-header">

                    <div class="result-icon">

                        <i class="fa-solid fa-circle-check"></i>

                    </div>

                    <div>

                        <h3>
                            Vehicle Registered
                        </h3>

                        <p>
                            Vehicle has been added successfully.
                        </p>

                    </div>

                </div>


                <div class="vehicle-details">

                    <div class="detail-item">

                        <span class="detail-label">
                            Registration Number
                        </span>

                        <strong>
                            ${escapeVehicleHTML(
                                normalizedVehicleNumber
                            )}
                        </strong>

                    </div>


                    <div class="detail-item">

                        <span class="detail-label">
                            Resident
                        </span>

                        <strong>
                            ${escapeVehicleHTML(
                                resident.fullName ||
                                resident.name ||
                                "N/A"
                            )}
                        </strong>

                    </div>


                    <div class="detail-item">

                        <span class="detail-label">
                            Door Number
                        </span>

                        <strong>
                            ${escapeVehicleHTML(
                                doorNumber
                            )}
                        </strong>

                    </div>


                    <div class="detail-item">

                        <span class="detail-label">
                            Registration Status
                        </span>

                        <strong>
                            Active
                        </strong>

                    </div>

                </div>


                <div class="verification-message">

                    <i class="fa-solid fa-circle-check"></i>

                    This vehicle is now registered
                    in the apartment premises.

                </div>

            </div>

        `;

        vehicleVerificationResult.className =
            "vehicle-verification-result show success";


    }
    catch (error) {

        console.error(
            "❌ Vehicle registration failed:",
            error
        );


        vehicleVerificationResult.innerHTML = `

            <div class="vehicle-result not-registered">

                <div class="result-header">

                    <div class="result-icon">

                        <i class="fa-solid fa-triangle-exclamation"></i>

                    </div>

                    <div>

                        <h3>
                            Registration Failed
                        </h3>

                        <p>
                            ${escapeVehicleHTML(
                                error.message ||
                                "Unable to register vehicle."
                            )}
                        </p>

                    </div>

                </div>

            </div>

        `;
        vehicleVerificationResult.className =
            "vehicle-verification-result show error";


        if (saveBtn) {

            saveBtn.disabled = false;

            saveBtn.innerHTML = `
                <i class="fa-solid fa-check"></i>
                Register Vehicle
            `;

        }

    }

}

/* =========================================================
   CHECK BUTTON
========================================================= */

if (
    checkVehicleBtn
) {

    checkVehicleBtn.addEventListener(
        "click",
        verifyVehicle
    );

}


/* =========================================================
   VERIFY VEHICLE
========================================================= */

async function verifyVehicle() {

    clearSearchStatus();
    clearResult();

    /* =====================================================
       GET INPUT
    ===================================================== */

    const rawNumber =
        vehicleNumberInput?.value?.trim();


    /* =====================================================
       EMPTY INPUT
    ===================================================== */

    if (!rawNumber) {

        showSearchStatus(
            "Please enter a vehicle registration number.",
            "error"
        );

        vehicleNumberInput?.focus();

        return;
    }


    /* =====================================================
       NORMALIZE
    ===================================================== */

    const vehicleNumber =
        normalizeVehicleNumber(
            rawNumber
        );


    /* =====================================================
       VALIDATE
    ===================================================== */

    if (
        !isValidVehicleNumber(
            vehicleNumber
        )
    ) {

        showSearchStatus(
            "Please enter a valid vehicle registration number. Example: KA03NT8821",
            "error"
        );

        return;
    }


    /* =====================================================
       UPDATE INPUT
    ===================================================== */

    if (vehicleNumberInput) {

        vehicleNumberInput.value =
            vehicleNumber;

    }


    /* =====================================================
       DISABLE BUTTON
    ===================================================== */

    if (checkVehicleBtn) {

        checkVehicleBtn.disabled = true;

        checkVehicleBtn.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Checking...
        `;

    }


    showSearchStatus(
        "Searching registered vehicle records...",
        "info"
    );


    try {

        /* =================================================
           CHECK FIREBASE
        ================================================= */

        const result =
            await checkVehicleRegistration(
                vehicleNumber
            );


        /* =================================================
           REGISTERED VEHICLE
        ================================================= */

        if (
            result &&
            result.registered
        ) {

            clearSearchStatus();

            console.log(
                "✅ Vehicle verified successfully."
            );

            return;
        }


        /* =================================================
           NOT REGISTERED
        ================================================= */

        clearSearchStatus();

        console.log(
            "🔴 Vehicle is not registered."
        );

        /*
         * IMPORTANT:
         *
         * checkVehicleRegistration()
         * should already call:
         *
         * showVehicleNotRegistered(vehicleNumber)
         *
         * when the vehicle is not found.
         *
         * Therefore we do NOT create the review
         * UI here.
         */

    }

    catch (error) {

        console.error(
            "❌ Vehicle verification failed:",
            error
        );


        showSearchStatus(
            "Unable to check the vehicle. Please try again.",
            "error"
        );


        if (
            vehicleVerificationResult
        ) {

            vehicleVerificationResult.innerHTML = `

                <div class="vehicle-result not-registered">

                    <div class="result-header">

                        <div class="result-icon">

                            <i class="fa-solid fa-triangle-exclamation"></i>

                        </div>

                        <div>

                            <h3>
                                Verification Failed
                            </h3>

                            <p>
                                Unable to check this vehicle.
                                Please try again.
                            </p>

                        </div>

                    </div>

                </div>

            `;

            vehicleVerificationResult.className =
                "vehicle-verification-result show error";

        }

    }

    finally {

        /* =================================================
           ENABLE BUTTON AGAIN
        ================================================= */

        if (checkVehicleBtn) {

            checkVehicleBtn.disabled =
                false;

            checkVehicleBtn.innerHTML = `

                <i class="fa-solid fa-magnifying-glass"></i>

                Check Vehicle

            `;

        }

    }

}


/* =========================================================
   ENTER KEY SUPPORT
========================================================= */

if (
    vehicleNumberInput
) {

    vehicleNumberInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                verifyVehicle();

            }

        }
    );

}


/* =========================================================
   AUTO UPPERCASE
========================================================= */

if (
    vehicleNumberInput
) {

    vehicleNumberInput.addEventListener(
        "input",
        () => {

            vehicleNumberInput.value =
                vehicleNumberInput
                    .value
                    .toUpperCase()
                    .replace(
                        /[^A-Z0-9]/g,
                        ""
                    );

        }
    );

}


console.log(
    "✅ Simple vehicle verification ready."
);
/* =========================================================
   VEHICLE VERIFICATION RESULT DISPLAY
========================================================= */

function showVehicleVerificationResult(
    html,
    type = "info"
) {

    console.log(
        "📋 Verification result displayed:",
        type
    );


    /*
     * Try to find the existing result container.
     */
    let resultContainer =
        document.getElementById(
            "vehicleVerificationResult"
        );


    /*
     * If it doesn't exist, create it.
     */
    if (!resultContainer) {

        resultContainer =
            document.createElement("div");

        resultContainer.id =
            "vehicleVerificationResult";


        /*
         * Put the result after the
         * Check Vehicle button.
         */

        const checkButton =
            document.getElementById(
                "checkVehicleBtn"
            );


        if (checkButton) {

            checkButton.parentNode.insertBefore(
                resultContainer,
                checkButton.nextSibling
            );

        }
        else {

            const panel =
                document.querySelector(
                    ".verification-panel"
                );


            if (panel) {

                panel.appendChild(
                    resultContainer
                );

            }

        }

    }


    /*
     * Set result content.
     */

    resultContainer.innerHTML =
        html;


    /*
     * Make result visible.
     */

    resultContainer.style.display =
        "block";


    /*
     * Add result type.
     */

    resultContainer.className =
        `vehicle-verification-result ${type}`;

}
/* =========================================================
   SAFE HTML OUTPUT
========================================================= */

function escapeVehicleHTML(value) {

    return String(
        value ?? "N/A"
    )
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