// ============================================
// FILE: src/utils/nostrAuth.ts
// ============================================

// Helper to check if user is logged in
export const isLoggedIn = (): boolean => {
  return !!window.nostr;
};

// Get current user's pubkey
export const getCurrentPubkey = async (): Promise<string | null> => {
  try {
    if (!window.nostr) return null;
    const pubkey = await window.nostr.getPublicKey();
    return pubkey;
  } catch (error) {
    console.error('Failed to get pubkey:', error);
    return null;
  }
};

// Launch nostr-login dialog
export const launchNostrLogin = (screen: string = 'welcome') => {
  document.dispatchEvent(new CustomEvent('nlLaunch', { detail: screen }));
};

// Logout from nostr-login
export const logout = () => {
  document.dispatchEvent(new Event('nlLogout'));
};

// Check if action requires auth, and prompt login if needed
export const requireAuth = async (action: () => void | Promise<void>) => {
  try {
    if (!window.nostr) {
      // Not logged in, launch login dialog
      launchNostrLogin('login');
      return;
    }
    
    // User is logged in, proceed with action
    await action();
  } catch (error) {
    console.error('Auth check failed:', error);
    launchNostrLogin('login');
  }
};

// ============================================
// FILE: src/components/UpvoteButton.tsx (Updated with Auth Check)
// ============================================


// ============================================
// FILE: src/pages/Query.tsx (Updated with Auth Check)
// ============================================


// ============================================
// FILE: src/pages/CreateIdea.tsx (Updated with Auth Check)
// ============================================


// ============================================
// USAGE SUMMARY
// ============================================

/*
## How It Works:

1. **Navbar Login Button**: 
   - Shows "Login" button if not authenticated
   - Shows user info + "Logout" button if authenticated
   - Clicking "Login" launches nostr-login modal

2. **Auth Context**:
   - Wraps entire app in AuthProvider
   - Tracks authentication state globally
   - Listens to nlAuth events from nostr-login
   - Provides isAuthenticated, userPubkey, checkAuth, logout

3. **Protected Actions**:
   - **Upvote**: Checks auth, launches login if needed
   - **Show Interest**: Checks auth, launches login if needed
   - **Create Moonshot**: Checks auth before publishing

4. **Event Flow**:
   - User clicks "Login" → nlLaunch event dispatched → nostr-login modal opens
   - User logs in → nlAuth event dispatched → AuthContext updates state
   - User clicks "I'm Interested" → checks isAuthenticated → shows dialog or launches login
   - User clicks "Logout" → nlLogout event dispatched → nostr-login clears session

## Key Functions:

- `document.dispatchEvent(new CustomEvent('nlLaunch', { detail: 'login' }))` - Open login
- `document.dispatchEvent(new CustomEvent('nlLaunch', { detail: 'welcome' }))` - Open welcome screen
- `document.dispatchEvent(new Event('nlLogout'))` - Logout
- Listen to 'nlAuth' events to update UI on auth changes

## No separate modal needed!
The nostr-login library handles all UI. You just dispatch events.
*/