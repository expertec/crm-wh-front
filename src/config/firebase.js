import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDUJdkxfY6v_dbecuUMWH_t9OgbsPztWD4",
  authDomain: "cantalab-crm.firebaseapp.com",
  projectId: "cantalab-crm",
  storageBucket: "cantalab-crm.firebasestorage.app",
  messagingSenderId: "724396841694",
  appId: "1:724396841694:web:7946521c1b97d3a5b0804f",
  measurementId: "G-N1330GJLTQ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage, firebaseConfig };
