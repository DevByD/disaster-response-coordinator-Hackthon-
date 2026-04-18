// Import Firebase modules

import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";

import { getDatabase }
from "https://www.gstatic.com/firebasejs/12.12.0/firebase-database.js";

// Your Firebase configuration

const firebaseConfig = {

apiKey: "AIzaSyBMMJ3mQHqGGjD_cS-abZ9iDqUb8CRZ_RI",

authDomain:
"disaster-response-coordi-a7a66.firebaseapp.com",

databaseURL:
"https://disaster-response-coordi-a7a66-default-rtdb.asia-southeast1.firebasedatabase.app",

projectId:
"disaster-response-coordi-a7a66",

storageBucket:
"disaster-response-coordi-a7a66.firebasestorage.app",

messagingSenderId:
"65722776583",

appId:
"1:65722776583:web:d553b16a15591bcee57ea2"

};

// Initialize Firebase

const app = initializeApp(firebaseConfig);

// Connect Database

const db = getDatabase(app);

// Export database

export { db };