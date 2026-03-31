import { useEffect, useState } from "react";

export default function WritingDashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  const [manuscript, setManuscript] = useState("");
  const [plag, setPlag] = useState("");
  const [review, setReview] = useState("");
  const [updatedPaper, setUpdatedPaper] = useState("");

  const [manuscriptSubmitted, setManuscriptSubmitted] = useState(false);
  const [plagSubmitted, setPlagSubmitted] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  const [step, setStep] = useState(1);

  // ✅ NEW: Dashboard data from backend
  const [dashboardData, setDashboardData] = useState<any>({
    total: 0,
    inProgress: 0,
    completed: 0,
    papers: [],
  });

  /* ================= INIT ================= */
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    fetchTasks(parsedUser.id);
    fetchDashboard(parsedUser.id); // 🔥 IMPORTANT
  }, []);

  const fetchTasks = async (userId: number) => {
  try {
    const res = await fetch(
      `http://localhost:5000/writing/tasks/${userId}`
    );
    const data = await res.json();

    console.log("WRITING TASKS:", data); // 🔥 DEBUG

    setTasks(data);
  } catch (err) {
    console.error("Fetch Tasks Error:", err);
  }
};

  const fetchDashboard = async (userId: number) => {
    try {
      const res = await fetch(
        `http://localhost:5000/writing/dashboard/${userId}`
      );
      const data = await res.json();
      setDashboardData(data);
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= ACTIONS ================= */

  const acceptTask = async (id: number) => {
    await fetch("http://localhost:5000/writing/accept", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ task_id: id }),
    });

    fetchTasks(user.id);
    fetchDashboard(user.id); // 🔥 update dashboard
  };

  const denyTask = async (id: number) => {
    await fetch("http://localhost:5000/writing/deny", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ task_id: id }),
    });

    fetchTasks(user.id);
  };

  /* ================= WORKFLOW ================= */

  const submitManuscript = async (paperId: string) => {
    await fetch("http://localhost:5000/writing/manuscript", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paper_id: paperId, manuscript_link: manuscript }),
    });

    setManuscriptSubmitted(true);
    setStep(2);

    fetchDashboard(user.id); // 🔥 update
  };

  const submitPlag = async (paperId: string) => {
    await fetch("http://localhost:5000/writing/plag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paper_id: paperId, plag_report_link: plag }),
    });

    setPlagSubmitted(true);
    setStep(3);

    fetchDashboard(user.id);
  };

  const submitFinal = async (paperId: string) => {
    await fetch("http://localhost:5000/writing/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paper_id: paperId,
        review_comment_link: review,
        updated_paper_link: updatedPaper,
      }),
    });

    // 🔥 RESET UI
    setStep(1);
    setManuscript("");
    setPlag("");
    setReview("");
    setUpdatedPaper("");
    setManuscriptSubmitted(false);
    setPlagSubmitted(false);

    fetchTasks(user.id);
    fetchDashboard(user.id); // 🔥 update
    setTasks([]);
  };

  if (!user) {
    return <div className="text-white p-6">Please login again</div>;
  }

  const acceptedTask = tasks.find(
  (t: any) => t.status?.toUpperCase() === "ACCEPTED"
);

const pendingTasks = tasks.filter(
  (t: any) => t.status?.toUpperCase() === "PENDING"
);

  /* ================= PROGRESS STEP ================= */
  const getStep = (stage: number) => {
    if (stage >= 8) return 4;
    if (stage === 7) return 3;
    if (stage === 6) return 2;
    return 1;
  };

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gradient-to-r from-black via-gray-900 to-black text-white p-6">

      {/* MENU */}
      <div className="fixed top-4 left-4 z-50">
        <button onClick={() => setMenuOpen(!menuOpen)} className="text-white text-2xl">
          ☰
        </button>

        {menuOpen && (
          <div className="mt-2 bg-white text-black rounded shadow-lg w-48">
            <div onClick={() => { setShowDashboard(true); setMenuOpen(false); }} className="p-3 hover:bg-gray-200 cursor-pointer">Dashboard</div>
            <div className="p-3 hover:bg-gray-200">Profile</div>
            <div className="p-3 hover:bg-gray-200">Settings</div>
          </div>
        )}
      </div>

      <h1 className="text-3xl font-bold mb-6 text-center">
        Writing Dashboard
      </h1>

      {/* PENDING */}
      {!acceptedTask && pendingTasks.length > 0 && (
        <div className="bg-yellow-500 text-black p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">New Papers</h2>

          {pendingTasks.map((task: any) => (
            <div key={task.id} className="flex justify-between mb-3">
              <span>{task.paper_id}</span>

              <div className="flex gap-2">
                <button onClick={() => acceptTask(task.id)} className="bg-green-600 text-white px-3 py-1 rounded">
                  Accept
                </button>
                <button onClick={() => denyTask(task.id)} className="bg-red-600 text-white px-3 py-1 rounded">
                  Deny
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ACTIVE */}
      {acceptedTask && (
        <div className="bg-gray-800 p-6 rounded-lg mt-6">
          <h2 className="text-xl mb-4">
            Working on: <span className="text-green-400">{acceptedTask.paper_id}</span>
          </h2>

          <input value={manuscript} onChange={(e) => setManuscript(e.target.value)} placeholder="Manuscript Link" className="p-2 w-full mb-2 bg-black border rounded" />

          <button onClick={() => submitManuscript(acceptedTask.paper_id)} disabled={manuscriptSubmitted}
            className={`px-4 py-1 rounded mb-4 ${manuscriptSubmitted ? "bg-gray-500" : "bg-white text-black"}`}>
            {manuscriptSubmitted ? "Submitted" : "Submit Manuscript"}
          </button>

          {step >= 2 && (
            <>
              <input value={plag} onChange={(e) => setPlag(e.target.value)} placeholder="Plag Report" className="p-2 w-full mb-2 bg-black border rounded" />
              <button onClick={() => submitPlag(acceptedTask.paper_id)} disabled={plagSubmitted}
                className={`px-4 py-1 rounded mb-4 ${plagSubmitted ? "bg-gray-500" : "bg-white text-black"}`}>
                {plagSubmitted ? "Submitted" : "Submit Report"}
              </button>
            </>
          )}

          {step >= 3 && (
            <>
              <input value={review} onChange={(e) => setReview(e.target.value)} placeholder="Review Comment" className="p-2 w-full mb-2 bg-black border rounded" />
              <input value={updatedPaper} onChange={(e) => setUpdatedPaper(e.target.value)} placeholder="Updated Paper" className="p-2 w-full mb-2 bg-black border rounded" />
              <button onClick={() => submitFinal(acceptedTask.paper_id)} className="bg-green-600 px-4 py-2 rounded">
                Final Submit
              </button>
            </>
          )}
        </div>
      )}

      {/* DASHBOARD POPUP */}
      {showDashboard && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white text-black p-6 rounded-lg w-[500px] max-h-[80vh] overflow-y-auto relative">

            <button
              onClick={() => setShowDashboard(false)}
              className="absolute top-2 right-3 text-xl font-bold"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-4 text-center">
              Writing Dashboard
            </h2>

            <div className="grid grid-cols-3 gap-3 mb-6 text-center">
              <div className="bg-blue-500 p-3 rounded text-white">
                Total<br />{dashboardData.total}
              </div>
              <div className="bg-yellow-400 p-3 rounded">
                In Progress<br />{dashboardData.inProgress}
              </div>
              <div className="bg-green-500 p-3 rounded text-white">
                Completed<br />{dashboardData.completed}
              </div>
            </div>

            {/* PROGRESS */}
            {dashboardData.papers?.map((paper: any, index: number) => {
              const step = getStep(paper.stage);

              return (
                <div key={index} className="mb-4">
                  <div className="font-semibold">{paper.paper_id}</div>

                  <div className="mt-4">
  <div className="flex items-center justify-between relative">

    {["Accepted", "Manuscript", "Report", "Final"].map((label, i) => {
      const active = step >= i + 1;

      return (
        <div key={i} className="flex-1 flex flex-col items-center relative z-10">

          {/* CIRCLE */}
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500
              ${active ? "bg-green-500 text-white scale-110" : "bg-gray-300"}
            `}
          >
            ✓
          </div>

          {/* LABEL */}
          <span className="text-xs mt-2 text-center">{label}</span>

          {/* LINE */}
          {i !== 3 && (
            <div
              className={`absolute top-3 left-1/2 w-full h-1 transition-all duration-500
                ${step > i + 1 ? "bg-green-500" : "bg-gray-300"}
              `}
              style={{ zIndex: -1 }}
            />
          )}
        </div>
      );
    })}

  </div>
</div>
                </div>
              );
            })}

          </div>
        </div>
      )}

    </div>
  );
}