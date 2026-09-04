import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    doc,
    updateDoc,
    serverTimestamp,
    arrayUnion
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


/* ==========================================================
   ELEMENTS
   ========================================================== */

const visitorContainer =
    document.getElementById("visitorContainer");

const expectedCount =
    document.getElementById("expectedCount");

const insideCount =
    document.getElementById("insideCount");

const completedCount =
    document.getElementById("completedCount");

const searchInput =
    document.getElementById("searchInput");

/*
   IMPORTANT:
   Your visitors.html uses auditLogContainer.
*/
const globalAuditLog =
    document.getElementById("auditLogContainer");


/* ==========================================================
   LOCAL DATA
   ========================================================== */

let visitors = [];


/* ==========================================================
   ESCAPE HTML
   ========================================================== */

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


/* ==========================================================
   GET VALUE
   ========================================================== */

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


/* ==========================================================
   APPROVAL CLASS
   ========================================================== */

function approvalClass(approval) {

    const value =
        String(approval || "pending").toLowerCase();

    if (value === "approved") {
        return "approval-approved";
    }

    if (value === "rejected") {
        return "approval-rejected";
    }

    return "approval-pending";
}


/* ==========================================================
   FORMAT AUDIT TIME
   ========================================================== */

function formatAuditTime(timestamp) {

    if (!timestamp) {
        return "Time unavailable";
    }

    try {

        if (timestamp.toDate) {
            return timestamp.toDate().toLocaleString();
        }

        return new Date(timestamp).toLocaleString();

    } catch (error) {

        return "Time unavailable";
    }
}


/* ==========================================================
   CREATE AUDIT EVENT
   ========================================================== */

function createAuditEvent(
    action,
    method = "Security Management"
) {

    return {

        action: action,

        performedBy: "Administrator",

        method: method,

        timestamp: new Date().toISOString()

    };
}


/* ==========================================================
   LOAD VISITORS
   ========================================================== */

async function loadVisitors() {

    try {

        visitorContainer.innerHTML = "";

        let expected = 0;
        let inside = 0;
        let completed = 0;

        const snapshot =
            await getDocs(
                collection(db, "visitors")
            );

        visitors = [];

        snapshot.forEach((documentSnapshot) => {

            const visitor = {

                id: documentSnapshot.id,

                ...documentSnapshot.data()

            };

            visitors.push(visitor);

        });


        /* ==================================================
           STATISTICS
           ================================================== */

        visitors.forEach((visitor) => {

            if (visitor.status === "expected") {

                expected++;

            }

            else if (visitor.status === "checked-in") {

                inside++;

            }

            else if (visitor.status === "checked-out") {

                completed++;

            }

        });


        expectedCount.textContent = expected;

        insideCount.textContent = inside;

        completedCount.textContent = completed;


        renderVisitors(visitors);

        renderGlobalAuditLog(visitors);

    }

    catch (error) {

        console.error(
            "Error loading visitors:",
            error
        );

        visitorContainer.innerHTML = `

            <div class="visitor-card">

                <h2>
                    Unable to load visitors
                </h2>

                <p>
                    Please check your Firebase connection.
                </p>

            </div>

        `;

    }

}


/* ==========================================================
   RENDER VISITORS
   ========================================================== */

function renderVisitors(visitorList) {

    visitorContainer.innerHTML = "";


    if (visitorList.length === 0) {

        visitorContainer.innerHTML = `

            <div class="visitor-card">

                <h2>
                    No visitors found
                </h2>

                <p>
                    No visitor records match your search.
                </p>

            </div>

        `;

        return;

    }


    visitorList.forEach((visitor) => {

        const approval =
            getValue(
                visitor.residentApproval,
                "pending"
            );


        const visitorSlot =
            getValue(
                visitor.visitorSlot,
                "Not Assigned"
            );


        const emergencyEntry =
            visitor.emergencyEntry === true;


        const adminOverride =
            visitor.adminOverride === true;


        const status =
            getValue(
                visitor.status,
                "expected"
            );


        const statusClass =
            String(status).replace("checked-", "");


        const auditLogs =
            Array.isArray(visitor.auditLog)
                ? visitor.auditLog
                : [];


        /* ==================================================
           CHECK IN
           ================================================== */

        let checkInButton = "";

        if (status === "expected") {

            checkInButton = `

                <button
                    class="checkin-btn"
                    onclick="checkInVisitor('${visitor.id}')">

                    <i class="fa-solid fa-right-to-bracket"></i>

                    Check In

                </button>

            `;

        }


        /* ==================================================
           CHECK OUT
           ================================================== */

        let checkOutButton = "";

        if (status === "checked-in") {

            checkOutButton = `

                <button
                    class="checkout-btn"
                    onclick="checkOutVisitor('${visitor.id}')">

                    <i class="fa-solid fa-right-from-bracket"></i>

                    Check Out

                </button>

            `;

        }


        /* ==================================================
           APPROVAL BUTTONS
           ================================================== */

        let approvalButtons = "";

        if (
            approval !== "approved" &&
            approval !== "rejected"
        ) {

            approvalButtons = `

                <button
                    class="approve-btn"
                    onclick="approveVisitor('${visitor.id}')">

                    <i class="fa-solid fa-check"></i>

                    Approve

                </button>


                <button
                    class="reject-btn"
                    onclick="rejectVisitor('${visitor.id}')">

                    <i class="fa-solid fa-xmark"></i>

                    Reject

                </button>

            `;

        }


        /* ==================================================
           EMERGENCY ENTRY
           ================================================== */

        const emergencyButton = `

            <button
                class="emergency-btn"
                onclick="toggleEmergencyEntry(
                    '${visitor.id}',
                    ${emergencyEntry}
                )">

                <i class="fa-solid fa-triangle-exclamation"></i>

                ${
                    emergencyEntry
                        ? "Disable Emergency"
                        : "Emergency Entry"
                }

            </button>

        `;


        /* ==================================================
           ADMIN OVERRIDE
           ================================================== */

        const overrideButton = `

            <button
                class="override-btn"
                onclick="toggleAdminOverride(
                    '${visitor.id}',
                    ${adminOverride}
                )">

                <i class="fa-solid fa-user-shield"></i>

                ${
                    adminOverride
                        ? "Disable Override"
                        : "Admin Override"
                }

            </button>

        `;


        /* ==================================================
           VISITOR AUDIT
           ================================================== */

        let auditHTML = "";

        if (auditLogs.length > 0) {

            auditHTML = auditLogs
                .slice(-5)
                .reverse()
                .map((entry) => {

                    return `

                        <div class="audit-entry">

                            <span class="audit-action">

                                ${escapeHTML(
                                    getValue(
                                        entry.action,
                                        "Visitor Event"
                                    )
                                )}

                            </span>


                            <span class="audit-time">

                                ${escapeHTML(
                                    formatAuditTime(
                                        entry.timestamp
                                    )
                                )}

                            </span>


                            <div>

                                By:
                                ${escapeHTML(
                                    getValue(
                                        entry.performedBy,
                                        "Administrator"
                                    )
                                )}

                            </div>


                            <div>

                                Method:
                                ${escapeHTML(
                                    getValue(
                                        entry.method,
                                        "Security Management"
                                    )
                                )}

                            </div>

                        </div>

                    `;

                })
                .join("");

        }

        else {

            auditHTML = `

                <div class="audit-entry">

                    No events recorded.

                </div>

            `;

        }


        /* ==================================================
           VISITOR CARD
           ================================================== */

        visitorContainer.innerHTML += `

            <div class="visitor-card">


                <div class="visitor-card-header">

                    <div>

                        <h2>

                            ${escapeHTML(
                                getValue(
                                    visitor.visitorName,
                                    "Unknown Visitor"
                                )
                            )}

                        </h2>


                        <p>

                            <strong>Resident:</strong>

                            ${escapeHTML(
                                getValue(
                                    visitor.residentName,
                                    "N/A"
                                )
                            )}

                        </p>

                    </div>


                    <span class="status ${statusClass}">

                        ${escapeHTML(status).toUpperCase()}

                    </span>

                </div>


                <div class="visitor-details">


                    <p>

                        <strong>Phone:</strong>

                        ${escapeHTML(
                            getValue(
                                visitor.phone,
                                "N/A"
                            )
                        )}

                    </p>


                    <p>

                        <strong>Purpose:</strong>

                        ${escapeHTML(
                            getValue(
                                visitor.purpose,
                                "N/A"
                            )
                        )}

                    </p>


                    <p>

                        <strong>Vehicle:</strong>

                        ${escapeHTML(
                            getValue(
                                visitor.vehicleNumber,
                                "N/A"
                            )
                        )}

                    </p>


                    <p>

                        <strong>Door No:</strong>

                        ${escapeHTML(
                            getValue(
                                visitor.doorNumber,
                                "N/A"
                            )
                        )}

                    </p>


                    <p>

                        <strong>Visit Date:</strong>

                        ${escapeHTML(
                            getValue(
                                visitor.visitDate,
                                "N/A"
                            )
                        )}

                    </p>


                    <p>

                        <strong>Arrival Time:</strong>

                        ${escapeHTML(
                            getValue(
                                visitor.arrivalTime,
                                "N/A"
                            )
                        )}

                    </p>

                </div>


                <!-- ==============================
                     SECURITY DETAILS
                     ============================== -->

                <div class="visitor-security-panel">


                    <div class="security-title">

                        <i class="fa-solid fa-shield-halved"></i>

                        Security Details

                    </div>


                    <div class="security-grid">


                        <div class="security-item">

                            <span class="security-label">

                                Resident Approval

                            </span>

                            <span
                                class="security-value
                                ${approvalClass(approval)}">

                                ${escapeHTML(
                                    approval
                                ).toUpperCase()}

                            </span>

                        </div>


                        <div class="security-item">

                            <span class="security-label">

                                Visitor Slot

                            </span>

                            <span class="security-value slot-value">

                                ${escapeHTML(
                                    visitorSlot
                                )}

                            </span>

                        </div>


                        <div class="security-item">

                            <span class="security-label">

                                Emergency Entry

                            </span>

                            <span
                                class="security-value
                                ${
                                    emergencyEntry
                                        ? "emergency-active"
                                        : ""
                                }">

                                ${
                                    emergencyEntry
                                        ? "ENABLED"
                                        : "DISABLED"
                                }

                            </span>

                        </div>


                        <div class="security-item">

                            <span class="security-label">

                                Admin Override

                            </span>

                            <span
                                class="security-value
                                ${
                                    adminOverride
                                        ? "override-active"
                                        : ""
                                }">

                                ${
                                    adminOverride
                                        ? "ENABLED"
                                        : "DISABLED"
                                }

                            </span>

                        </div>


                    </div>


                    <!-- ==============================
                         SECURITY ACTIONS
                         ============================== -->

                    <div class="security-actions">

                        ${approvalButtons}

                        ${checkInButton}

                        ${checkOutButton}

                        ${emergencyButton}

                        ${overrideButton}

                    </div>


                    <!-- ==============================
                         VISITOR AUDIT
                         ============================== -->

                    <div class="audit-section">

                        <div class="audit-title">

                            <i class="fa-solid fa-clock-rotate-left"></i>

                            Visitor Audit

                        </div>


                        <div class="audit-list">

                            ${auditHTML}

                        </div>

                    </div>


                </div>


            </div>

        `;

    });

}


/* ==========================================================
   SEARCH
   ========================================================== */

searchInput.addEventListener(
    "input",
    function () {

        const search =
            this.value
                .toLowerCase()
                .trim();


        if (!search) {

            renderVisitors(visitors);

            return;

        }


        const filtered =
            visitors.filter((visitor) => {

                const searchableText = [

                    visitor.visitorName,

                    visitor.residentName,

                    visitor.phone,

                    visitor.vehicleNumber,

                    visitor.doorNumber,

                    visitor.purpose,

                    visitor.visitorSlot,

                    visitor.residentApproval,

                    visitor.status

                ]

                    .filter(Boolean)

                    .join(" ")

                    .toLowerCase();


                return searchableText.includes(search);

            });


        renderVisitors(filtered);

    }
);


/* ==========================================================
   APPROVE VISITOR
   ========================================================== */

window.approveVisitor = async function(id) {

    try {

        await updateDoc(
            doc(db, "visitors", id),
            {

                residentApproval: "approved",

                approvalStatus: "approved",

                approvalTime:
                    serverTimestamp(),

                auditLog:
                    arrayUnion(
                        createAuditEvent(
                            "Resident Approval: APPROVED",
                            "Resident Approval"
                        )
                    )

            }
        );


        await loadVisitors();

    }

    catch (error) {

        console.error(
            "Approval error:",
            error
        );

        alert(
            "Unable to approve visitor."
        );

    }

};


/* ==========================================================
   REJECT VISITOR
   ========================================================== */

window.rejectVisitor = async function(id) {

    try {

        await updateDoc(
            doc(db, "visitors", id),
            {

                residentApproval: "rejected",

                approvalStatus: "rejected",

                approvalTime:
                    serverTimestamp(),

                auditLog:
                    arrayUnion(
                        createAuditEvent(
                            "Resident Approval: REJECTED",
                            "Resident Approval"
                        )
                    )

            }
        );


        await loadVisitors();

    }

    catch (error) {

        console.error(
            "Rejection error:",
            error
        );

        alert(
            "Unable to reject visitor."
        );

    }

};


/* ==========================================================
   EMERGENCY ENTRY
   ========================================================== */

window.toggleEmergencyEntry =
async function(id, currentValue) {

    const newValue =
        !currentValue;


    try {

        await updateDoc(
            doc(db, "visitors", id),
            {

                emergencyEntry: newValue,

                emergencyEntryTime:
                    serverTimestamp(),

                auditLog:
                    arrayUnion(
                        createAuditEvent(
                            newValue
                                ? "Emergency Entry ENABLED"
                                : "Emergency Entry DISABLED",
                            "Emergency Security Action"
                        )
                    )

            }
        );


        await loadVisitors();

    }

    catch (error) {

        console.error(
            "Emergency entry error:",
            error
        );

        alert(
            "Unable to update emergency entry."
        );

    }

};


/* ==========================================================
   ADMIN OVERRIDE
   ========================================================== */

window.toggleAdminOverride =
async function(id, currentValue) {

    const newValue =
        !currentValue;


    try {

        await updateDoc(
            doc(db, "visitors", id),
            {

                adminOverride: newValue,

                adminOverrideTime:
                    serverTimestamp(),

                auditLog:
                    arrayUnion(
                        createAuditEvent(
                            newValue
                                ? "Admin Override ENABLED"
                                : "Admin Override DISABLED",
                            "Administrative Override"
                        )
                    )

            }
        );


        await loadVisitors();

    }

    catch (error) {

        console.error(
            "Admin override error:",
            error
        );

        alert(
            "Unable to update admin override."
        );

    }

};


/* ==========================================================
   CHECK IN
   ========================================================== */

window.checkInVisitor = async function(id) {

    try {

        await updateDoc(
            doc(db, "visitors", id),
            {

                status: "checked-in",

                checkInTime:
                    serverTimestamp(),

                auditLog:
                    arrayUnion(
                        createAuditEvent(
                            "Visitor Checked In",
                            "Security Check In"
                        )
                    )

            }
        );


        await loadVisitors();

    }

    catch (error) {

        console.error(
            "Check-in error:",
            error
        );

        alert(
            "Unable to check in visitor."
        );

    }

};


/* ==========================================================
   CHECK OUT
   ========================================================== */

window.checkOutVisitor = async function(id) {

    try {

        await updateDoc(
            doc(db, "visitors", id),
            {

                status: "checked-out",

                checkOutTime:
                    serverTimestamp(),

                auditLog:
                    arrayUnion(
                        createAuditEvent(
                            "Visitor Checked Out",
                            "Security Check Out"
                        )
                    )

            }
        );


        await loadVisitors();

    }

    catch (error) {

        console.error(
            "Check-out error:",
            error
        );

        alert(
            "Unable to check out visitor."
        );

    }

};


/* ==========================================================
   GLOBAL AUDIT LOG
   ========================================================== */

function renderGlobalAuditLog(visitorList) {

    if (!globalAuditLog) {
        return;
    }


    const events = [];


    visitorList.forEach((visitor) => {

        if (!Array.isArray(visitor.auditLog)) {
            return;
        }


        visitor.auditLog.forEach((event) => {

            events.push({

                visitor:
                    visitor.visitorName ||
                    "Unknown Visitor",

                ...event

            });

        });

    });


    events.sort(
        (a, b) =>
            new Date(b.timestamp || 0) -
            new Date(a.timestamp || 0)
    );


    const latestEvents =
        events.slice(0, 15);


    if (latestEvents.length === 0) {

        globalAuditLog.innerHTML = `

            <p class="empty-audit">

                No audit records yet.

            </p>

        `;

        return;

    }


    globalAuditLog.innerHTML =
        latestEvents
            .map((event) => {

                return `

                    <div class="audit-entry">


                        <span class="audit-action">

                            ${escapeHTML(
                                getValue(
                                    event.action,
                                    "Visitor Event"
                                )
                            )}

                        </span>


                        <span class="audit-time">

                            ${escapeHTML(
                                formatAuditTime(
                                    event.timestamp
                                )
                            )}

                        </span>


                        <div>

                            Visitor:

                            ${escapeHTML(
                                getValue(
                                    event.visitor,
                                    "Unknown Visitor"
                                )
                            )}

                        </div>


                        <div>

                            By:

                            ${escapeHTML(
                                getValue(
                                    event.performedBy,
                                    "Administrator"
                                )
                            )}

                        </div>


                        <div>

                            Method:

                            ${escapeHTML(
                                getValue(
                                    event.method,
                                    "Security Management"
                                )
                            )}

                        </div>


                    </div>

                `;

            })
            .join("");

}


/* ==========================================================
   INITIAL LOAD
   ========================================================== */

loadVisitors();