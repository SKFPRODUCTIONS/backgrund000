// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBs_wDHoBmvzpdGwYVXySdDj3-7-iogrFo",
    authDomain: "skfweb753.firebaseapp.com",
    projectId: "skfweb753",
    storageBucket: "skfweb753.firebasestorage.app",
    messagingSenderId: "337203709335",
    appId: "1:337203709335:web:0924d9b0531cd9454c30d2",
    measurementId: "G-93S1JS91R4",
    databaseURL: "https://skfweb753-default-rtdb.firebaseio.com" // Added database URL
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Storage with custom settings
const storage = firebase.storage();
const storageRef = storage.ref();

// Initialize Realtime Database
const database = firebase.database();
const gamesRef = database.ref('games');

// Storage path for game icons
const STORAGE_PATH = 'game-icons/';

// Helper function to get public URL for storage items
const getPublicUrl = (path) => {
    return `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${encodeURIComponent(path)}?alt=media`;
};

// Export configuration and helpers
export {
    firebaseConfig,
    storage,
    storageRef,
    database,
    gamesRef,
    STORAGE_PATH,
    getPublicUrl
};