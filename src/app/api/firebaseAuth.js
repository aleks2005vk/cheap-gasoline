import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import { firebaseConfig, API_URL } from "../../config";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider("apple.com");

export { auth };

async function syncLocalUser(user) {
  try {
    const idToken = await user.getIdToken();
    await fetch(`${API_URL}/api/auth/create-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        email: user.email,
        name: user.displayName || user.email?.split("@")[0] || "User",
      }),
    });
    return idToken;
  } catch {
    return await user.getIdToken();
  }
}

export async function firebaseRegister(email, password, name) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;
    if (name) {
      await updateProfile(user, { displayName: name });
    }
    const idToken = await syncLocalUser(user);

    return { user, idToken };
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function firebaseLogin(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;
    const idToken = await syncLocalUser(user);

    return { user, idToken };
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function firebaseSignInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const idToken = await syncLocalUser(user);
    return { user, idToken };
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function firebaseSignInWithApple() {
  try {
    const result = await signInWithPopup(auth, appleProvider);
    const user = result.user;
    const idToken = await syncLocalUser(user);
    return { user, idToken };
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function firebaseSendPasswordReset(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function firebaseLogout() {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(error.message);
  }
}

export function onAuthStateChange(callback) {
  return onAuthStateChanged(auth, callback);
}
