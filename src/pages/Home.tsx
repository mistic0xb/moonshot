import { useNavigate } from "react-router";
import { BsRocket, BsShieldCheck, BsCheckCircle, BsFillRocketTakeoffFill } from "react-icons/bs";
import { FiZap } from "react-icons/fi";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-blackish relative overflow-hidden">
      {/* Hero section */}
      <section className="relative min-h-screen flex flex-col justify-center items-center pt-32 pb-20 overflow-hidden">
        {/* Background Gradient Orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-bitcoin/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-nostr/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 text-center z-10">
          <div>
            <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-mono text-gray-300">powered by Nostr &amp; Angor</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight flex items-center justify-center gap-2">
              LFG!
              <BsFillRocketTakeoffFill />
            </h1>

            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              A marketplace for <span className="text-white font-medium">ideas</span> and{" "}
              <span className="text-white font-medium">builders</span>.
              <br />
              <span className="block mt-2">
                Have something that should exist but doesn’t?
                <span className="text-bitcoin font-medium"> Ship it as a Moonshot.</span>
              </span>
              <span className="block mt-2">
                Want to build cool sh#t people actually want?
                <span className="text-bitcoin font-medium"> Explore, build, earn Sats.</span>
              </span>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <button
                onClick={() => navigate("/create")}
                className="group w-full sm:w-auto bg-bitcoin hover:bg-orange-400 text-black font-semibold py-3 px-8 text-sm md:text-base rounded-full tracking-wide transition-all duration-300 hover:shadow-[0_0_35px_rgba(247,147,26,0.5)] flex items-center justify-center gap-2 cursor-pointer"
              >
                Create Moonshot
                <BsRocket className="group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => navigate("/explore")}
                className="w-full sm:w-auto bg-transparent hover:bg-white/5 text-gray-200 font-semibold py-3 px-8 text-sm md:text-base rounded-full border border-white/20 hover:border-white/40 transition-all duration-300 cursor-pointer"
              >
                Explore Ideas
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500 font-mono">
              <div className="flex items-center gap-2">
                <FiZap className="w-4 h-4 text-bitcoin" />
                <span>Lightning Fast</span>
              </div>

              <div className="flex items-center gap-2">
                <BsShieldCheck className="w-4 h-4 text-purple-500" />
                <span>Censorship Resistant</span>
              </div>

              <div className="flex items-center gap-2">
                <BsCheckCircle className="w-4 h-4 text-green-500" />
                <span>Peer-to-Peer</span>
              </div>
            </div>
          </div>
        </div>

        {/* Abstract Grid Floor */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-dark to-transparent z-20 pointer-events-none" />

        <div
          className="absolute inset-0 grid-bg opacity-20 z-0 pointer-events-none"
          style={{
            transform: "perspective(1000px) rotateX(60deg) translateY(200px) scale(2)",
          }}
        />
      </section>
    </div>
  );
}

export default Home;
