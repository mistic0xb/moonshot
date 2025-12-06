import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import { BsRocket, BsPerson, BsList, BsX } from "react-icons/bs";
import { useAuth } from "../../context/AuthContext";

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { isAuthenticated, userName, userPicture, logout } = useAuth();

  const handleLogin = () => {
    document.dispatchEvent(new CustomEvent("nlLaunch", { detail: "welcome" }));
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-dark/80 backdrop-blur-md py-3" : "bg-transparent py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo: BsRocket inside theme gradient badge */}
        <Link to="/" className="flex items-center space-x-2 font-bold text-xl tracking-tight">
          <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
            <BsRocket className="text-lg text-white" />
          </div>

          <span className="">Moonshot</span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            to="/explore"
            className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Explore
          </Link>
          <Link
            to="/dashboard"
            className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Dashboard
          </Link>

          {/* Auth compact cluster */}
          {!isAuthenticated ? (
            <button
              onClick={handleLogin}
              className="text-xs font-semibold px-4 py-2 rounded-lg border border-bitcoin/60 text-bitcoin hover:bg-bitcoin hover:text-black transition-colors cursor-pointer"
            >
              Login
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={logout}
                className="flex items-center gap-2 rounded-full bg-card/80 border border-white/10 px-2 py-1 hover:border-red-400/70 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                {userPicture ? (
                  <img
                    src={userPicture}
                    alt={userName || "User"}
                    className="w-7 h-7 rounded-full object-cover"
                    onError={e => {
                      console.log("Image failed to load:", userPicture);
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center">
                    <BsPerson className="text-gray-300 text-sm" />
                  </div>
                )}
                <span className="text-gray-200 text-xs font-medium max-w-[90px] truncate hidden sm:inline">
                  {userName || "Anonymous"}
                </span>
                <span className="text-[11px] uppercase tracking-wide text-gray-400">Logout</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(prev => !prev)}>
          {mobileMenuOpen ? <BsX className="text-xl" /> : <BsList className="text-xl" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-card border-b border-white/10 md:hidden p-4 flex flex-col space-y-4 shadow-2xl">
          <Link
            to="/explore"
            onClick={() => setMobileMenuOpen(false)}
            className="text-gray-300 hover:text-white"
          >
            Explore
          </Link>
          <Link
            to="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="text-gray-300 hover:text-white"
          >
            Dashboard
          </Link>

          {!isAuthenticated ? (
            <button
              onClick={() => {
                handleLogin();
                setMobileMenuOpen(false);
              }}
              className="mt-2 w-full text-sm font-semibold px-4 py-2 rounded-lg border border-bitcoin/60 text-bitcoin hover:bg-bitcoin hover:text-black transition-colors cursor-pointer"
            >
              Login
            </button>
          ) : (
            <div className="flex items-center justify-between gap-3 mt-2">
              <div className="flex items-center gap-2">
                {userPicture ? (
                  <img
                    src={userPicture}
                    alt={userName || "User"}
                    className="w-8 h-8 rounded-full object-cover"
                    onError={e => {
                      console.log("Image failed to load:", userPicture);
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                    <BsPerson className="text-gray-300 text-base" />
                  </div>
                )}
                <span className="text-gray-200 text-sm font-medium">{userName || "Anonymous"}</span>
              </div>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="text-xs font-semibold px-3 py-1 rounded-lg border border-red-400/70 text-red-300 hover:bg-red-500/10 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
