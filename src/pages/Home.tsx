import { useNavigate } from 'react-router';
import { BsLightning, BsRocket, BsPerson } from 'react-icons/bs';
import { FiZap } from 'react-icons/fi';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-blackish relative overflow-hidden">
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-20">
        <div className="max-w-7xl w-full mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-28">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 border border-sky-400/20 bg-sky-400/5 backdrop-blur-sm text-sky-300 text-sm uppercase tracking-wider">
              <BsLightning className="text-sky-300" />
              <span>Powered by Nostr</span>
            </div>

            <h1 className="text-7xl font-bold mb-6 leading-tight">
              <span className="text-sky-200">Moon</span>
              <span className="text-white">shot</span>
            </h1>

            <p className="text-2xl text-gray-400 mb-14 leading-relaxed max-w-4xl mx-auto">
              Turn ambitious ideas into reality.
              <span className="text-sky-200/90"> Connect visionaries with builders</span>
              —powered by Bitcoin and Nostr.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
              <button
                onClick={() => navigate('/create')}
                className="group w-full sm:w-auto bg-sky-200 hover:bg-sky-400 text-black font-bold py-6 px-10 text-xl uppercase tracking-wide transition-all duration-300 hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] transform hover:scale-[1.02] flex items-center justify-center gap-3 cursor-pointer"
              >
                Initiate Moonshot
                <BsRocket className="group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/explore')}
                className="w-full sm:w-auto bg-transparent hover:bg-sky-500/10 text-sky-200 font-bold py-6 px-10 text-xl uppercase tracking-wide border-2 border-sky-400/50 hover:border-sky-400 transition-all duration-300 cursor-pointer"
              >
                Explore Moonshots
              </button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            <div className="card-style group hover:border-sky-500/30 transition-all duration-500 p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-br from-sky-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-20 h-20 mb-6 text-5xl text-sky-200 transform group-hover:scale-110 transition-all duration-500">
                  <FiZap />
                </div>
                <h3 className="text-white font-bold mb-4 uppercase text-lg tracking-wider">
                  Decentralized
                </h3>
                <p className="text-gray-500 text-base leading-relaxed">
                  Built on Nostr protocol for true censorship resistance
                </p>
              </div>
            </div>

            <div className="card-style group hover:border-sky-500/30 transition-all duration-500 p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-br from-sky-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-20 h-20 mb-6 text-5xl text-sky-200 transform group-hover:scale-110 transition-all duration-500">
                  <BsLightning />
                </div>
                <h3 className="text-white font-bold mb-4 uppercase text-lg tracking-wider">
                  Bitcoin Powered
                </h3>
                <p className="text-gray-500 text-base leading-relaxed">
                  Seamless Lightning payments for project funding
                </p>
              </div>
            </div>

            <div className="card-style group hover:border-sky-500/30 transition-all duration-500 p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-br from-sky-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-20 h-20 mb-6 text-5xl text-sky-200 transform group-hover:scale-110 transition-all duration-500">
                  <BsPerson />
                </div>
                <h3 className="text-white font-bold mb-4 uppercase text-lg tracking-wider">
                  Direct Connection
                </h3>
                <p className="text-gray-500 text-base leading-relaxed">
                  Connect creators and builders without intermediaries
                </p>
              </div>
            </div>
          </div>

          {/* Use Cases */}
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-8">Perfect For</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {['Open Source', 'Apps & Tools', 'Research', 'Bitcoin Projects', 'Nostr Clients', 'Creative Works'].map(useCase => (
                <div
                  key={useCase}
                  className="px-8 py-4 bg-card-bg border border-border-sky hover:border-sky-400/30 text-gray-200 hover:text-sky-400 text-lg transition-all duration-300 cursor-default"
                >
                  {useCase}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
