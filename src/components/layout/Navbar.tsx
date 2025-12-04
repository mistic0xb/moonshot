import { Link } from "react-router";
import { BsRocket, BsPerson } from "react-icons/bs";
import { useAuth } from "../../context/AuthContext";

function Navbar() {
  const authData = useAuth();
  const { isAuthenticated, userName, userPicture, logout } = authData;

  const handleLogin = () => {
    document.dispatchEvent(new CustomEvent('nlLaunch', { detail: 'welcome' }));
  };

  return (
    <nav className="bg-blackish border-b border-sky-500/20 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <BsRocket className="text-sky-300 text-2xl" />
            <span className="text-white font-bold text-xl">Moonshot</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link
              to="/explore"
              className="text-gray-300 hover:text-sky-200 transition-colors font-medium"
            >
              Explore
            </Link>
            <Link
              to="/dashboard"
              className="text-gray-300 hover:text-sky-200 transition-colors font-medium"
            >
              Dashboard
            </Link>
            
            {!isAuthenticated ? (
              <button
                onClick={handleLogin}
                className="bg-sky-200 hover:bg-sky-400 text-black px-4 py-2 text-sm font-semibold transition-colors rounded"
              >
                Login
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-sky-200/20 border border-sky-500/30 px-3 py-1.5 rounded hover:border-sky-400/50 transition-colors">
                  {userPicture ? (
                    <img 
                      src={userPicture} 
                      alt={userName || 'User'} 
                      className="w-8 h-8 rounded-full object-cover"
                      onError={(e) => {
                        console.log('Image failed to load:', userPicture);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <BsPerson className="text-sky-300 text-lg" />
                  )}
                  <span className="text-sky-200 text-sm font-medium hidden sm:block">
                    {userName || 'Anonymous'}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="text-gray-400 hover:text-red-400 text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;