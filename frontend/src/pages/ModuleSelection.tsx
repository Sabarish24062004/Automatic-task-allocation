import { useNavigate } from "react-router-dom";

const modules = [
  { name: "Admin", role: "ADMIN" },
  { name: "Marketing Team", role: "MARKETING" },
  { name: "Writing Team", role: "WRITING" },
  { name: "Submission Team", role: "SUBMISSION" },
];

export default function ModuleSelection() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex flex-col items-center justify-center font-poppins">

      {/* Title */}
      <h1 className="text-5xl font-bold mb-16 tracking-wide text-center">
        Automation Task System
      </h1>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-8">
        {modules.map((mod) => (
          <div
            key={mod.role}
            onClick={() => navigate(`/login/${mod.role}`)}
            className="
              cursor-pointer 
              bg-white/10 backdrop-blur-lg 
              border border-white/20 
              rounded-2xl 
              p-10 
              w-64 text-center
              shadow-lg 
              hover:scale-105 
              hover:bg-white hover:text-black
              transition duration-300 ease-in-out
            "
          >
            <h2 className="text-xl font-semibold tracking-wide">
              {mod.name}
            </h2>
          </div>
        ))}
      </div>

    </div>
  );
}