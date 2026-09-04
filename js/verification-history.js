import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const tableBody = document.getElementById("historyTableBody");
const verifiedCount = document.getElementById("verifiedCount");
const searchInput = document.getElementById("searchInput");

let verificationData = [];

// ==========================
// Load Verification History
// ==========================

async function loadVerificationHistory() {

    tableBody.innerHTML = "";

    verificationData = [];

    const snapshot = await getDocs(collection(db, "verificationLogs"));

    snapshot.forEach(doc => {

        verificationData.push(doc.data());

    });

    // Latest first
    verificationData.reverse();

    verifiedCount.innerText = verificationData.length;

    displayData(verificationData);

}

// ==========================
// Display Table
// ==========================

function displayData(data) {

    tableBody.innerHTML = "";

    if (data.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;">
                    No Verification Records Found
                </td>
            </tr>
        `;

        return;

    }

    data.forEach(item => {

        const row = document.createElement("tr");

        row.innerHTML = `

            <td>${item.vehicleNumber}</td>

            <td>${item.ownerName}</td>

            <td>${item.doorNumber}</td>

            <td>${item.phone}</td>

            <td>${item.verifiedAt}</td>

            <td class="status">${item.status}</td>

        `;

        tableBody.appendChild(row);

    });

}

// ==========================
// Search Vehicle
// ==========================

searchInput.addEventListener("keyup", () => {

    const keyword = searchInput.value.toLowerCase();

    const filtered = verificationData.filter(item =>

        item.vehicleNumber.toLowerCase().includes(keyword)

    );

    displayData(filtered);

});

// ==========================
// Initial Load
// ==========================

loadVerificationHistory();