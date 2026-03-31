import { useState } from "react";

export default function AdminDashboard() {
  const [paperType, setPaperType] = useState("SCI");
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState("January");
  const [paperNumber, setPaperNumber] = useState("");

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("");
  const [dashboardData, setDashboardData] = useState<any>(null);

  const [employees, setEmployees] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "MARKETING"
  });

  const years = Array.from({ length: 201 }, (_, i) => 1900 + i);

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  /* ================= CREATE PAPER ================= */
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const res = await fetch("http://localhost:5000/create-paper", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
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

  /* ================= FETCH ================= */
  const fetchDashboard = async () => {
    const res = await fetch("http://localhost:5000/admin/dashboard");
    const data = await res.json();
    setDashboardData(data);
  };

  const fetchEmployees = async () => {
    const res = await fetch("http://localhost:5000/admin/employees");
    const data = await res.json();
    setEmployees(data); // FIXED
  };

  /* ================= EMPLOYEE ACTIONS ================= */

  const addEmployee = async () => {
    await fetch("http://localhost:5000/admin/employees/add", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(form)
    });

    setShowAdd(false);
    fetchEmployees();
  };

  const updateEmployee = async () => {
    await fetch(`http://localhost:5000/admin/employees/update/${selectedEmp.id}`, {
      method: "PUT",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(form)
    });

    setShowEdit(false);
    fetchEmployees();
  };

  const deleteEmployee = async () => {
    await fetch(`http://localhost:5000/admin/employees/delete/${selectedEmp.id}`, {
      method: "DELETE"
    });

    setShowDeleteConfirm(false);
    fetchEmployees();
  };

  /* ================= PROGRESS ================= */
  const getStep = (stage: number) => {
    if (stage >= 10) return 10;
    if (stage === 9) return 8;
    if (stage === 8) return 7;
    if (stage === 7) return 6;
    if (stage === 6) return 5;
    if (stage === 5) return 4;
    if (stage === 4) return 3;
    if (stage === 2) return 2;
    return 1;
  };

  const labels = [
    "Created","Author","Payment","Writing","Manuscript",
    "Report","Final","Accepted","Submitted","Completed"
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative">

      {/* MENU */}
      <button onClick={() => setMenuOpen(!menuOpen)} className="absolute top-6 left-6 text-2xl">☰</button>

      {menuOpen && (
        <div className="absolute top-16 left-6 bg-white text-black p-4 rounded shadow-lg">

          <div onClick={() => {
            setActiveMenu("dashboard");
            fetchDashboard();
            setMenuOpen(false);
          }}>Dashboard</div>

          <div onClick={() => {
            setActiveMenu("employees");
            fetchEmployees();
            setMenuOpen(false);
          }}>Employees</div>

          <div>Settings</div>

        </div>
      )}

      {/* CREATE PAPER */}
      <h1 className="text-3xl font-bold mb-8">Create Paper ID</h1>

      <form onSubmit={handleSubmit} className="bg-white/10 p-8 rounded-xl w-[400px] space-y-4">
        <select value={paperType} onChange={(e)=>setPaperType(e.target.value)} className="w-full p-3 bg-black border">
          <option>SCI</option><option>SCOPUS</option><option>PHD</option>
        </select>

        <select value={year} onChange={(e)=>setYear(Number(e.target.value))} className="w-full p-3 bg-black border">
          {years.map(y => <option key={y}>{y}</option>)}
        </select>

        <select value={month} onChange={(e)=>setMonth(e.target.value)} className="w-full p-3 bg-black border">
          {months.map(m => <option key={m}>{m}</option>)}
        </select>

        <input type="number" value={paperNumber} onChange={(e)=>setPaperNumber(e.target.value)} className="w-full p-3 bg-black border"/>

        <button className="w-full bg-white text-black py-3">Create</button>
      </form>

      {/* ================= DASHBOARD POPUP ================= */}
      {activeMenu === "dashboard" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">

          <div className="bg-white text-black p-6 rounded-lg w-[900px] max-h-[90vh] overflow-y-auto relative">

            <button onClick={() => setActiveMenu("")} className="absolute top-3 right-4 text-xl">✕</button>

            <h2 className="text-2xl text-center mb-6">Admin Dashboard</h2>

            {/* COUNTS */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-500 text-white p-4 text-center rounded">
                Total {dashboardData?.total || 0}
              </div>
              <div className="bg-yellow-500 p-4 text-center rounded">
                In Progress {dashboardData?.inProgress || 0}
              </div>
              <div className="bg-green-500 text-white p-4 text-center rounded">
                Completed {dashboardData?.completed || 0}
              </div>
            </div>

            {/* PROGRESS */}
            {dashboardData?.papers?.map((p: any) => {
              const step = getStep(p.stage);

              return (
                <div key={p.paper_id} className="mb-6 border p-4 rounded">
                  <h3 className="font-bold mb-3">{p.paper_id}</h3>

                  <div className="flex">
                    {labels.map((label, i) => (
                      <div key={i} className="flex-1 text-center">
                        <div className={`h-2 ${i < step ? "bg-green-500" : "bg-gray-300"}`} />
                        <span className="text-xs">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

          </div>
        </div>
      )}

      {/* ================= EMPLOYEES ================= */}
      {activeMenu === "employees" && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">

          <div className="bg-white text-black p-6 rounded w-[900px] relative">

            <button onClick={()=>setActiveMenu("")} className="absolute top-3 right-4">✕</button>

            <h2 className="text-xl mb-4">Employees</h2>

            <table className="w-full border mb-4">
              <thead className="bg-gray-200">
                <tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Delete</th></tr>
              </thead>

              <tbody>
                {employees.map(emp=>(
                  <tr key={emp.id} onClick={()=>{setSelectedEmp(emp);setForm(emp);setShowEdit(true);}} className="text-center border cursor-pointer">
                    <td>{emp.id}</td>
                    <td>{emp.name}</td>
                    <td>{emp.email}</td>
                    <td>{emp.role}</td>
                    <td>
                      <button onClick={(e)=>{e.stopPropagation();setSelectedEmp(emp);setShowDeleteConfirm(true);}}>
                        🗑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button onClick={()=>setShowAdd(true)} className="bg-green-500 px-4 py-2 text-white">
              Add Employee
            </button>

          </div>
        </div>
      )}

      {/* ADD */}
      {showAdd && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-6 text-black">
            <input placeholder="Name" onChange={e=>setForm({...form,name:e.target.value})}/>
            <input placeholder="Email" onChange={e=>setForm({...form,email:e.target.value})}/>
            <input placeholder="Password" onChange={e=>setForm({...form,password:e.target.value})}/>
            <select onChange={e=>setForm({...form,role:e.target.value})}>
              <option>ADMIN</option>
              <option>MARKETING</option>
              <option>WRITING</option>
              <option>SUBMISSION</option>
            </select>
            <button onClick={addEmployee}>Add</button>
          </div>
        </div>
      )}

      {/* EDIT */}
      {showEdit && selectedEmp && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-6 text-black">
            <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
            <input value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
            <input value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/>
            <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
              <option>ADMIN</option>
              <option>MARKETING</option>
              <option>WRITING</option>
              <option>SUBMISSION</option>
            </select>
            <button onClick={updateEmployee}>Edit</button>
          </div>
        </div>
      )}

      {/* DELETE */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-6 text-black text-center">
            <p>Do you want to delete?</p>
            <button onClick={deleteEmployee} className="bg-red-500 px-4 py-2 text-white">Delete</button>
            <button onClick={()=>setShowDeleteConfirm(false)} className="ml-2">Close</button>
          </div>
        </div>
      )}

    </div>
  );
}