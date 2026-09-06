SmartPark is a web-based Smart Parking Management System developed to automate and simplify parking operations for both users and administrators. The system uses HTML, CSS, JavaScript, Firebase Authentication, and Cloud Firestore to provide real-time parking information, vehicle management, booking management, entry/exit monitoring, and an AI-powered assistant.

Project Description

The system provides a centralized platform where users can register and manage their profiles and vehicles, view available parking slots, reserve slots, check their active bookings, view booking history, and monitor their current parking status. The parking system maintains slot states such as available, occupied, reserved, and maintenance using Firebase data.

The project also includes an Admin Dashboard that allows administrators to manage registered users, parking slots, bookings, visitors, security verification, and entry logs. Administrators can add, edit, and delete parking slots and monitor parking activity from a single dashboard.

A major feature of the project is SmartPark AI, an integrated assistant that retrieves real-time information from the Firebase database and answers user queries. The assistant can provide information about available parking slots, active bookings, booking history, registered vehicles, vehicles currently inside the parking area, parking summaries, the administrator's contact number, and the user's current parking status. The current floating assistant uses the authenticated user's identity to retrieve user-specific booking and vehicle information.

Main Features

User Management

User registration and login
Firebase Authentication
Profile management
Role-based access for users and administrators

Parking Management

Real-time parking slot status
Available, occupied, reserved, and maintenance states
Parking map with visual slot representation
AI-powered parking slot recommendation

Booking Management

Parking slot booking
Active booking tracking
Booking cancellation/completion
Booking history
Automatic slot release after vehicle exit

Vehicle Management

Vehicle registration
Registered vehicle viewing
Vehicle entry verification
Vehicle exit verification

Entry and Exit Monitoring

Entry logs
Vehicle exit processing
Parking occupancy monitoring
Current vehicles-inside tracking

Admin Dashboard

Registered users management
Parking slot management
Booking monitoring
Visitor management
Security verification
Entry-log monitoring
Parking statistics

SmartPark AI Assistant

Available-slot queries
Active-booking queries
Booking-history queries
Registered-vehicle queries
Current parking-status queries
Admin contact lookup
Parking information and assistance
Technology Stack
Frontend:
HTML
CSS
JavaScript
Font Awesome

Backend:
Firebase Authentication
Cloud Firestore

Database Collections:
users
slots
bookings
vehicles
entryLogs

The floating user assistant is connected to Firebase and retrieves the authenticated user's bookings and vehicles using their Firebase user ID.

Project Objective

The main objective of SmartPark AI is to create a centralized and intelligent parking solution that reduces manual parking management, makes slot availability easier to monitor, simplifies booking and vehicle verification, and provides users with quick access to parking information through an AI assistant.
