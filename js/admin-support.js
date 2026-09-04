// ============================================================
// SMARTPARK AI - ADMIN SUPPORT
// ============================================================

import {
    auth,
    db
} from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


// ============================================================
// DOM ELEMENTS
// ============================================================

const requestsContainer =
    document.getElementById(
        "supportRequestsContainer"
    );

const openCount =
    document.getElementById(
        "openCount"
    );

const progressCount =
    document.getElementById(
        "progressCount"
    );

const resolvedCount =
    document.getElementById(
        "resolvedCount"
    );

const refreshBtn =
    document.getElementById(
        "refreshSupportBtn"
    );

const supportFilter =
    document.getElementById(
        "supportFilter"
    );

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


// ============================================================
// REPLY MODAL
// ============================================================

const replyModal =
    document.getElementById(
        "supportReplyModal"
    );

const closeReplyModal =
    document.getElementById(
        "closeReplyModal"
    );

const cancelReplyBtn =
    document.getElementById(
        "cancelReplyBtn"
    );

const sendReplyBtn =
    document.getElementById(
        "sendReplyBtn"
    );

const adminReply =
    document.getElementById(
        "adminReply"
    );

const replyResidentName =
    document.getElementById(
        "replyResidentName"
    );

const replyRequestDetails =
    document.getElementById(
        "replyRequestDetails"
    );


// ============================================================
// CURRENT REQUEST
// ============================================================

let selectedRequestId = null;

let allRequests = [];


// ============================================================
// NOTIFICATION HANDOFF
// ============================================================
//
// admin.js stores the selected support request here before
// opening the support page.
//

const savedSupportRequestId =
    localStorage.getItem(
        "activeSupportRequestId"
    );

if (savedSupportRequestId) {

    selectedRequestId =
        savedSupportRequestId;

    localStorage.removeItem(
        "activeSupportRequestId"
    );

    console.log(
        "📩 Support request received from notification:",
        selectedRequestId
    );
}


// ============================================================
// INITIAL MESSAGE
// ============================================================

console.log(
    "💬 SmartPark Admin Support loaded"
);


// ============================================================
// AUTHENTICATION
// ============================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;
        }


        try {

            // ----------------------------------------------------
            // GET USER PROFILE
            // ----------------------------------------------------

            const userRef =
                doc(
                    db,
                    "users",
                    user.uid
                );

            const userSnapshot =
                await getDoc(
                    userRef
                );


            if (!userSnapshot.exists()) {

                alert(
                    "Admin account not found."
                );

                window.location.href =
                    "login.html";

                return;
            }


            const userData =
                userSnapshot.data();


            // ----------------------------------------------------
            // ADMIN SECURITY CHECK
            // ----------------------------------------------------

            if (
                userData.role !== "admin"
            ) {

                alert(
                    "Access Denied"
                );

                window.location.href =
                    "dashboard.html";

                return;
            }


            console.log(
                "✅ Admin authenticated:",
                userData.fullName ||
                userData.email
            );


            // ----------------------------------------------------
            // LOAD SUPPORT REQUESTS
            // ----------------------------------------------------

            await loadSupportRequests();


            // ----------------------------------------------------
            // OPEN REQUEST FROM NOTIFICATION
            // ----------------------------------------------------

            if (selectedRequestId) {

                console.log(
                    "📩 Opening notification request:",
                    selectedRequestId
                );

                // Give the request list time to render
                setTimeout(
                    () => {

                        openAdminSupportConversation(
                            selectedRequestId
                        );

                    },
                    150
                );
            }

        }

        catch (error) {

            console.error(
                "❌ Admin authentication error:",
                error
            );

        }

    }
);


// ============================================================
// LOAD SUPPORT REQUESTS
// ============================================================

async function loadSupportRequests() {

    if (!requestsContainer) {

        console.error(
            "❌ supportRequestsContainer not found."
        );

        return;
    }


    requestsContainer.innerHTML = `

        <div class="support-loading">

            <i class="fa-solid fa-spinner fa-spin"></i>

            Loading support requests...

        </div>

    `;


    try {

        const supportRef =
            collection(
                db,
                "supportMessages"
            );


        // ----------------------------------------------------
        // TRY ORDERED QUERY
        // ----------------------------------------------------

        let snapshot;


        try {

            const requestsQuery =
                query(
                    supportRef,
                    orderBy(
                        "createdAt",
                        "desc"
                    )
                );

            snapshot =
                await getDocs(
                    requestsQuery
                );

        }

        catch (orderError) {

            console.warn(
                "⚠️ Ordered query failed. Loading without order.",
                orderError
            );

            snapshot =
                await getDocs(
                    supportRef
                );
        }


        // ----------------------------------------------------
        // STORE REQUESTS
        // ----------------------------------------------------

        allRequests = [];


        snapshot.forEach(
            (requestDoc) => {

                allRequests.push({

                    id:
                        requestDoc.id,

                    ...requestDoc.data()

                });

            }
        );


        // ----------------------------------------------------
        // SORT LOCALLY
        // ----------------------------------------------------

        allRequests.sort(
            (a, b) => {

                const timeA =
                    getTimestampMillis(
                        a.createdAt
                    );

                const timeB =
                    getTimestampMillis(
                        b.createdAt
                    );

                return timeB - timeA;

            }
        );


        console.log(
            "📋 Support requests loaded:",
            allRequests.length
        );


        updateStatistics();

        displayRequests();


        // ----------------------------------------------------
        // OPEN SELECTED REQUEST IF AVAILABLE
        // ----------------------------------------------------

        if (
            selectedRequestId &&
            document.visibilityState === "visible"
        ) {

            const exists =
                allRequests.some(
                    request =>
                        request.id ===
                        selectedRequestId
                );


            if (exists) {

                setTimeout(
                    () => {

                        openAdminSupportConversation(
                            selectedRequestId
                        );

                    },
                    100
                );
            }
        }

    }

    catch (error) {

        console.error(
            "❌ Failed to load support requests:",
            error
        );


        requestsContainer.innerHTML = `

            <div class="support-empty">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <h3>
                    Unable to load requests
                </h3>

                <p>
                    ${escapeHTML(
                        error.message ||
                        "Unknown error"
                    )}
                </p>

            </div>

        `;

    }

}


// ============================================================
// UPDATE STATISTICS
// ============================================================

function updateStatistics() {

    let open = 0;

    let progress = 0;

    let resolved = 0;


    allRequests.forEach(
        (request) => {

            const status =
                request.status ||
                "open";


            if (
                status === "open"
            ) {

                open++;

            }

            else if (
                status === "in-progress"
            ) {

                progress++;

            }

            else if (
                status === "resolved"
            ) {

                resolved++;

            }

        }
    );


    if (openCount) {

        openCount.textContent =
            open;

    }


    if (progressCount) {

        progressCount.textContent =
            progress;

    }


    if (resolvedCount) {

        resolvedCount.textContent =
            resolved;

    }

}


// ============================================================
// DISPLAY REQUESTS
// ============================================================

function displayRequests() {

    if (!requestsContainer) {

        return;
    }


    const filter =
        supportFilter
            ? supportFilter.value
            : "all";


    let requests =
        allRequests;


    if (
        filter !== "all"
    ) {

        requests =
            allRequests.filter(
                request => {

                    return (
                        request.status ||
                        "open"
                    ) === filter;

                }
            );

    }


    // --------------------------------------------------------
    // NO REQUESTS
    // --------------------------------------------------------

    if (
        requests.length === 0
    ) {

        requestsContainer.innerHTML = `

            <div class="support-empty">

                <i class="fa-solid fa-circle-check"></i>

                <h3>
                    No Support Requests
                </h3>

                <p>
                    There are no requests in this category.
                </p>

            </div>

        `;

        return;
    }


    // --------------------------------------------------------
    // DISPLAY
    // --------------------------------------------------------

    requestsContainer.innerHTML =
        requests
            .map(
                createRequestCard
            )
            .join("");


    attachRequestEvents();

}


// ============================================================
// CREATE REQUEST CARD
// ============================================================

function createRequestCard(
    request
) {

    const status =
        request.status ||
        "open";


    const statusText =
        status === "in-progress"
            ? "In Progress"
            : status.charAt(0).toUpperCase()
              + status.slice(1);


    const date =
        formatTimestamp(
            request.createdAt
        );


    return `

        <div
            class="support-request-card"
            data-id="${escapeAttribute(request.id)}"
        >

            <div class="support-request-top">

                <div>

                    <h3 class="support-request-title">

                        ${escapeHTML(
                            request.subject ||
                            "Support Request"
                        )}

                    </h3>


                    <div class="support-request-user">

                        <i class="fa-solid fa-user"></i>

                        ${escapeHTML(
                            request.userName ||
                            "Unknown User"
                        )}

                        &nbsp; • &nbsp;

                        ${escapeHTML(
                            request.userEmail ||
                            ""
                        )}

                    </div>

                </div>


                <span
                    class="support-status ${escapeAttribute(status)}"
                >

                    ${escapeHTML(statusText)}

                </span>

            </div>


            <div class="support-request-meta">

                <div class="support-meta-item">

                    <span>
                        Category
                    </span>

                    <strong>

                        ${escapeHTML(
                            request.category ||
                            "Other"
                        )}

                    </strong>

                </div>


                <div class="support-meta-item">

                    <span>
                        Door Number
                    </span>

                    <strong>

                        ${escapeHTML(
                            request.doorNumber ||
                            "N/A"
                        )}

                    </strong>

                </div>


                <div class="support-meta-item">

                    <span>
                        Submitted
                    </span>

                    <strong>

                        ${escapeHTML(date)}

                    </strong>

                </div>

            </div>


            <div class="support-message">

                ${escapeHTML(
                    request.message ||
                    "No message provided."
                )}

            </div>


            ${
                request.adminReply
                ? `

                    <div class="support-message">

                        <strong>

                            <i class="fa-solid fa-reply"></i>

                            Admin Reply

                        </strong>

                        <br><br>

                        ${escapeHTML(
                            request.adminReply
                        )}

                    </div>

                `
                : ""
            }


            <div class="support-request-actions">

                ${
                    status !== "resolved"
                    ? `

                        <button
                            type="button"
                            class="support-action-btn support-reply-btn"
                            data-action="reply"
                            data-id="${escapeAttribute(request.id)}"
                        >

                            <i class="fa-solid fa-reply"></i>

                            Reply

                        </button>

                    `
                    : ""
                }


                ${
                    status === "open"
                    ? `

                        <button
                            type="button"
                            class="support-action-btn support-progress-btn"
                            data-action="progress"
                            data-id="${escapeAttribute(request.id)}"
                        >

                            <i class="fa-solid fa-spinner"></i>

                            Mark In Progress

                        </button>

                    `
                    : ""
                }


                ${
                    status !== "resolved"
                    ? `

                        <button
                            type="button"
                            class="support-action-btn support-resolve-btn"
                            data-action="resolve"
                            data-id="${escapeAttribute(request.id)}"
                        >

                            <i class="fa-solid fa-check"></i>

                            Resolve

                        </button>

                    `
                    : ""
                }

            </div>

        </div>

    `;

}


// ============================================================
// ATTACH REQUEST EVENTS
// ============================================================

function attachRequestEvents() {

    document
        .querySelectorAll(
            ".support-action-btn"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    async (event) => {

                        event.preventDefault();

                        event.stopPropagation();


                        const id =
                            button.dataset.id;


                        const action =
                            button.dataset.action;


                        if (!id) {

                            console.error(
                                "❌ Missing support request ID."
                            );

                            return;
                        }


                        // ------------------------------------------------
                        // REPLY
                        // ------------------------------------------------

                        if (
                            action === "reply"
                        ) {

                            openAdminSupportConversation(
                                id
                            );

                            return;
                        }


                        // ------------------------------------------------
                        // PROGRESS
                        // ------------------------------------------------

                        if (
                            action === "progress"
                        ) {

                            await updateRequestStatus(
                                id,
                                "in-progress"
                            );

                            return;
                        }


                        // ------------------------------------------------
                        // RESOLVE
                        // ------------------------------------------------

                        if (
                            action === "resolve"
                        ) {

                            await updateRequestStatus(
                                id,
                                "resolved"
                            );

                        }

                    }
                );

            }
        );

}


// ============================================================
// OPEN ADMIN SUPPORT CONVERSATION
// ============================================================
//
// IMPORTANT:
// This function is exposed through window so admin.js can call it.
// ES modules normally keep functions private to the module.
//

async function openAdminSupportConversation(
    requestId
) {

    console.log(
        "💬 Opening admin support conversation:",
        requestId
    );


    if (!requestId) {

        console.error(
            "❌ No support request ID supplied."
        );

        return;
    }


    // --------------------------------------------------------
    // FIND REQUEST IN CACHE
    // --------------------------------------------------------

    let request =
        allRequests.find(
            item =>
                item.id ===
                requestId
        );


    // --------------------------------------------------------
    // IF NOT IN CACHE, LOAD DIRECTLY
    // --------------------------------------------------------

    if (!request) {

        try {

            const requestRef =
                doc(
                    db,
                    "supportMessages",
                    requestId
                );


            const requestSnapshot =
                await getDoc(
                    requestRef
                );


            if (
                !requestSnapshot.exists()
            ) {

                console.error(
                    "❌ Support request does not exist:",
                    requestId
                );

                alert(
                    "This support request could not be found."
                );

                return;
            }


            request = {

                id:
                    requestSnapshot.id,

                ...requestSnapshot.data()

            };


            // Add to cache
            allRequests.push(
                request
            );

        }

        catch (error) {

            console.error(
                "❌ Failed to load support request:",
                error
            );

            alert(
                "Unable to open this support request."
            );

            return;
        }

    }


    selectedRequestId =
        requestId;


    // --------------------------------------------------------
    // MARK AS READ
    // --------------------------------------------------------

    try {

        await updateDoc(

            doc(
                db,
                "supportMessages",
                requestId
            ),

            {
                readByAdmin:
                    true,

                updatedAt:
                    serverTimestamp()
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


    // --------------------------------------------------------
    // OPEN REPLY MODAL
    // --------------------------------------------------------

    openReplyModal(
        requestId
    );

}


// ============================================================
// MAKE FUNCTION AVAILABLE TO admin.js
// ============================================================

window.openAdminSupportConversation =
    openAdminSupportConversation;


// ============================================================
// OPEN REPLY MODAL
// ============================================================

function openReplyModal(
    requestId
) {

    const request =
        allRequests.find(
            item =>
                item.id ===
                requestId
        );


    if (!request) {

        console.error(
            "❌ Request not found:",
            requestId
        );

        return;
    }


    selectedRequestId =
        requestId;


    // --------------------------------------------------------
    // RESIDENT NAME
    // --------------------------------------------------------

    if (replyResidentName) {

        replyResidentName.textContent =
            request.userName ||
            request.fullName ||
            "Resident";

    }


    // --------------------------------------------------------
    // REQUEST DETAILS
    // --------------------------------------------------------

    if (replyRequestDetails) {

        replyRequestDetails.innerHTML = `

            <strong>

                ${escapeHTML(
                    request.subject ||
                    "Support Request"
                )}

            </strong>

            <br><br>

            <strong>
                Category:
            </strong>

            ${escapeHTML(
                request.category ||
                "Other"
            )}

            <br><br>

            <strong>
                Door Number:
            </strong>

            ${escapeHTML(
                request.doorNumber ||
                "N/A"
            )}

            <br><br>

            <strong>
                Message:
            </strong>

            <br>

            ${escapeHTML(
                request.message ||
                "No message provided."
            )}

        `;

    }


    // --------------------------------------------------------
    // EXISTING ADMIN REPLY
    // --------------------------------------------------------

    if (adminReply) {

        adminReply.value =
            request.adminReply ||
            "";

    }


    // --------------------------------------------------------
    // OPEN MODAL
    // --------------------------------------------------------

    if (replyModal) {

        replyModal.style.display =
            "flex";

    }


    if (adminReply) {

        setTimeout(
            () => {

                adminReply.focus();

            },
            100
        );

    }


    console.log(
        "✅ Reply modal opened for:",
        requestId
    );

}


// ============================================================
// CLOSE REPLY MODAL
// ============================================================

function closeReplyForm() {

    if (replyModal) {

        replyModal.style.display =
            "none";

    }


    selectedRequestId =
        null;


    if (adminReply) {

        adminReply.value =
            "";

    }

}


// ============================================================
// CLOSE BUTTON
// ============================================================

if (closeReplyModal) {

    closeReplyModal.addEventListener(
        "click",
        closeReplyForm
    );

}


if (cancelReplyBtn) {

    cancelReplyBtn.addEventListener(
        "click",
        closeReplyForm
    );

}


if (replyModal) {

    replyModal.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                replyModal
            ) {

                closeReplyForm();

            }

        }
    );

}


// ============================================================
// SEND ADMIN REPLY
// ============================================================

async function sendAdminSupportReply() {

    if (!selectedRequestId) {

        console.error(
            "❌ No support request selected."
        );

        return;
    }


    if (!adminReply) {

        console.error(
            "❌ adminReply input not found."
        );

        return;
    }


    const message =
        adminReply.value.trim();


    if (!message) {

        alert(
            "Please enter a reply."
        );

        adminReply.focus();

        return;
    }


    if (sendReplyBtn) {

        sendReplyBtn.disabled =
            true;

        sendReplyBtn.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            Sending...

        `;

    }


    const requestId =
        selectedRequestId;


    try {

        // ========================================================
        // 1. ADD REPLY TO SUBCOLLECTION
        // ========================================================

        const repliesRef =
            collection(
                db,
                "supportMessages",
                requestId,
                "replies"
            );


        await addDoc(
            repliesRef,
            {

                message:
                    message,

                senderRole:
                    "admin",

                senderType:
                    "admin",

                senderName:
                    "Administrator",

                createdAt:
                    serverTimestamp()

            }
        );


        console.log(
            "✅ Admin reply added to replies."
        );


        // ========================================================
        // 2. UPDATE PARENT SUPPORT DOCUMENT
        // ========================================================

        await updateDoc(

            doc(
                db,
                "supportMessages",
                requestId
            ),

            {

                adminReply:
                    message,

                status:
                    "in-progress",

                lastMessage:
                    message,

                lastSender:
                    "admin",

                lastMessageAt:
                    serverTimestamp(),

                readByAdmin:
                    true,

                updatedAt:
                    serverTimestamp()

            }

        );


        console.log(
            "✅ Support document updated."
        );


        // ========================================================
        // 3. UPDATE LOCAL CACHE
        // ========================================================

        const localRequest =
            allRequests.find(
                request =>
                    request.id ===
                    requestId
            );


        if (localRequest) {

            localRequest.adminReply =
                message;

            localRequest.status =
                "in-progress";

            localRequest.lastMessage =
                message;

            localRequest.lastSender =
                "admin";

        }


        // ========================================================
        // 4. CLEAR INPUT
        // ========================================================

        adminReply.value =
            "";


        // ========================================================
        // 5. CLOSE MODAL
        // ========================================================

        closeReplyForm();


        // ========================================================
        // 6. REFRESH LIST
        // ========================================================

        updateStatistics();

        displayRequests();


        console.log(
            "✅ Admin reply sent successfully."
        );

    }

    catch (error) {

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
            (
                error?.code ||
                "unknown"
            ) +

            "\nMessage: " +

            (
                error?.message ||
                "Unknown error"
            )

        );

    }

    finally {

        if (sendReplyBtn) {

            sendReplyBtn.disabled =
                false;


            sendReplyBtn.innerHTML = `

                <i class="fa-solid fa-paper-plane"></i>

                Send Reply

            `;

        }

    }

}


// ============================================================
// SEND REPLY BUTTON
// ============================================================

if (sendReplyBtn) {

    sendReplyBtn.addEventListener(
        "click",
        sendAdminSupportReply
    );

}


// ============================================================
// ENTER TO SEND
// ============================================================

if (adminReply) {

    adminReply.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendAdminSupportReply();

            }

        }
    );

}


// ============================================================
// UPDATE REQUEST STATUS
// ============================================================

async function updateRequestStatus(
    requestId,
    status
) {

    if (!requestId) {

        return;
    }


    try {

        await updateDoc(

            doc(
                db,
                "supportMessages",
                requestId
            ),

            {

                status:
                    status,

                updatedAt:
                    serverTimestamp()

            }

        );


        console.log(
            "✅ Support status updated:",
            status
        );


        await loadSupportRequests();

    }

    catch (error) {

        console.error(
            "❌ Status update failed:",
            error
        );


        alert(
            "Unable to update support request."
        );

    }

}


// ============================================================
// REFRESH
// ============================================================

if (refreshBtn) {

    refreshBtn.addEventListener(
        "click",
        async () => {

            await loadSupportRequests();

        }
    );

}


// ============================================================
// FILTER
// ============================================================

if (supportFilter) {

    supportFilter.addEventListener(
        "change",
        displayRequests
    );

}


// ============================================================
// LOGOUT
// ============================================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                await signOut(
                    auth
                );


                window.location.href =
                    "login.html";

            }

            catch (error) {

                console.error(
                    "❌ Logout error:",
                    error
                );

                alert(
                    error.message ||
                    "Unable to logout."
                );

            }

        }
    );

}


// ============================================================
// HELPERS
// ============================================================

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


function escapeAttribute(
    value
) {

    return escapeHTML(
        value
    );

}


function getTimestampMillis(
    timestamp
) {

    if (!timestamp) {

        return 0;
    }


    try {

        if (
            typeof timestamp.toMillis ===
            "function"
        ) {

            return timestamp.toMillis();

        }


        if (
            typeof timestamp.toDate ===
            "function"
        ) {

            return timestamp
                .toDate()
                .getTime();

        }


        const date =
            new Date(
                timestamp
            );


        return isNaN(
            date.getTime()
        )
            ? 0
            : date.getTime();

    }

    catch {

        return 0;

    }

}


function formatTimestamp(
    timestamp
) {

    if (!timestamp) {

        return "Just now";
    }


    try {

        const date =
            typeof timestamp.toDate ===
            "function"

                ? timestamp.toDate()

                : new Date(
                    timestamp
                );


        if (
            isNaN(
                date.getTime()
            )
        ) {

            return "Unknown";

        }


        return date.toLocaleString(
            "en-IN",
            {

                day:
                    "2-digit",

                month:
                    "short",

                year:
                    "numeric",

                hour:
                    "2-digit",

                minute:
                    "2-digit"

            }
        );

    }

    catch {

        return "Unknown";

    }

}


// ============================================================
// FINAL STATUS
// ============================================================

console.log(
    "✅ SmartPark Admin Support initialized successfully."
);