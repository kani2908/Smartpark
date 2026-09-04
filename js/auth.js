// ============================================================
// SMARTPARK AI - AUTH.JS
// Authentication + Registration + Vehicle Management
// ============================================================

import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    deleteUser
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    doc,
    setDoc,
    getDoc,
    collection,
    addDoc,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

// ============================================================
// AUTH TOAST NOTIFICATION
// ============================================================

let authToastTimer = null;

function showAuthToast(
    message,
    type = "error",
    title = "Login Failed"
) {

    const toast =
        document.getElementById("authToast");

    const toastIcon =
        document.getElementById("authToastIcon");

    const toastTitle =
        document.getElementById("authToastTitle");

    const toastMessage =
        document.getElementById("authToastMessage");


    if (!toast) {
        console.warn(
            "Auth toast element not found."
        );

        return;
    }


    // Clear previous timer

    if (authToastTimer) {

        clearTimeout(authToastTimer);

    }


    // Remove previous types

    toast.classList.remove(
        "error",
        "warning",
        "success",
        "info"
    );


    // Add current type

    toast.classList.add(type);


    // Message

    if (toastMessage) {

        toastMessage.textContent =
            message;

    }


    // Title

    if (toastTitle) {

        toastTitle.textContent =
            title;

    }


    // Icon

    if (toastIcon) {

        if (type === "success") {

            toastIcon.textContent = "✓";

        } else if (type === "warning") {

            toastIcon.textContent = "⚠";

        } else if (type === "info") {

            toastIcon.textContent = "ℹ";

        } else {

            toastIcon.textContent = "✕";

        }

    }


    // Show

    toast.classList.add("show");


    // Automatically hide

    authToastTimer =
        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 4500);
}


// ============================================================
// CLOSE TOAST
// ============================================================

const authToastClose =
    document.getElementById(
        "authToastClose"
    );

if (authToastClose) {

    authToastClose.addEventListener(
        "click",
        () => {

            const toast =
                document.getElementById(
                    "authToast"
                );

            if (toast) {

                toast.classList.remove(
                    "show"
                );

            }

            if (authToastTimer) {

                clearTimeout(
                    authToastTimer
                );

            }

        }
    );

}
// ============================================================
// UTILITY
// ============================================================

function getElement(id) {
    return document.getElementById(id);
}


function showLoginError(message, type = "error") {

    const loginError = getElement("loginError");

    // loginError may not exist
    if (!loginError) {
        console.error("Login message:", message);
        return;
    }

    loginError.style.display = "block";
    loginError.textContent = message;

    loginError.style.color =
        type === "success"
            ? "#22c55e"
            : "#ef4444";
}


// ============================================================
// VEHICLE FORM
// ============================================================

const vehiclesContainer =
    getElement("vehiclesContainer");

const addVehicleBtn =
    getElement("addVehicleBtn");


// ============================================================
// ADD VEHICLE
// ============================================================

if (vehiclesContainer && addVehicleBtn) {

    addVehicleBtn.addEventListener("click", () => {

        const vehicleCards =
            document.querySelectorAll(
                ".vehicle-form-card"
            );

        const vehicleNumber =
            vehicleCards.length + 1;

        const vehicleCard =
            document.createElement("div");

        vehicleCard.className =
            "vehicle-form-card";

        vehicleCard.innerHTML = `

            <div class="vehicle-form-header">

                <h4>
                    🚗 Vehicle ${vehicleNumber}
                </h4>

                <button
                    type="button"
                    class="remove-vehicle-btn">

                    <i class="fa-solid fa-trash"></i>
                    Remove

                </button>

            </div>

            <div class="form-grid">

                <!-- Vehicle Number -->

                <div class="form-group">

                    <label>
                        Vehicle Number
                    </label>

                    <div class="input-box">

                        <i class="fa-solid fa-car"></i>

                        <input
                            type="text"
                            class="vehicle-number"
                            placeholder="TN22EJ3343"
                            required>

                    </div>

                </div>


                <!-- Vehicle Photo -->

                <div class="form-group">

                    <label>
                        Vehicle Photo
                    </label>

                    <div class="input-box">

                        <i class="fa-solid fa-camera"></i>

                        <input
                            type="file"
                            class="vehicle-image"
                            accept="image/*">

                    </div>

                </div>


                <!-- Vehicle Type -->

                <div class="form-group">

                    <label>
                        Vehicle Type
                    </label>

                    <div class="input-box">

                        <i class="fa-solid fa-car-side"></i>

                        <select class="vehicle-type">

                            <option value="car">
                                🚗 Car
                            </option>

                            <option value="bike">
                                🏍️ Bike
                            </option>

                            <option value="scooter">
                                🛵 Scooter
                            </option>

                            <option value="other">
                                🚙 Other
                            </option>

                        </select>

                    </div>

                </div>


                <!-- Brand -->

                <div class="form-group">

                    <label>
                        Vehicle Brand
                    </label>

                    <div class="input-box">

                        <i class="fa-solid fa-industry"></i>

                        <input
                            type="text"
                            class="vehicle-brand"
                            placeholder="Honda, Hyundai, Tata..."
                            required>

                    </div>

                </div>


                <!-- Model -->

                <div class="form-group">

                    <label>
                        Vehicle Model
                    </label>

                    <div class="input-box">

                        <i class="fa-solid fa-car-side"></i>

                        <input
                            type="text"
                            class="vehicle-model"
                            placeholder="Activa, i20, Swift..."
                            required>

                    </div>

                </div>


                <!-- Color -->

                <div class="form-group">

                    <label>
                        Vehicle Color
                    </label>

                    <div class="input-box">

                        <i class="fa-solid fa-palette"></i>

                        <input
                            type="text"
                            class="vehicle-color"
                            placeholder="White, Black, Red..."
                            required>

                    </div>

                </div>

            </div>
        `;

        vehiclesContainer.appendChild(vehicleCard);


        // Remove vehicle

        const removeBtn =
            vehicleCard.querySelector(
                ".remove-vehicle-btn"
            );

        removeBtn.addEventListener("click", () => {

            vehicleCard.remove();

            updateVehicleNumbers();

        });

    });

}


// ============================================================
// UPDATE VEHICLE NUMBERS
// ============================================================

function updateVehicleNumbers() {

    const vehicleCards =
        document.querySelectorAll(
            ".vehicle-form-card"
        );

    vehicleCards.forEach((card, index) => {

        const title =
            card.querySelector(
                ".vehicle-form-header h4"
            );

        if (title) {

            title.textContent =
                `🚗 Vehicle ${index + 1}`;

        }

    });

}


// ============================================================
// REGISTRATION
// ============================================================

const registerForm =
    getElement("registerForm");

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();


            // ------------------------------------------------
            // PERSONAL INFORMATION
            // ------------------------------------------------

            const fullName =
                getElement("fullName")?.value.trim();

            const email =
                getElement("email")?.value.trim();

            const phone =
                getElement("phone")?.value.trim();

            const doorNumber =
                getElement("doorNumber")?.value.trim();

            const password =
                getElement("password")?.value;

            const confirmPassword =
                getElement("confirmPassword")?.value;


            // ------------------------------------------------
            // PASSWORD VALIDATION
            // ------------------------------------------------

            if (password !== confirmPassword) {

                alert(
                    "Passwords do not match!"
                );

                return;
            }


            // ------------------------------------------------
            // GET VEHICLES
            // ------------------------------------------------

            const vehicleCards =
                document.querySelectorAll(
                    ".vehicle-form-card"
                );


            if (vehicleCards.length === 0) {

                alert(
                    "Please add at least one vehicle."
                );

                return;
            }


            let user = null;


            try {

                // ------------------------------------------------
                // CREATE FIREBASE ACCOUNT
                // ------------------------------------------------

                const userCredential =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );

                user =
                    userCredential.user;


                console.log(
                    "Firebase account created:",
                    user.uid
                );


                // ------------------------------------------------
                // SAVE USER PROFILE
                // ------------------------------------------------

                await setDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    ),
                    {

                        fullName,
                        email,
                        phone,
                        doorNumber,

                        role: "user",

                        verificationStatus:
                            "pending"

                    }
                );


                // ------------------------------------------------
                // SAVE VEHICLES
                // ------------------------------------------------

                for (
                    let i = 0;
                    i < vehicleCards.length;
                    i++
                ) {

                    const card =
                        vehicleCards[i];


                    const vehicleNumber =
                        card
                            .querySelector(
                                ".vehicle-number"
                            )
                            .value
                            .trim()
                            .toUpperCase();


                    const vehicleImageFile =
                        card
                            .querySelector(
                                ".vehicle-image"
                            )
                            .files[0];


                    const vehicleType =
                        card
                            .querySelector(
                                ".vehicle-type"
                            )
                            .value;


                    const vehicleBrand =
                        card
                            .querySelector(
                                ".vehicle-brand"
                            )
                            .value
                            .trim();


                    const vehicleModel =
                        card
                            .querySelector(
                                ".vehicle-model"
                            )
                            .value
                            .trim();


                    const vehicleColor =
                        card
                            .querySelector(
                                ".vehicle-color"
                            )
                            .value
                            .trim();


                    // ------------------------------------------------
                    // VALIDATION
                    // ------------------------------------------------

                    if (!vehicleNumber) {

                        alert(
                            `Please enter vehicle number for Vehicle ${i + 1}.`
                        );

                        throw new Error(
                            "Vehicle number missing."
                        );

                    }


                    if (!vehicleBrand) {

                        alert(
                            `Please enter vehicle brand for Vehicle ${i + 1}.`
                        );

                        throw new Error(
                            "Vehicle brand missing."
                        );

                    }


                    if (!vehicleModel) {

                        alert(
                            `Please enter vehicle model for Vehicle ${i + 1}.`
                        );

                        throw new Error(
                            "Vehicle model missing."
                        );

                    }


                    if (!vehicleColor) {

                        alert(
                            `Please enter vehicle color for Vehicle ${i + 1}.`
                        );

                        throw new Error(
                            "Vehicle color missing."
                        );

                    }


                    // ------------------------------------------------
                    // CHECK DUPLICATE VEHICLE
                    // ------------------------------------------------

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


                    if (!vehicleSnapshot.empty) {

                        alert(
                            `Vehicle ${vehicleNumber} is already registered.`
                        );

                        throw new Error(
                            "Duplicate vehicle."
                        );

                    }


                    // ------------------------------------------------
                    // CLOUDINARY IMAGE UPLOAD
                    // ------------------------------------------------

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
                                    method: "POST",
                                    body: formData
                                }
                            );


                        if (!response.ok) {

                            throw new Error(
                                `Vehicle ${i + 1} photo upload failed.`
                            );

                        }


                        const imageData =
                            await response.json();


                        vehicleImageUrl =
                            imageData.secure_url;

                    }


                    // ------------------------------------------------
                    // SAVE VEHICLE
                    // ------------------------------------------------

                    await addDoc(
                        collection(
                            db,
                            "vehicles"
                        ),
                        {

                            userId:
                                user.uid,

                            ownerName:
                                fullName,

                            ownerEmail:
                                email,

                            vehicleNumber,

                            vehicleType,

                            vehicleBrand,

                            vehicleModel,

                            vehicleColor,

                            vehicleImage:
                                vehicleImageUrl,

                            status:
                                "active"

                        }
                    );

                }


                // ------------------------------------------------
                // SUCCESS
                // ------------------------------------------------

                alert(
                    "Registration Successful!"
                );


                window.location.href =
                    "login.html";


            } catch (error) {

                console.error(
                    "Registration Error:",
                    error
                );


                // ------------------------------------------------
                // DELETE INCOMPLETE ACCOUNT
                // ------------------------------------------------

                if (user) {

                    try {

                        await deleteUser(user);

                    } catch (deleteError) {

                        console.error(
                            "Could not remove incomplete account:",
                            deleteError
                        );

                    }

                }


                // ------------------------------------------------
                // VALIDATION ERRORS
                // ------------------------------------------------

                const knownErrors = [

                    "Duplicate vehicle.",
                    "Vehicle number missing.",
                    "Vehicle brand missing.",
                    "Vehicle model missing.",
                    "Vehicle color missing."

                ];


                if (
                    knownErrors.includes(
                        error.message
                    )
                ) {

                    return;

                }


                // ------------------------------------------------
                // FIREBASE ERRORS
                // ------------------------------------------------

                switch (error.code) {

                    case "auth/email-already-in-use":

                        alert(
                            "This email is already registered."
                        );

                        break;


                    case "auth/invalid-email":

                        alert(
                            "Please enter a valid email address."
                        );

                        break;


                    case "auth/weak-password":

                        alert(
                            "Password should be at least 6 characters."
                        );

                        break;


                    default:

                        alert(
                            error.message ||
                            "Registration failed. Please try again."
                        );

                }

            }

        }
    );

}


// ============================================================
// LOGIN
// ============================================================

const loginForm =
    getElement("loginForm");

const loginError =
    getElement("loginError");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();


            // ------------------------------------------------
            // GET INPUTS
            // ------------------------------------------------

            const email =
                getElement("email");

            const password =
                getElement("password");


            // Safety check

            if (!email || !password) {

                console.error(
                    "Login form requires #email and #password."
                );

                return;
            }


            // ------------------------------------------------
            // CLEAR PREVIOUS ERROR
            // ------------------------------------------------

            if (loginError) {

                loginError.style.display =
                    "none";

                loginError.textContent =
                    "";

            }


            email.classList.remove(
                "input-error"
            );

            password.classList.remove(
                "input-error"
            );


            // ------------------------------------------------
            // EMAIL VALIDATION
            // ------------------------------------------------

            if (
                email.value.trim() === ""
            ) {

                showLoginError(
                    "Please enter your email."
                );

                email.classList.add(
                    "input-error"
                );

                email.focus();

                return;

            }


            // ------------------------------------------------
            // PASSWORD VALIDATION
            // ------------------------------------------------

            if (
                password.value.trim() === ""
            ) {

                showLoginError(
                    "Please enter your password."
                );

                password.classList.add(
                    "input-error"
                );

                password.focus();

                return;

            }


            // ------------------------------------------------
            // LOGIN
            // ------------------------------------------------

            try {

                console.log(
                    "SmartPark AI: attempting login..."
                );


                const userCredential =
                    await signInWithEmailAndPassword(
                        auth,
                        email.value.trim(),
                        password.value
                    );


                console.log(
                    "Firebase login successful:",
                    userCredential.user.uid
                );


                // ------------------------------------------------
                // GET USER PROFILE
                // ------------------------------------------------

                const docRef =
                    doc(
                        db,
                        "users",
                        userCredential.user.uid
                    );


                const docSnap =
                    await getDoc(docRef);


                if (!docSnap.exists()) {

                    showLoginError(
                        "User profile not found."
                    );

                    console.error(
                        "No Firestore user profile found."
                    );

                    return;

                }


                const userData =
                    docSnap.data();


                console.log(
                    "Logged in user:",
                    userData
                );


                // ------------------------------------------------
                // ADMIN
                // ------------------------------------------------

                if (
                    userData.role === "admin"
                ) {

                    console.log(
                        "Redirecting to admin dashboard..."
                    );


                    window.location.href =
                        "admin.html";

                    return;

                }


                // ------------------------------------------------
                // NORMAL USER
                // ------------------------------------------------

                console.log(
                    "Redirecting to user dashboard..."
                );


                window.location.href =
                    "dashboard.html";


            }


            // ------------------------------------------------
            // LOGIN ERROR
            // ------------------------------------------------

            catch (error) {

                console.error(
                    "Login error:",
                    error
                );


                email.classList.add(
                    "input-error"
                );

                password.classList.add(
                    "input-error"
                );


                let message =
                    "Login failed. Please try again.";


                switch (error.code) {

                    case "auth/invalid-email":

                        message =
                            "Please enter a valid email address.";

                        break;


                    case "auth/invalid-credential":

                        message =
                            "Incorrect email or password.";

                        break;


                    case "auth/user-not-found":

                        message =
                            "No account found with this email.";

                        break;


                    case "auth/wrong-password":

                        message =
                            "Incorrect password.";

                        break;


                    case "auth/too-many-requests":

                        message =
                            "Too many failed attempts. Please try again later.";

                        break;


                    case "auth/network-request-failed":

                        message =
                            "Network error. Please check your internet connection.";

                        break;

                }


                showLoginError(message);

            }

        }
    );

}


// ============================================================
// REMOVE LOGIN ERROR WHEN USER TYPES
// ============================================================

const emailInput =
    getElement("email");

if (emailInput) {

    emailInput.addEventListener(
        "input",
        function () {

            this.classList.remove(
                "input-error"
            );


            const password =
                getElement("password");


            if (
                password &&
                !password.classList.contains(
                    "input-error"
                )
            ) {

                if (loginError) {

                    loginError.style.display =
                        "none";

                }

            }

        }
    );

}


const passwordInput =
    getElement("password");

if (passwordInput) {

    passwordInput.addEventListener(
        "input",
        function () {

            this.classList.remove(
                "input-error"
            );


            const email =
                getElement("email");


            if (
                email &&
                !email.classList.contains(
                    "input-error"
                )
            ) {

                if (loginError) {

                    loginError.style.display =
                        "none";

                }

            }

        }
    );

}


// ============================================================
// FORGOT PASSWORD
// ============================================================

const forgotPassword =
    getElement("forgotPassword");


if (forgotPassword) {

    forgotPassword.addEventListener(
        "click",
        async (e) => {

            e.preventDefault();

            e.stopPropagation();


            const emailInput =
                getElement("email");


            // ------------------------------------------------
            // EMAIL INPUT CHECK
            // ------------------------------------------------

            if (!emailInput) {

                console.error(
                    "Email input not found."
                );

                return;

            }


            const email =
                emailInput.value.trim();


            // ------------------------------------------------
            // EMAIL REQUIRED
            // ------------------------------------------------

            if (email === "") {

                showLoginError(
                    "Please enter your email first."
                );

                emailInput.focus();

                return;

            }


            // ------------------------------------------------
            // BASIC EMAIL VALIDATION
            // ------------------------------------------------

            if (
                !email.includes("@") ||
                !email.includes(".")
            ) {

                showLoginError(
                    "Please enter a valid email address."
                );

                emailInput.focus();

                return;

            }


            // ------------------------------------------------
            // SEND RESET EMAIL
            // ------------------------------------------------

            try {

                console.log(
                    "SmartPark AI: sending password reset email..."
                );


                await sendPasswordResetEmail(
                    auth,
                    email
                );


                console.log(
                    "Password reset email sent."
                );


                showLoginError(
                    "Password reset email sent successfully. Please check your inbox.",
                    "success"
                );


            } catch (error) {

                console.error(
                    "Password reset error:",
                    error
                );


                let message =
                    "Unable to send password reset email.";


                switch (error.code) {

                    case "auth/invalid-email":

                        message =
                            "Please enter a valid email address.";

                        break;


                    case "auth/user-not-found":

                        message =
                            "No account found with this email.";

                        break;


                    case "auth/missing-email":

                        message =
                            "Please enter your email address.";

                        break;


                    case "auth/network-request-failed":

                        message =
                            "Network error. Please check your internet connection.";

                        break;


                    case "auth/too-many-requests":

                        message =
                            "Too many requests. Please try again later.";

                        break;


                    default:

                        message =
                            error.message ||
                            "Unable to send password reset email.";

                }


                showLoginError(
                    message
                );

            }

        }
    );

}


// ============================================================
// PAGE READY
// ============================================================

console.log(
    "SmartPark AI authentication system loaded successfully."
);