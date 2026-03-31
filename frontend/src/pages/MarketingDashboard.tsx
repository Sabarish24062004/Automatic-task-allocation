import { useEffect, useState } from "react";

export default function MarketingDashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!user) {
    return <div className="text-white p-6">Please login again</div>;
  }

  const [tasks, setTasks] = useState<any[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  // ✅ NEW DASHBOARD STATE
  const [showDashboard, setShowDashboard] = useState(false);
  const [dashboardData, setDashboardData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
  });

  const [unpaidPapers, setUnpaidPapers] = useState<any[]>([]);
  const [selectedPaper, setSelectedPaper] = useState("");

  const [formData, setFormData] = useState({
    author_name: "",
    designation: "",
    department: "",
    college_name: "",
    address: "",
    email: "",
    orcid: "",
    contact: "",
  });

  const [paymentData, setPaymentData] = useState({
    total_amount: "",
    initial_payment_status: "",
    payment_proof: "",
    remaining_payment_status: "",
  });

  /* ================= FETCH TASKS ================= */
  const fetchTasks = () => {
    fetch(`http://localhost:5000/marketing/tasks/${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        const sorted = data.sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );
        setTasks(sorted);
      });
  };

  /* ================= FETCH DASHBOARD ================= */
  const fetchDashboard = () => {
    fetch(`http://localhost:5000/marketing/dashboard/${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        const sorted = (data.papers || []).sort(
  (a: any, b: any) => b.id - a.id   // 🔥 latest first
);

setDashboardData(sorted);

        setStats({
          total: data.total || 0,
          inProgress: data.inProgress || 0,
          completed: data.completed || 0,
        });
      });
  };

  useEffect(() => {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) return;

  const parsedUser = JSON.parse(storedUser);

  fetchTasks();
  fetchUnpaid(user.id); // ✅ ADD THIS
}, []);

  /* ================= ACCEPT ================= */
  const acceptTask = async (taskId: number) => {
    await fetch("http://localhost:5000/marketing/accept", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ task_id: taskId }),
    });

    fetchTasks();
  };

  /* ================= DENY ================= */
  const denyTask = async (taskId: number) => {
    await fetch("http://localhost:5000/marketing/deny", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ task_id: taskId }),
    });

    fetchTasks();
  };

  /* ================= AUTHOR ================= */
  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const submitDetails = async (paperId: string) => {
    await fetch("http://localhost:5000/marketing/submit-details", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paper_id: paperId,
        ...formData,
        user_id: user.id,
      }),
    });

    alert("Author details submitted ✅");

    setFormData({
      author_name: "",
      designation: "",
      department: "",
      college_name: "",
      address: "",
      email: "",
      orcid: "",
      contact: "",
    });

    fetchTasks();
    fetchUnpaid(user.id);
  };

  /* ================= PAYMENT ================= */
  const handlePaymentChange = (e: any) => {
    setPaymentData({
      ...paymentData,
      [e.target.name]: e.target.value,
    });
  };

  const submitPayment = async () => {
  if (!selectedPaper) {
    alert("Please select Paper ID ❗");
    return;
  }

  await fetch("http://localhost:5000/marketing/payment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      paper_id: selectedPaper,
      ...paymentData,
    }),
  });

  // ✅ Only show success message
  alert("Payment saved & sent to Writing Team ✅");

  // ❌ NO REDIRECT HERE

  setPaymentData({
    total_amount: "",
    initial_payment_status: "",
    payment_proof: "",
    remaining_payment_status: "",
  });

  setSelectedPaper("");
  setShowPayment(false);

  fetchUnpaid(user.id);
};

const fetchUnpaid = async (userId: number) => {
  try {
    const res = await fetch(
      `http://localhost:5000/marketing/unpaid-papers/${userId}`
    );

    const data = await res.json();

    setUnpaidPapers(data);

  } catch (err) {
    console.error("Fetch unpaid error:", err);
  }
};

  /* ================= DEADLINE ================= */
  const getDaysLeft = (deadline: string) => {
    const today = new Date();
    const due = new Date(deadline);

    return Math.ceil(
      (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  /* ================= TASK LOGIC ================= */
  const acceptedTask = tasks.find(
    (t: any) => t.status?.toUpperCase() === "ACCEPTED"
  );

  const pendingTasks = tasks.filter(
    (t: any) => t.status?.toUpperCase() === "PENDING"
  );

  /* ================= TRACKING STEPS ================= */
  const steps = [
    "Paper Selected",
    "Author Details Collected",
    "Payment In Progress",
    "Payment Completed",
    "Forwarded to Writing Team",
  ];

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gradient-to-r from-black to-gray-900 text-white p-6">

      {/* MENU */}
      <div className="fixed top-4 left-4 z-50">
        <button onClick={() => setMenuOpen(!menuOpen)} className="text-2xl">
          ☰
        </button>

        {menuOpen && (
          <div className="mt-2 bg-white text-black rounded shadow-lg w-48">

            {/* ✅ UPDATED DASHBOARD CLICK */}
            <div
              className="p-3 hover:bg-gray-200 cursor-pointer"
              onClick={() => {
                setShowDashboard(true);
                fetchDashboard(); // ✅ FETCH DASHBOARD DATA
                setMenuOpen(false);
              }}
            >
              Dashboard
            </div>

            <div
              className="p-3 hover:bg-gray-200 cursor-pointer"
              onClick={() => setShowPayment(true)}
            >
              Payment Details
            </div>

            <div className="p-3 hover:bg-gray-200 cursor-pointer">
              Profile
            </div>

            <div className="p-3 hover:bg-gray-200 cursor-pointer">
              Settings
            </div>

          </div>
        )}
      </div>

      <h1 className="text-3xl font-bold mb-6 text-center">
        Marketing Dashboard
      </h1>

      {/* WARNING */}
      {acceptedTask && (
        <div className="bg-red-500 p-3 rounded mb-4 text-center">
          You already have an active task
        </div>
      )}

      {/* PENDING */}
      {!acceptedTask && pendingTasks.length > 0 && (
        <div className="bg-yellow-500 text-black p-4 rounded mb-6">
          <h2 className="font-bold mb-3">New Tasks</h2>

          {pendingTasks.map((task: any) => (
            <div key={task.id} className="flex justify-between mb-2">
              <span>{task.paper_id}</span>

              <div className="flex gap-2">
                <button
                  onClick={() => acceptTask(task.id)}
                  className="bg-green-600 px-3 py-1 rounded"
                >
                  Accept
                </button>

                <button
                  onClick={() => denyTask(task.id)}
                  className="bg-red-600 px-3 py-1 rounded"
                >
                  Deny
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ACTIVE */}
      {acceptedTask && (
        <div className="bg-gray-800 p-6 rounded-lg relative">
          <div className="absolute top-4 right-4 bg-blue-600 px-3 py-1 rounded">
            ⏳ {getDaysLeft(acceptedTask.deadline)} days left
          </div>

          <h2 className="text-xl mb-4">
            Working on: {acceptedTask.paper_id}
          </h2>

          <div className="grid gap-4">

            <input name="author_name" placeholder="Author Name" onChange={handleChange} className="p-2 bg-black border rounded" />
            <input name="designation" placeholder="Designation" onChange={handleChange} className="p-2 bg-black border rounded" />
            <input name="department" placeholder="Department" onChange={handleChange} className="p-2 bg-black border rounded" />
            <input name="college_name" placeholder="College Name" onChange={handleChange} className="p-2 bg-black border rounded" />
            <input name="address" placeholder="Address" onChange={handleChange} className="p-2 bg-black border rounded" />
            <input name="email" placeholder="Email" onChange={handleChange} className="p-2 bg-black border rounded" />
            <input name="orcid" placeholder="ORCID" onChange={handleChange} className="p-2 bg-black border rounded" />
            <input name="contact" placeholder="Contact" onChange={handleChange} className="p-2 bg-black border rounded" />

            <button
              onClick={() => submitDetails(acceptedTask.paper_id)}
              className="bg-white text-black py-2 rounded"
            >
              Submit Details
            </button>

          </div>
        </div>
      )}

      {/* ================= DASHBOARD MODAL ================= */}
      {showDashboard && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">

          <div className="bg-white text-black p-6 rounded-lg w-[800px] max-h-[90vh] overflow-y-auto relative">

            <button
    onClick={() => setShowDashboard(false)}
    className="absolute top-3 right-4 text-xl font-bold text-gray-600 hover:text-black"
  >
    ✕
  </button>

            <h2 className="text-2xl font-bold text-center mb-6">
              📊 Marketing Dashboard
            </h2>

            {/* STATS */}
            <div className="grid grid-cols-3 gap-4 mb-6 text-center">

              <div className="bg-blue-100 p-4 rounded">
                <h3>Total Projects</h3>
                <p>{stats.total}</p>
              </div>

              <div className="bg-yellow-100 p-4 rounded">
                <h3>Work In Progress</h3>
                <p>{stats.inProgress}</p>
              </div>

              <div className="bg-green-100 p-4 rounded">
                <h3>Completed</h3>
                <p>{stats.completed}</p>
              </div>

            </div>

            {/* TRACKING */}
            {dashboardData.map((paper: any, index: number) => (
              <div key={index} className="mb-6 border p-4 rounded">

                <h3 className="font-bold mb-4">{paper.paper_id}</h3>

                {steps.map((step, i) => {
                  const stepNumber = i + 1;
                  const isDone = paper.stage >= stepNumber;
                  const isActive = paper.stage === stepNumber;

                  return (
                    <div key={i} className="flex items-start mb-4">

                      <div className="flex flex-col items-center mr-4">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${isDone ? "bg-green-500" : "bg-gray-300"}`}>
                          {isDone ? "✔" : ""}
                        </div>

                        {i !== steps.length - 1 && (
                          <div className={`w-1 h-10 ${isDone ? "bg-green-500" : "bg-gray-300"}`}></div>
                        )}
                      </div>

                      <div>
                        <p className={`${isActive ? "text-blue-600" : isDone ? "text-black" : "text-gray-400"}`}>
                          {step}
                        </p>
                      </div>

                    </div>
                  );
                })}

              </div>
            ))}

          </div>

        </div>
      )}

      {/* PAYMENT MODAL (UNCHANGED) */}
      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white text-black p-6 rounded-lg w-96">

            <h2 className="text-xl font-bold mb-4 text-center">
              Payment Details
            </h2>

            <select
  className="p-2 w-full border rounded mb-3"
  value={selectedPaper}
  onChange={(e) => setSelectedPaper(e.target.value)}
>
  <option value="">Select Paper ID</option>

  {unpaidPapers.map((paper: any) => (
    <option key={paper.paper_id} value={paper.paper_id}>
      {paper.paper_id}
    </option>
  ))}
</select>
            <input name="total_amount" placeholder="Total Amount" onChange={handlePaymentChange} className="p-2 border rounded mb-2" />
            <input name="initial_payment_status" placeholder="Initial Payment" onChange={handlePaymentChange} className="p-2 border rounded mb-2" />
            <input name="payment_proof" placeholder="Proof Link" onChange={handlePaymentChange} className="p-2 border rounded mb-2" />
            <input name="remaining_payment_status" placeholder="Remaining Payment" onChange={handlePaymentChange} className="p-2 border rounded mb-3" />

            <button onClick={submitPayment} className="bg-black text-white py-2 w-full rounded">
              Submit
            </button>

            <button onClick={() => setShowPayment(false)} className="text-red-500 mt-3 w-full">
              Close
            </button>

          </div>
        </div>
      )}

    </div>
  );
}