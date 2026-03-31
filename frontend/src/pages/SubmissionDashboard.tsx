import { useEffect, useState } from "react";

export default function SubmissionDashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [acceptedTask, setAcceptedTask] = useState<any>(null);

  // FORM STATES
  const [paperTitle, setPaperTitle] = useState("");
  const [publisher, setPublisher] = useState("");
  const [journal, setJournal] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("Submitted");
  const [proof, setProof] = useState("");

  // MENU + DASHBOARD
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("");
  const [dashboardData, setDashboardData] = useState<any>(null);

  /* ================= INIT ================= */
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    fetchTasks(parsedUser.id);
  }, []);

  const fetchTasks = async (userId: number) => {
    const res = await fetch(
      `http://localhost:5000/submission/tasks/${userId}`
    );
    const data = await res.json();

    setTasks(data);

    const accepted = data.find((t: any) => t.status === "ACCEPTED");
    setAcceptedTask(accepted);
  };

  /* ================= DASHBOARD ================= */
  const fetchDashboard = async () => {
    const res = await fetch(
      `http://localhost:5000/submission/dashboard/${user.id}`
    );
    const data = await res.json();
    setDashboardData(data);
  };

  /* ================= ACTIONS ================= */
  const acceptTask = async (id: number) => {
    await fetch("http://localhost:5000/submission/accept", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ task_id: id }),
    });

    fetchTasks(user.id);
  };

  const denyTask = async (id: number) => {
    await fetch("http://localhost:5000/submission/deny", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ task_id: id }),
    });

    fetchTasks(user.id);
  };

  /* ================= SUBMIT ================= */
  const submitSubmission = async (paperId: string) => {
    await fetch("http://localhost:5000/submission/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paper_id: paperId,
        paper_title: paperTitle,
        publisher_name: publisher,
        journal_name: journal,
        username,
        password,
        current_status: status,
        submission_proof: proof,
      }),
    });

    alert("Submission saved ✅");

    // RESET
    setPaperTitle("");
    setPublisher("");
    setJournal("");
    setUsername("");
    setPassword("");
    setStatus("Submitted");
    setProof("");

    // CLOSE FORM
    setAcceptedTask(null);

    fetchTasks(user.id);
  };

  /* ================= PROGRESS STEP ================= */
  const getStep = (stage: number) => {
    if (stage >= 11) return 4;
    if (stage >= 10) return 3;
    if (stage >= 9) return 2;
    return 1;
  };

  if (!user) {
    return <div className="text-white p-6">Login again</div>;
  }

  const pendingTasks = tasks.filter((t) => t.status === "PENDING");

  return (
    <div className="min-h-screen bg-gradient-to-r from-black via-gray-900 to-black text-white p-6 relative">

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-2xl"
        >
          ☰
        </button>

        <h1 className="text-3xl font-bold">
          Submission Dashboard
        </h1>
      </div>

      {/* ================= LEFT MENU ================= */}
      {menuOpen && (
        <div className="absolute top-16 left-6 bg-white text-black p-4 rounded shadow-lg z-50 w-40">

          <div
            className="cursor-pointer mb-2 hover:text-blue-600"
            onClick={async () => {
  setMenuOpen(false);

  if (!user) return;

  const res = await fetch(
    `http://localhost:5000/submission/dashboard/${user.id}`
  );
  const data = await res.json();

  setDashboardData(data);
  setActiveMenu("dashboard"); // 🔥 AFTER data is ready
}}
          >
            Dashboard
          </div>

          <div
            className="cursor-pointer mb-2 hover:text-blue-600"
            onClick={() => {
              setActiveMenu("profile");
              setMenuOpen(false);
            }}
          >
            Profile
          </div>

          <div
            className="cursor-pointer hover:text-blue-600"
            onClick={() => {
              setActiveMenu("settings");
              setMenuOpen(false);
            }}
          >
            Settings
          </div>

        </div>
      )}

      {/* ================= DASHBOARD POPUP ================= */}
      {activeMenu === "dashboard" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">

          <div className="bg-white text-black p-6 rounded-lg w-[800px] max-h-[90vh] overflow-y-auto relative">

            <button
              onClick={() => setActiveMenu("")}
              className="absolute top-3 right-4 text-xl font-bold"
            >
              ✕
            </button>

            <h2 className="text-2xl text-center mb-6">
              Submission Dashboard
            </h2>

            {/* STATS */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-500 text-white p-4 rounded text-center">
                Total<br />{dashboardData.total}
              </div>

              <div className="bg-yellow-500 p-4 rounded text-center">
                In Progress<br />{dashboardData.inProgress}
              </div>

              <div className="bg-green-500 text-white p-4 rounded text-center">
                Completed<br />{dashboardData.completed}
              </div>
            </div>

            {/* PROGRESS BAR */}
            {dashboardData.papers.map((p: any) => {
              const step = getStep(p.stage);

              return (
                <div key={p.paper_id} className="mb-6 border p-4 rounded">

                  <h3 className="font-bold mb-3">{p.paper_id}</h3>

                  <div className="flex items-center justify-between">

                    {["Accepted", "In Progress", "Submitted", "Updated"].map((label, i) => (
                      <div key={i} className="flex-1 text-center">

                        <div className={`h-2 mb-2 rounded ${
                          i < step ? "bg-green-500" : "bg-gray-300"
                        }`} />

                        <span className={`text-sm ${
                          i < step ? "text-green-600" : "text-gray-400"
                        }`}>
                          {label}
                        </span>

                      </div>
                    ))}

                  </div>
                </div>
              );
            })}

          </div>
        </div>
      )}

      {/* ================= PENDING ================= */}
      {!acceptedTask && pendingTasks.length > 0 && (
        <div className="bg-yellow-500 text-black p-6 rounded-lg">

          <h2 className="text-xl font-bold mb-4">
            Papers to Submit
          </h2>

          {pendingTasks.map((task: any) => (
            <div key={task.id} className="flex justify-between mb-3">
              <span>{task.paper_id}</span>

              <div className="flex gap-2">
                <button
                  onClick={() => acceptTask(task.id)}
                  className="bg-green-600 text-white px-3 py-1 rounded"
                >
                  Accept
                </button>

                <button
                  onClick={() => denyTask(task.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded"
                >
                  Deny
                </button>
              </div>
            </div>
          ))}

        </div>
      )}

      {/* ================= FORM ================= */}
      {acceptedTask && (
        <div className="bg-gray-800 p-6 rounded-lg mt-6">

          <h2 className="text-xl mb-4 text-green-400">
            Submission Details - {acceptedTask.paper_id}
          </h2>

          <input placeholder="Paper Title"
            value={paperTitle}
            onChange={(e)=>setPaperTitle(e.target.value)}
            className="p-2 w-full mb-2 bg-black border rounded" />

          <input placeholder="Publisher Name"
            value={publisher}
            onChange={(e)=>setPublisher(e.target.value)}
            className="p-2 w-full mb-2 bg-black border rounded" />

          <input placeholder="Journal Name"
            value={journal}
            onChange={(e)=>setJournal(e.target.value)}
            className="p-2 w-full mb-2 bg-black border rounded" />

          <input placeholder="Username"
            value={username}
            onChange={(e)=>setUsername(e.target.value)}
            className="p-2 w-full mb-2 bg-black border rounded" />

          <input placeholder="Password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            className="p-2 w-full mb-2 bg-black border rounded" />

          <select
            value={status}
            onChange={(e)=>setStatus(e.target.value)}
            className="p-2 w-full mb-2 bg-black border rounded"
          >
            <option>Submitted</option>
            <option>Technical Check</option>
            <option>With Editor</option>
            <option>Peer Review</option>
            <option>Revision</option>
            <option>Accepted</option>
            <option>Publisher</option>
            <option>Rejected</option>
          </select>

          <input placeholder="Submission Proof Link"
            value={proof}
            onChange={(e)=>setProof(e.target.value)}
            className="p-2 w-full mb-4 bg-black border rounded" />

          <button
            onClick={()=>submitSubmission(acceptedTask.paper_id)}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
          >
            Submit
          </button>

        </div>
      )}

      {/* ================= EMPTY ================= */}
      {!acceptedTask && pendingTasks.length === 0 && (
        <div className="text-center text-gray-400 mt-10">
          No submission tasks available
        </div>
      )}

    </div>
  );
}