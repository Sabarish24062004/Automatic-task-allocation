import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Login() {
  const { role } = useParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: any) => {
    e.preventDefault();

    const res = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, role }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("user", JSON.stringify(data));

      // redirect based on role
      if (role === "ADMIN") navigate("/admin");
      else if (role === "MARKETING") navigate("/marketing");
      else if (role === "WRITING") navigate("/writing");
      else if (role === "SUBMISSION") navigate("/submission");

    } else {
      alert(data.message || "Login Failed ❌");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center text-white">

      <form
        onSubmit={handleLogin}
        className="bg-white/10 backdrop-blur-lg border border-white/20 p-10 rounded-2xl shadow-xl w-[350px]"
      >
        <h2 className="text-2xl font-semibold text-center mb-6">
          {role} Login
        </h2>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-4 rounded-lg bg-white/20 border border-white/30"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-4 rounded-lg bg-white/20 border border-white/30"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-gray-200"
        >
          Login
        </button>
      </form>

    </div>
  );
}