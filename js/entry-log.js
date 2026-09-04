// =========================================================
// ENTRY LOG
// SmartPark AI
// =========================================================


// =========================================================
// FIREBASE IMPORTS
// =========================================================

import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";



// =========================================================
// DOM ELEMENTS
// =========================================================

const totalRecords =
    document.getElementById(
        "totalRecords"
    );


const activeRecords =
    document.getElementById(
        "activeRecords"
    );


const completedRecords =
    document.getElementById(
        "completedRecords"
    );


const entryTableBody =
    document.getElementById(
        "entryTableBody"
    );


const searchInput =
    document.getElementById(
        "searchInput"
    );


const statusFilter =
    document.getElementById(
        "statusFilter"
    );


const loadingState =
    document.getElementById(
        "loadingState"
    );


const emptyState =
    document.getElementById(
        "emptyState"
    );


const entryTable =
    document.getElementById(
        "entryTable"
    );


const refreshBtn =
    document.getElementById(
        "refreshBtn"
    );



// =========================================================
// GLOBAL DATA
// =========================================================

let allEntries = [];



// =========================================================
// LOAD ENTRY LOG
// =========================================================

async function loadEntryLog() {

    console.log(
        "📋 Loading entry log..."
    );


    // Show loading

    loadingState.style.display =
        "block";


    emptyState.style.display =
        "none";


    entryTable.style.display =
        "none";


    try {


        // =================================================
        // GET BOOKINGS FROM FIREBASE
        // =================================================

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "bookings"
                )
            );


        // Clear old records

        allEntries = [];



        // =================================================
        // STORE BOOKINGS
        // =================================================

        snapshot.forEach(
            documentSnapshot => {

                allEntries.push({

                    id:
                        documentSnapshot.id,

                    ...documentSnapshot.data()

                });

            }
        );



        console.log(
            "✅ Entry records loaded:",
            allEntries
        );



        // =================================================
        // UPDATE STATISTICS
        // =================================================

        updateStatistics();



        // =================================================
        // DISPLAY TABLE
        // =================================================

        displayEntries();


    }

    catch (error) {


        console.error(
            "❌ Error loading entry log:",
            error
        );


        entryTableBody.innerHTML =
            "";


        loadingState.innerHTML = `

            <i class="fa-solid fa-triangle-exclamation"></i>

            <div>
                Unable to load entry records.
            </div>

            <small>
                ${escapeHtml(error.message)}
            </small>

        `;

    }

}



// =========================================================
// UPDATE STATISTICS
// =========================================================

function updateStatistics() {


    // Total

    totalRecords.textContent =
        allEntries.length;



    // Active vehicles

    activeRecords.textContent =
        allEntries.filter(
            entry =>
                String(
                    entry.status || ""
                ).toLowerCase()
                ===
                "active"
        ).length;



    // Completed vehicles

    completedRecords.textContent =
        allEntries.filter(
            entry =>
                String(
                    entry.status || ""
                ).toLowerCase()
                ===
                "completed"
        ).length;

}



// =========================================================
// DISPLAY ENTRIES
// =========================================================

function displayEntries() {


    // =====================================================
    // GET SEARCH VALUE
    // =====================================================

    const searchValue =
        searchInput.value
            .trim()
            .toLowerCase();



    // =====================================================
    // GET STATUS FILTER
    // =====================================================

    const selectedStatus =
        statusFilter.value;



    // =====================================================
    // FILTER RECORDS
    // =====================================================

    const filteredEntries =
        allEntries
            .filter(
                entry => {


                    const vehicle =
                        String(
                            entry.vehicleNumber ||
                            entry.vehicle ||
                            ""
                        )
                        .toLowerCase();


                    const owner =
                        String(
                            entry.fullName ||
                            entry.ownerName ||
                            ""
                        )
                        .toLowerCase();


                    const slot =
                        String(
                            entry.slotNumber ||
                            ""
                        )
                        .toLowerCase();


                    const status =
                        String(
                            entry.status ||
                            ""
                        )
                        .toLowerCase();



                    const matchesSearch =

                        !searchValue ||

                        vehicle.includes(
                            searchValue
                        ) ||

                        owner.includes(
                            searchValue
                        ) ||

                        slot.includes(
                            searchValue
                        );



                    const matchesStatus =

                        selectedStatus ===
                        "all"

                        ||

                        status ===
                        selectedStatus;



                    return (
                        matchesSearch &&
                        matchesStatus
                    );

                }
            )



            // =================================================
            // SORT NEWEST FIRST
            // =================================================

            .sort(
                (
                    first,
                    second
                ) => {

                    return (
                        getTime(second)
                        -
                        getTime(first)
                    );

                }
            );



    // =====================================================
    // CLEAR TABLE
    // =====================================================

    entryTableBody.innerHTML =
        "";



    loadingState.style.display =
        "none";



    // =====================================================
    // NO RECORDS
    // =====================================================

    if (
        filteredEntries.length === 0
    ) {

        entryTable.style.display =
            "none";


        emptyState.style.display =
            "block";


        return;

    }



    // =====================================================
    // SHOW TABLE
    // =====================================================

    emptyState.style.display =
        "none";


    entryTable.style.display =
        "table";



    // =====================================================
    // CREATE TABLE ROWS
    // =====================================================

    filteredEntries.forEach(
        (
            entry,
            index
        ) => {


            // Vehicle

            const vehicle =
                entry.vehicleNumber ||
                entry.vehicle ||
                "-";



            // Owner

            const owner =
                entry.fullName ||
                entry.ownerName ||
                "-";



            // Slot

            const slot =
                entry.slotNumber ||
                "-";



            // Entry time

            const entryTime =
                entry.bookingTime ||
                entry.entryTime ||
                "-";



            // Exit time

            const exitTime =
                entry.exitTime ||
                "-";



            // Status

            const status =
                String(
                    entry.status ||
                    "unknown"
                )
                .toLowerCase();



            // Status class

            const statusClass =
                status === "active"

                    ? "status-active"

                    : "status-completed";



            // Status text

            const statusText =

                status === "active"

                    ? "Active / Parked"

                    : status === "completed"

                        ? "Completed / Exited"

                        : status;



            // =================================================
            // ADD ROW
            // =================================================

            entryTableBody.innerHTML += `

                <tr>

                    <td>
                        ${index + 1}
                    </td>


                    <td>

                        <span class="vehicle-number">

                            ${escapeHtml(vehicle)}

                        </span>

                    </td>


                    <td>

                        ${escapeHtml(owner)}

                    </td>


                    <td>

                        <span class="slot-badge">

                            ${escapeHtml(slot)}

                        </span>

                    </td>


                    <td>

                        ${escapeHtml(entryTime)}

                    </td>


                    <td>

                        ${escapeHtml(exitTime)}

                    </td>


                    <td>

                        <span
                            class="status-badge ${statusClass}"
                        >

                            ${escapeHtml(statusText)}

                        </span>

                    </td>

                </tr>

            `;

        }
    );

}



// =========================================================
// GET DATE/TIME
// =========================================================

function getTime(entry) {


    const value =

        entry.exitTime ||

        entry.bookingTime ||

        entry.entryTime ||

        "";



    const time =
        Date.parse(value);



    if (
        Number.isNaN(time)
    ) {

        return 0;

    }


    return time;

}



// =========================================================
// HTML SECURITY
// =========================================================

function escapeHtml(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}



// =========================================================
// SEARCH EVENT
// =========================================================

searchInput.addEventListener(
    "input",
    displayEntries
);



// =========================================================
// STATUS FILTER EVENT
// =========================================================

statusFilter.addEventListener(
    "change",
    displayEntries
);



// =========================================================
// REFRESH BUTTON
// =========================================================

refreshBtn.addEventListener(
    "click",
    loadEntryLog
);



// =========================================================
// INITIAL LOAD
// =========================================================

loadEntryLog();



console.log(
    "📦 entry-log.js loaded successfully."
);