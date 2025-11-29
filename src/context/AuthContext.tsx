import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface NostrLoginAccount {
  pubkey: string;
  authMethod: string;
  picture?: string;
  name?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  userPubkey: string | null;
  userName: string | null;
  userPicture: string | null;
  checkAuth: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userPubkey, setUserPubkey] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userPicture, setUserPicture] = useState<string | null>(null);

  const checkAuth = async () => {
    try {
      console.log("Checking auth...");

      // Try to get data from localStorage first
      const accountsData = localStorage.getItem("__nostrlogin_accounts");
      console.log("localStorage data:", accountsData);

      if (accountsData) {
        const accounts: NostrLoginAccount[] = JSON.parse(accountsData);
        console.log("Account found:", accounts);

        // nostr-login stores an array, get the first account
        const account = accounts[0];

        setUserPubkey(account.pubkey || null);
        setUserName(account.name || null);
        setUserPicture(account.picture || null);
        setIsAuthenticated(true);

        console.log("State updated:", {
          pubkey: account.pubkey,
          name: account.name,
          picture: account.picture,
        });
        return;
      }

      // Fallback: check window.nostr
      if (window.nostr) {
        console.log("No localStorage, using window.nostr");
        const pubkey = await window.nostr.getPublicKey();
        setUserPubkey(pubkey);
        setIsAuthenticated(true);
        setUserName(null);
        setUserPicture(null);
      } else {
        console.log("No auth found");
        setUserPubkey(null);
        setUserName(null);
        setUserPicture(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUserPubkey(null);
      setUserName(null);
      setUserPicture(null);
      setIsAuthenticated(false);
    }
  };

  const handleLogout = () => {
    document.dispatchEvent(new Event("nlLogout"));
    setUserPubkey(null);
    setUserName(null);
    setUserPicture(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    // Check auth on mount
    checkAuth();

    // Listen for nostr-login auth events
    const handleAuth = (e: any) => {
      console.log("nlAuth event received:", e.detail);

      if (e.detail.type === "login" || e.detail.type === "signup") {
        // Adding a small delay to ensure localStorage is updated
        setTimeout(() => {
          checkAuth();
        }, 700);
      } else if (e.detail.type === "logout") {
        setUserPubkey(null);
        setUserName(null);
        setUserPicture(null);
        setIsAuthenticated(false);
      }
    };

    document.addEventListener("nlAuth", handleAuth);

    return () => {
      document.removeEventListener("nlAuth", handleAuth);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userPubkey,
        userName,
        userPicture,
        checkAuth,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
