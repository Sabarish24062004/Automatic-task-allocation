import { useEffect, useState } from "react";

export default function MarketingDashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    fetch(`http://localhost:5000/marketing-tasks/${user.id}`)
      .then((res) => res.json())
      .then((data) => setTasks(data));
  }, []);

  const handleAction = async (taskId: number, action: string) => {
    await fetch("http://localhost:5000/marketing-response", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ task_id: taskId, action }),
    });

    window.location.reload();
  };

  const getDaysLeft = (deadline: string) => {
    const today = new Date();
    const due = new Date(deadline);

    return Math.ceil(
      (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  // separate tasks
  const pendingTasks = tasks.filter(t => t.status === "PENDING");
  const acceptedTask = tasks.find(t => t.status === "ACCEPTED");

  return (
    <div className="min-h-screen bg-black text-white p-6">

      <h1 className="text-3xl font-bold mb-6">
        Marketing Dashboard
      </h1>

      {/* 🔔 COUNTDOWN TOP RIGHT */}
      {acceptedTask && (
        <div className="fixed top-4 right-4 bg-blue-600 px-4 py-2 rounded shadow">
          ⏳ {getDaysLeft(acceptedTask.deadline)} days left
        </div>
      )}

      {/* 🟡 PENDING TASKS */}
      <h2 className="text-xl mb-3">New Tasks</h2>

      {pendingTasks.length === 0 && <p>No new tasks</p>}

      {pendingTasks.map(task => (
        <div key={task.id} className="bg-white/10 p-4 mb-3 rounded">
          <p>Paper: {task.paper_id}</p>

          <button
            onClick={() => handleAction(task.id, "ACCEPT")}
            className="bg-green-500 px-3 py-1 mr-2"
          >
            Accept
          </button>

          <button
            onClick={() => handleAction(task.id, "DENY")}
            className="bg-red-500 px-3 py-1"
          >
            Deny
          </button>
        </div>
      ))}

      {/* 🟢 ACCEPTED TASK WORK */}
      {acceptedTask && (
        <div className="mt-8 bg-white/10 p-6 rounded">

          <h2 className="text-xl mb-4">
            Working on: {acceptedTask.paper_id}
          </h2>

          <form
            onSubmit={async (e) => {
              e.preventDefault();

              const formData = new FormData(e.target as HTMLFormElement);

              await fetch("http://localhost:5000/author-details", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  paper_id: acceptedTask.paper_id,
                  user_id: user.id,
                  author_name: formData.get("author_name"),
                  designation: formData.get("designation"),
                  department: formData.get("department"),
                  college_name: formData.get("college_name"),
                  address: formData.get("address"),
                  email: formData.get("email"),
                  orcid_id: formData.get("orcid_id"),
                  contact_number: formData.get("contact_number"),
                }),
              });

              alert("Details Submitted ✅");
            }}
            className="space-y-3"
          >

            <input name="author_name" placeholder="Author Name" className="w-full p-2 bg-black border rounded" />
            <input name="designation" placeholder="Designation" className="w-full p-2 bg-black border rounded" />
            <input name="department" placeholder="Department" className="w-full p-2 bg-black border rounded" />
            <input name="college_name" placeholder="College Name" className="w-full p-2 bg-black border rounded" />
            <input name="address" placeholder="Address" className="w-full p-2 bg-black border rounded" />
            <input name="email" placeholder="Email" className="w-full p-2 bg-black border rounded" />
            <input name="orcid_id" placeholder="ORCID ID" className="w-full p-2 bg-black border rounded" />
            <input name="contact_number" placeholder="Contact Number" className="w-full p-2 bg-black border rounded" />

            <button className="w-full bg-white text-black py-2 rounded">
              Submit Details
            </button>

          </form>
        </div>
      )}

    </div>
  );
}