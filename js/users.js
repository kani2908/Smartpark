import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    doc,
    deleteDoc,
    updateDoc,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


// ==========================================================
// ELEMENTS
// ==========================================================

const usersContainer =
    document.getElementById("usersContainer");

const totalUsers =
    document.getElementById("totalUsers");

const approvedUsers =
    document.getElementById("approvedUsers");

const pendingUsers =
    document.getElementById("pendingUsers");

const searchInput =
    document.getElementById("searchInput");


// ==========================================================
// USERS DATA
// ==========================================================

let users = [];


// ==========================================================
// SAFE VALUE
// ==========================================================

function getValue(value, fallback = "N/A") {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return fallback;
    }

    return value;
}


// ==========================================================
// ESCAPE HTML
// ==========================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ==========================================================
// GET USER VEHICLE
// ==========================================================

async function getUserVehicle(user) {

    let vehicle = null;

    try {

        // --------------------------------------------------
        // 1. SEARCH USING FIREBASE UID
        // --------------------------------------------------

        if (user.uid) {

            const q = query(
                collection(db, "vehicles"),
                where("userId", "==", user.uid)
            );

            const snapshot =
                await getDocs(q);

            if (!snapshot.empty) {

                vehicle =
                    snapshot.docs[0].data();

            }

        }


        // --------------------------------------------------
        // 2. SEARCH USING USER DOCUMENT ID
        // --------------------------------------------------

        if (
            !vehicle &&
            user.id
        ) {

            const q = query(
                collection(db, "vehicles"),
                where("userId", "==", user.id)
            );

            const snapshot =
                await getDocs(q);

            if (!snapshot.empty) {

                vehicle =
                    snapshot.docs[0].data();

            }

        }


        // --------------------------------------------------
        // 3. SEARCH USING EMAIL
        // --------------------------------------------------

        if (
            !vehicle &&
            user.email
        ) {

            const q = query(
                collection(db, "vehicles"),
                where("ownerEmail", "==", user.email)
            );

            const snapshot =
                await getDocs(q);

            if (!snapshot.empty) {

                vehicle =
                    snapshot.docs[0].data();

            }

        }


        // --------------------------------------------------
        // 4. OLD USER DOCUMENT DATA
        // --------------------------------------------------

        if (!vehicle && user.vehicleNumber) {

            vehicle = {

                vehicleNumber:
                    user.vehicleNumber,

                vehicleType:
                    user.vehicleType,

                vehicleBrand:
                    user.vehicleBrand,

                vehicleModel:
                    user.vehicleModel,

                vehicleColor:
                    user.vehicleColor

            };

        }


    }
    catch (error) {

        console.error(
            "Vehicle lookup error:",
            error
        );

    }


    return vehicle;

}


// ==========================================================
// LOAD USERS
// ==========================================================

async function loadUsers() {

    try {

        users = [];

        usersContainer.innerHTML = "";


        // --------------------------------------------------
        // GET ALL USERS
        // --------------------------------------------------

        const snapshot =
            await getDocs(
                collection(db, "users")
            );


        // --------------------------------------------------
        // REMOVE DUPLICATES
        // --------------------------------------------------

        const uniqueUsers =
            new Map();


        snapshot.forEach((documentSnapshot) => {

            const data =
                documentSnapshot.data();
                // Only show normal users
if (data.role !== "user") {
    return;
}


            const user = {

                id:
                    documentSnapshot.id,

                ...data

            };


            // ----------------------------------------------
            // IDENTIFY USER
            // ----------------------------------------------

            const uniqueKey =
                user.uid ||
                (user.email
                    ? user.email.toLowerCase().trim()
                    : null) ||
                user.id;


            // ----------------------------------------------
            // KEEP ONLY ONE USER
            // ----------------------------------------------

            if (!uniqueUsers.has(uniqueKey)) {

                uniqueUsers.set(
                    uniqueKey,
                    user
                );

            }
            else {

                console.log(
                    "Duplicate user ignored:",
                    user.email
                );

            }

        });


        // --------------------------------------------------
        // CONVERT MAP TO ARRAY
        // --------------------------------------------------

        users =
            Array.from(
                uniqueUsers.values()
            );


        // --------------------------------------------------
        // LOAD VEHICLES
        // --------------------------------------------------

        for (const user of users) {

            const vehicle =
                await getUserVehicle(user);


            if (vehicle) {

                user.vehicleNumber =
                    vehicle.vehicleNumber ||
                    "N/A";

                user.vehicleType =
                    vehicle.vehicleType ||
                    "N/A";

                user.vehicleBrand =
                    vehicle.vehicleBrand ||
                    "N/A";

                user.vehicleModel =
                    vehicle.vehicleModel ||
                    "N/A";

                user.vehicleColor =
                    vehicle.vehicleColor ||
                    "N/A";

                user.vehicleImage =
                    vehicle.vehicleImage ||
                    "";

            }
            else {

                user.vehicleNumber =
                    user.vehicleNumber ||
                    "N/A";

                user.vehicleType =
                    user.vehicleType ||
                    "N/A";

                user.vehicleBrand =
                    user.vehicleBrand ||
                    "N/A";

                user.vehicleModel =
                    user.vehicleModel ||
                    "N/A";

                user.vehicleColor =
                    user.vehicleColor ||
                    "N/A";

            }

        }


        // --------------------------------------------------
        // STATISTICS
        // --------------------------------------------------

        let total =
            users.length;

        let approved =
            0;

        let pending =
            0;


        users.forEach((user) => {

            const status =
                String(
                    user.verificationStatus ||
                    "pending"
                ).toLowerCase();


            if (
                status === "approved"
            ) {

                approved++;

            }


            if (
                status === "pending"
            ) {

                pending++;

            }

        });


        // --------------------------------------------------
        // UPDATE STATISTICS
        // --------------------------------------------------

        totalUsers.textContent =
            total;

        approvedUsers.textContent =
            approved;

        pendingUsers.textContent =
            pending;


        // --------------------------------------------------
        // DISPLAY
        // --------------------------------------------------

        displayUsers(users);

    }


    catch (error) {

        console.error(
            "Error loading users:",
            error
        );


        usersContainer.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <h2>
                    Unable to Load Users
                </h2>

                <p>
                    Please check your Firebase connection.
                </p>

            </div>

        `;

    }

}


// ==========================================================
// DISPLAY USERS
// ==========================================================

function displayUsers(data) {

    usersContainer.innerHTML = "";


    if (data.length === 0) {

        usersContainer.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-users"></i>

                <h2>
                    No Users Found
                </h2>

                <p>
                    There are no matching users.
                </p>

            </div>

        `;

        return;

    }


    data.forEach((user) => {

        const fullName =
            getValue(
                user.fullName,
                "Unknown User"
            );


        const email =
            getValue(
                user.email
            );


        const phone =
            getValue(
                user.phone
            );


        const doorNumber =
            getValue(
                user.doorNumber
            );


        const vehicleNumber =
            getValue(
                user.vehicleNumber
            );


        const vehicleType =
            getValue(
                user.vehicleType
            );


        const vehicleBrand =
            getValue(
                user.vehicleBrand
            );


        const vehicleModel =
            getValue(
                user.vehicleModel
            );


        const vehicleColor =
            getValue(
                user.vehicleColor
            );


        const status =
            getValue(
                user.verificationStatus,
                "pending"
            ).toLowerCase();


        const avatar =
            fullName
                .charAt(0)
                .toUpperCase();


        // --------------------------------------------------
        // PENDING ACTIONS
        // --------------------------------------------------

        let approvalActions = "";


        if (
            status === "pending"
        ) {

            approvalActions = `

                <button
                    class="approve-btn"
                    onclick="approveUser('${user.id}')">

                    <i class="fa-solid fa-check"></i>

                    Approve

                </button>


                <button
                    class="reject-btn"
                    onclick="rejectUser('${user.id}')">

                    <i class="fa-solid fa-xmark"></i>

                    Reject

                </button>

            `;

        }


        // --------------------------------------------------
        // USER CARD
        // --------------------------------------------------

        usersContainer.innerHTML += `

            <div class="user-card">


                <!-- AVATAR -->

                <div class="user-avatar">

                    ${escapeHTML(avatar)}

                </div>


                <!-- USER CONTENT -->

                <div class="user-content">


                    <div class="user-card-header">

                        <h2>

                            ${escapeHTML(fullName)}

                        </h2>


                        <span
                            class="
                                status-badge
                                status-${escapeHTML(status)}
                            ">

                            ${escapeHTML(
                                status
                            ).toUpperCase()}

                        </span>

                    </div>


                    <p>

                        <strong>Email:</strong>

                        ${escapeHTML(email)}

                    </p>


                    <p>

                        <strong>Phone:</strong>

                        ${escapeHTML(phone)}

                    </p>


                    <p>

                        <strong>Door:</strong>

                        ${escapeHTML(doorNumber)}

                    </p>


                    <p>

                        <strong>Vehicle:</strong>

                        ${escapeHTML(vehicleNumber)}

                    </p>


                    ${
                        vehicleNumber !== "N/A"
                        ? `

                        <p>

                            <strong>Type:</strong>

                            ${escapeHTML(
                                vehicleType
                            )}

                        </p>

                        <p>

                            <strong>Brand:</strong>

                            ${escapeHTML(
                                vehicleBrand
                            )}

                        </p>

                        <p>

                            <strong>Model:</strong>

                            ${escapeHTML(
                                vehicleModel
                            )}

                        </p>

                        <p>

                            <strong>Color:</strong>

                            ${escapeHTML(
                                vehicleColor
                            )}

                        </p>

                        `
                        : ""
                    }


                    <!-- ACTIONS -->

                    <div class="user-actions">

                        ${approvalActions}


                        <button
                            class="view-btn"
                            onclick="viewUser('${user.id}')">

                            <i class="fa-solid fa-eye"></i>

                            View

                        </button>


                        <button
                            class="delete-btn"
                            onclick="deleteUser('${user.id}')">

                            <i class="fa-solid fa-trash"></i>

                            Delete

                        </button>

                    </div>


                </div>


            </div>

        `;

    });

}


// ==========================================================
// SEARCH USERS
// ==========================================================

searchInput.addEventListener(
    "input",
    () => {

        const value =
            searchInput.value
                .toLowerCase()
                .trim();


        if (!value) {

            displayUsers(users);

            return;

        }


        const filtered =
            users.filter((user) => {

                const name =
                    String(
                        user.fullName || ""
                    ).toLowerCase();


                const vehicle =
                    String(
                        user.vehicleNumber || ""
                    ).toLowerCase();


                const door =
                    String(
                        user.doorNumber || ""
                    ).toLowerCase();


                const phone =
                    String(
                        user.phone || ""
                    ).toLowerCase();


                const email =
                    String(
                        user.email || ""
                    ).toLowerCase();


                return (

                    name.includes(value) ||

                    vehicle.includes(value) ||

                    door.includes(value) ||

                    phone.includes(value) ||

                    email.includes(value)

                );

            });


        displayUsers(filtered);

    }
);


// ==========================================================
// VIEW USER
// ==========================================================

window.viewUser = function(id) {

    const user =
        users.find(
            (item) =>
                item.id === id
        );


    if (!user) {

        alert(
            "User information not found."
        );

        return;

    }


    const name =
        getValue(
            user.fullName,
            "Unknown User"
        );


    const email =
        getValue(
            user.email
        );


    const phone =
        getValue(
            user.phone
        );


    const door =
        getValue(
            user.doorNumber
        );


    const vehicle =
        getValue(
            user.vehicleNumber
        );


    const status =
        getValue(
            user.verificationStatus,
            "pending"
        ).toLowerCase();


    document.getElementById(
        "modalUserAvatar"
    ).textContent =
        name
            .charAt(0)
            .toUpperCase();


    document.getElementById(
        "modalUserName"
    ).textContent =
        name;


    document.getElementById(
        "modalUserEmail"
    ).textContent =
        email;


    document.getElementById(
        "modalUserPhone"
    ).textContent =
        phone;


    document.getElementById(
        "modalUserDoor"
    ).textContent =
        door;


    document.getElementById(
        "modalUserVehicle"
    ).textContent =
        vehicle;


    const statusElement =
        document.getElementById(
            "modalUserStatus"
        );


    statusElement.textContent =
        status.toUpperCase();


    statusElement.className =
        `status-badge status-${status}`;


    document
        .getElementById("userModal")
        .classList.add("show");

};


// ==========================================================
// CLOSE MODAL
// ==========================================================

const userModal =
    document.getElementById(
        "userModal"
    );


const closeUserModal =
    document.getElementById(
        "closeUserModal"
    );


const closeUserModalBottom =
    document.getElementById(
        "closeUserModalBottom"
    );


function closeModal() {

    userModal.classList.remove(
        "show"
    );

}


if (closeUserModal) {

    closeUserModal.addEventListener(
        "click",
        closeModal
    );

}


if (closeUserModalBottom) {

    closeUserModalBottom.addEventListener(
        "click",
        closeModal
    );

}


if (userModal) {

    userModal.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                userModal
            ) {

                closeModal();

            }

        }
    );

}


// ==========================================================
// ESCAPE KEY
// ==========================================================

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape"
        ) {

            closeModal();

        }

    }
);


// ==========================================================
// APPROVE USER
// ==========================================================

window.approveUser =
    async function(id) {

        const user =
            users.find(
                (item) =>
                    item.id === id
            );


        if (!user) {

            return;

        }


        const confirmApproval =
            confirm(
                `Approve ${
                    user.fullName ||
                    "this user"
                }?`
            );


        if (!confirmApproval) {

            return;

        }


        try {

            await updateDoc(
                doc(
                    db,
                    "users",
                    id
                ),
                {

                    verificationStatus:
                        "approved"

                }
            );


            alert(
                "User approved successfully."
            );


            await loadUsers();

        }


        catch (error) {

            console.error(
                "Approval error:",
                error
            );


            alert(
                "Unable to approve user."
            );

        }

    };


// ==========================================================
// REJECT USER
// ==========================================================

window.rejectUser =
    async function(id) {

        const user =
            users.find(
                (item) =>
                    item.id === id
            );


        if (!user) {

            return;

        }


        const confirmReject =
            confirm(
                `Reject ${
                    user.fullName ||
                    "this user"
                }?`
            );


        if (!confirmReject) {

            return;

        }


        try {

            await updateDoc(
                doc(
                    db,
                    "users",
                    id
                ),
                {

                    verificationStatus:
                        "rejected"

                }
            );


            alert(
                "User rejected."
            );


            await loadUsers();

        }


        catch (error) {

            console.error(
                "Rejection error:",
                error
            );


            alert(
                "Unable to reject user."
            );

        }

    };


// ==========================================================
// DELETE USER
// ==========================================================

window.deleteUser =
    async function(id) {

        const user =
            users.find(
                (item) =>
                    item.id === id
            );


        const name =
            user?.fullName ||
            "this user";


        const confirmed =
            confirm(
                `Delete ${name}?\n\nThis action cannot be undone.`
            );


        if (!confirmed) {

            return;

        }


        try {

            await deleteDoc(
                doc(
                    db,
                    "users",
                    id
                )
            );


            alert(
                "User deleted successfully."
            );


            await loadUsers();

        }


        catch (error) {

            console.error(
                "Delete error:",
                error
            );


            alert(
                "Unable to delete user."
            );

        }

    };


// ==========================================================
// INITIAL LOAD
// ==========================================================

loadUsers();