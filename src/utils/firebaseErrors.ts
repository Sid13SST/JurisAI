export const getFirebaseErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account exists with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'This email is already registered to another account.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password is too weak. Must be at least 6 characters.';
    case 'auth/invalid-credential':
      return 'Invalid credentials. Please verify your email and password.';
    case 'auth/too-many-requests':
      return 'Too many login attempts. Access is temporarily suspended. Please try again later.';
    case 'auth/user-disabled':
      return 'This user account has been deactivated. Contact administration.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completion. Please try again.';
    case 'auth/cancelled-popup-request':
      return 'Login operation was cancelled. Multiple popup triggers detected.';
    case 'auth/network-request-failed':
      return 'Network communication failed. Check your internet connection.';
    default:
      return 'An unexpected authentication error occurred. Please try again.';
  }
};
