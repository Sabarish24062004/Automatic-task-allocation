import { useState } from "react";

export default function AdminDashboard() {
  const [paperType, setPaperType] = useState("SCI");
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState("January");
  const [paperNumber, setPaperNumber] = useState("");

  const years = Array.from({ length: 201 }, (_, i) => 1900 + i);

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const res = await fetch("http://localhost:5000/create-paper", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paper_type: paperType,
        year,
        month,
        paper_number: paperNumber,
      }),
    });

    const data = await res.json();

    alert(`Created: ${data.paper_id}`);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">

      <h1 className="text-3xl font-bold mb-8">Create Paper ID</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white/10 p-8 rounded-xl w-[400px] space-y-4"
      >

        {/* Paper Type */}
        <select
          value={paperType}
          onChange={(e) => setPaperType(e.target.value)}
          className="w-full p-3 rounded bg-black border"
        >
          <option value="SCI">SCI</option>
          <option value="SCOPUS">SCOPUS</option>
          <option value="PHD">PHD</option>
        </select>

        {/* Year */}
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="w-full p-3 rounded bg-black border"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        {/* Month */}
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-full p-3 rounded bg-black border"
        >
          {months.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>

        {/* Paper Number */}
        <input
          type="number"
          placeholder="Paper Number"
          value={paperNumber}
          onChange={(e) => setPaperNumber(e.target.value)}
          className="w-full p-3 rounded bg-black border"
        />

        <button
          type="submit"
          className="w-full bg-white text-black py-3 rounded font-semibold"
        >
          Create Paper ID
        </button>

      </form>

    </div>
  );
}