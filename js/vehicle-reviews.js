/* =========================================================
   SMARTPARK AI
   ADMIN VEHICLE REVIEWS
   ========================================================= */

import {
    collection,
    getDocs,
    query,
    orderBy,
    updateDoc,
    doc,
    serverTimestamp,
    addDoc,
    where
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import { db } from "./firebase.js";


/* =========================================================
   DOM ELEMENTS
========================================================= */

const reviewsContainer =
    document.getElementById("vehicleReviewsList");

const pendingCount =
    document.getElementById("pendingCount");

const reviewedCount =
    document.getElementById("reviewedCount");

const refreshBtn =
    document.getElementById("refreshReviewsBtn");


/* =========================================================
   INITIALIZE
========================================================= */

console.log(
    "🚗 SmartPark Vehicle Reviews loaded"
);

loadVehicleReviews();


/* =========================================================
   LOAD REVIEWS
========================================================= */

async function loadVehicleReviews() {

    console.log(
        "🔎 Loading vehicle reviews..."
    );

    if (!reviewsContainer) {

        console.error(
            "❌ reviewsContainer not found."
        );

        return;
    }


    reviewsContainer.innerHTML = `

        <div class="loading-message">

            <i class="fa-solid fa-spinner fa-spin"></i>

            Loading reviews...

        </div>

    `;


    try {

        const reviewsRef =
            collection(
                db,
                "vehicleReviews"
            );


        const reviewsQuery =
            query(
                reviewsRef,
                orderBy(
                    "createdAt",
                    "desc"
                )
            );


        const snapshot =
            await getDocs(
                reviewsQuery
            );


        console.log(
            "📋 Reviews found:",
            snapshot.size
        );


        let pending = 0;

        let reviewed = 0;

        let reviewHTML = "";


        snapshot.forEach(
            (reviewDoc) => {

                const review =
                    reviewDoc.data();


                console.log(
                    "📄 Review:",
                    reviewDoc.id,
                    review
                );


                const status =
                    review.status ||
                    "pending";


                if (
                    status === "pending"
                ) {

                    pending++;

                } else {

                    reviewed++;

                }


                reviewHTML +=
                    createReviewCard(
                        reviewDoc.id,
                        review
                    );

            }
        );


        /* =================================================
           UPDATE COUNTS
        ================================================= */

        if (pendingCount) {

            pendingCount.textContent =
                pending;

        }


        if (reviewedCount) {

            reviewedCount.textContent =
                reviewed;

        }


        /* =================================================
           NO REVIEWS
        ================================================= */

        if (!reviewHTML) {

            reviewsContainer.innerHTML = `

                <div class="empty-reviews">

                    <i class="fa-solid fa-circle-check"></i>

                    <h3>
                        No Vehicle Reviews
                    </h3>

                    <p>
                        There are currently no
                        vehicle review requests.
                    </p>

                </div>

            `;

            return;

        }


        /* =================================================
           DISPLAY REVIEWS
        ================================================= */

        reviewsContainer.innerHTML =
            reviewHTML;


        attachReviewEvents();


        console.log(
            "✅ Vehicle reviews displayed."
        );

    }
    catch (error) {

        console.error(
            "❌ Failed to load vehicle reviews:",
            error
        );


        /*
         * If orderBy(createdAt) causes an index problem,
         * we show a useful error instead of leaving the
         * page stuck at Loading.
         */

        reviewsContainer.innerHTML = `

            <div class="empty-reviews error">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <h3>
                    Unable to Load Reviews
                </h3>

                <p>
                    ${escapeHTML(
                        error.message ||
                        "Something went wrong."
                    )}
                </p>

            </div>

        `;

    }

}


/* =========================================================
   CREATE REVIEW CARD
========================================================= */

function createReviewCard(
    reviewId,
    review
) {

    const vehicleNumber =
        review.vehicleNumber ||
        "N/A";


    const reason =
        review.reason ||
        "Vehicle not registered";


    const status =
        review.status ||
        "pending";


    let createdAt =
        "Unknown";


    if (
        review.createdAt &&
        typeof review.createdAt.toDate ===
            "function"
    ) {

        createdAt =
            review.createdAt
                .toDate()
                .toLocaleString();

    }


    const isPending =
        status === "pending";


    /* =====================================================
       PENDING REVIEW
    ===================================================== */

    if (isPending) {

        return `

            <div
                class="review-card pending"
                data-review-id="${reviewId}"
            >

                <div class="review-card-header">

                    <div class="review-vehicle-icon">

                        <i class="fa-solid fa-car"></i>

                    </div>


                    <div class="review-title">

                        <h3>
                            ${escapeHTML(
                                vehicleNumber
                            )}
                        </h3>

                        <span class="review-status">
                            Pending Review
                        </span>

                    </div>

                </div>


                <div class="review-details">

                    <div class="review-detail">

                        <span>
                            Vehicle Number
                        </span>

                        <strong>
                            ${escapeHTML(
                                vehicleNumber
                            )}
                        </strong>

                    </div>


                    <div class="review-detail">

                        <span>
                            Reason
                        </span>

                        <strong>
                            ${escapeHTML(
                                reason
                            )}
                        </strong>

                    </div>


                    <div class="review-detail">

                        <span>
                            Reported On
                        </span>

                        <strong>
                            ${escapeHTML(
                                createdAt
                            )}
                        </strong>

                    </div>

                </div>


                <div class="review-actions">

                    <button
                        type="button"
                        class="approve-review-btn"
                        data-id="${reviewId}"
                    >

                        <i class="fa-solid fa-check"></i>

                        Approve Review

                    </button>


                    <button
                        type="button"
                        class="reject-review-btn"
                        data-id="${reviewId}"
                    >

                        <i class="fa-solid fa-xmark"></i>

                        Reject

                    </button>

                </div>

            </div>

        `;

    }


    /* =====================================================
       REVIEWED CARD
    ===================================================== */

    return `

        <div
            class="review-card reviewed"
            data-review-id="${reviewId}"
        >

            <div class="review-card-header">

                <div class="review-vehicle-icon">

                    <i class="fa-solid fa-car"></i>

                </div>


                <div class="review-title">

                    <h3>
                        ${escapeHTML(
                            vehicleNumber
                        )}
                    </h3>

                    <span class="review-status">

                        ${escapeHTML(
                            formatStatus(status)
                        )}

                    </span>

                </div>

            </div>


            <div class="review-details">

                <div class="review-detail">

                    <span>
                        Vehicle Number
                    </span>

                    <strong>
                        ${escapeHTML(
                            vehicleNumber
                        )}
                    </strong>

                </div>


                <div class="review-detail">

                    <span>
                        Reason
                    </span>

                    <strong>
                        ${escapeHTML(
                            reason
                        )}
                    </strong>

                </div>


                <div class="review-detail">

                    <span>
                        Status
                    </span>

                    <strong>
                        ${escapeHTML(
                            formatStatus(status)
                        )}
                    </strong>

                </div>

            </div>


            <div class="review-completed">

                <i class="fa-solid fa-circle-check"></i>

                Review completed

            </div>

        </div>

    `;

}


/* =========================================================
   ATTACH BUTTON EVENTS
========================================================= */

function attachReviewEvents() {


    /* =====================================================
       APPROVE
    ===================================================== */

    const approveButtons =
        document.querySelectorAll(
            ".approve-review-btn"
        );


    approveButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                async () => {

                    const reviewId =
                        button.dataset.id;


                    await approveReview(
                        reviewId,
                        button
                    );

                }
            );

        }
    );


    /* =====================================================
       REJECT
    ===================================================== */

    const rejectButtons =
        document.querySelectorAll(
            ".reject-review-btn"
        );


    rejectButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                async () => {

                    const reviewId =
                        button.dataset.id;


                    await rejectReview(
                        reviewId,
                        button
                    );

                }
            );

        }
    );

}


/* =========================================================
   APPROVE REVIEW
========================================================= */
async function approveReview(reviewId, button) {

    button.disabled = true;
    button.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';

    try {

        const reviewsSnapshot =
            await getDocs(collection(db, "vehicleReviews"));

        let review = null;

        reviewsSnapshot.forEach(docSnap => {

            if (docSnap.id === reviewId) {

                review = {
                    id: docSnap.id,
                    ...docSnap.data()
                };

            }

        });

        if (!review) {

            throw new Error("Review not found.");

        }

        showResidentSelection(review);

    }
    catch (error) {

        console.error(error);

        alert(error.message);

    }

    button.disabled = false;
    button.innerHTML =
        '<i class="fa-solid fa-check"></i> Approve Review';

}
async function showResidentSelection(review) {

    const usersSnapshot =
        await getDocs(collection(db, "users"));

    let options =
        '<option value="">Select Resident</option>';

    const usersMap = {};

    usersSnapshot.forEach(docSnap => {

        const user = docSnap.data();

        usersMap[docSnap.id] = user;

        options += `
            <option value="${docSnap.id}">
                ${user.fullName || user.name} (${user.doorNumber})
            </option>
        `;

    });

    reviewsContainer.innerHTML = `

        <div class="review-card pending">

            <h2>Confirm Vehicle Registration</h2>

            <div class="review-detail">
                <span>Vehicle Number</span>
                <strong>${review.vehicleNumber}</strong>
            </div>

            <div class="form-group">

                <label>Resident</label>

                <select id="residentSelect">

                    ${options}

                </select>

            </div>

            <div class="form-group">

                <label>Apartment Door</label>

                <input
                    id="doorDisplay"
                    readonly
                    placeholder="Door number will appear automatically"
                >

            </div>

            <div class="review-actions">

                <button
                    id="confirmRegistrationBtn"
                    class="approve-review-btn"
                >

                    Confirm Registration

                </button>

                <button
                    id="cancelRegistrationBtn"
                    class="reject-review-btn"
                >

                    Cancel

                </button>

            </div>

        </div>
    `;

    const residentSelect =
        document.getElementById("residentSelect");

    const doorDisplay =
        document.getElementById("doorDisplay");

    residentSelect.addEventListener("change", () => {

        const selected =
            usersMap[residentSelect.value];

        doorDisplay.value =
            selected?.doorNumber || "";

    });

    document
        .getElementById("cancelRegistrationBtn")
        .addEventListener("click", loadVehicleReviews);

    document
        .getElementById("confirmRegistrationBtn")
        .addEventListener("click", () =>
            registerApprovedVehicle(
                review,
                residentSelect.value,
                usersMap
            )
        );

}
async function registerApprovedVehicle(
    review,
    residentId,
    usersMap
) {

    if (!residentId) {

        alert("Please select a resident.");

        return;

    }

    const resident =
        usersMap[residentId];

    try {

        await addDoc(collection(db, "vehicles"), {

            vehicleNumber: review.vehicleNumber,
            userId: residentId,
            ownerName: resident.fullName || resident.name,
            ownerEmail: resident.email || "",
            doorNumber: resident.doorNumber,
            vehicleType: "car",
            vehicleBrand: "N/A",
            vehicleModel: "N/A",
            vehicleColor: "N/A",
            status: "active",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()

        });

        await updateDoc(
            doc(db, "vehicleReviews", review.id),
            {

                status: "approved",
                reviewedAt: serverTimestamp()

            }
        );

        alert("Vehicle successfully registered.");

        loadVehicleReviews();

    }
    catch (error) {

        console.error(error);

        alert(error.message);

    }

}


/* =========================================================
   REJECT REVIEW
========================================================= */

async function rejectReview(
    reviewId,
    button
) {

    console.log(
        "❌ Rejecting review:",
        reviewId
    );


    if (!reviewId) {

        console.error(
            "❌ Review ID missing."
        );

        return;

    }


    const confirmed =
        confirm(
            "Reject this vehicle review?"
        );


    if (!confirmed) {

        return;

    }


    try {

        button.disabled =
            true;


        button.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            Rejecting...

        `;


        const reviewRef =
            doc(
                db,
                "vehicleReviews",
                reviewId
            );


        await updateDoc(
            reviewRef,
            {

                status:
                    "rejected",

                reviewedAt:
                    serverTimestamp()

            }
        );


        console.log(
            "✅ Review rejected."
        );


        await loadVehicleReviews();

    }
    catch (error) {

        console.error(
            "❌ Rejection failed:",
            error
        );


        alert(
            "Unable to reject the review.\n\n" +
            error.message
        );


        button.disabled =
            false;


        button.innerHTML = `

            <i class="fa-solid fa-xmark"></i>

            Reject

        `;

    }

}


/* =========================================================
   REFRESH BUTTON
========================================================= */

if (refreshBtn) {

    refreshBtn.addEventListener(
        "click",
        () => {

            console.log(
                "🔄 Refreshing vehicle reviews..."
            );

            loadVehicleReviews();

        }
    );

}


/* =========================================================
   FORMAT STATUS
========================================================= */

function formatStatus(status) {

    switch (status) {

        case "approved":
            return "Approved";

        case "rejected":
            return "Rejected";

        case "pending":
            return "Pending Review";

        default:
            return status || "Unknown";

    }

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
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