const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./db");

const app = express();
/* ================= EMAIL SETUP ================= */
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "your_email@gmail.com",
    pass: "your_password"
  }
});

const sendEmail = async (to, subject, text) => {
  try {
    console.log("📩 Sending email to:", to);

    const info = await transporter.sendMail({
      from: "your_email@gmail.com",
      to,
      subject,
      text
    });

    console.log("✅ Email sent:", info.response);

  } catch (err) {
    console.error("❌ Email Error:", err.message);
  }
};

app.use(cors());
app.use(bodyParser.json());

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.send("Backend Running 🚀");
});

/* ================= LOGIN ================= */
app.post("/login", async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const result = await db.query(
      "SELECT * FROM users WHERE email=$1 AND password=$2 AND role=$3",
      [email, password, role]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

/* ================= CREATE PAPER ================= */
app.post("/create-paper", async (req, res) => {
  const { paper_type, year, month, paper_number } = req.body;

  try {
    const paper_id = `${paper_type}-${year}-${month}-${paper_number}`;

    await db.query(
      `INSERT INTO papers (paper_id, paper_type, year, month, paper_number)
       VALUES ($1,$2,$3,$4,$5)`,
      [paper_id, paper_type, year, month, paper_number]
    );

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 30);

    const users = await db.query(
      "SELECT id FROM users WHERE role='MARKETING'"
    );

    for (let user of users.rows) {
      await db.query(
        `INSERT INTO marketing_tasks (paper_id, assigned_to, deadline, status)
         VALUES ($1,$2,$3,'PENDING')`,
        [paper_id, user.id, deadline]
      );
    }

    res.json({ message: "Paper created ✅", paper_id });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating paper");
  }
});

/* ================= ADMIN DASHBOARD ================= */
app.get("/admin/dashboard", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.paper_id, 
             COALESCE(a.stage, 1) AS stage,
             p.created_at
      FROM papers p
      LEFT JOIN author_details a 
      ON p.paper_id = a.paper_id
      ORDER BY p.created_at DESC
    `);

    const papers = result.rows;

    let total = papers.length;
    let inProgress = 0;
    let completed = 0;

    papers.forEach(p => {
      if (p.stage >= 1 && p.stage < 10) inProgress++;
      if (p.stage === 10) completed++;
    });

    res.json({
      total,
      inProgress,
      completed,
      papers
    });

  } catch (err) {
    console.error("Admin Dashboard Error:", err);
    res.status(500).send("Error");
  }
});

/* ================= GET EMPLOYEE DETAILS ================= */
app.get("/admin/employees", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM users ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching employees");
  }
});

/* ================= ADD EMPLOYEE ================= */
app.post("/admin/employees/add", async (req, res) => {
  const { email, password, role } = req.body;

  try {
    await db.query(
      `INSERT INTO users (email, password, role)
       VALUES ($1,$2,$3)`,
      [email, password, role.toUpperCase()]
    );

    res.send("Employee added ✅");

  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding employee");
  }
});
/* ================= UPDATE EMPLOYEE ================= */
app.put("/admin/employees/update/:id", async (req, res) => {
  const { id } = req.params;
  const { email, password, role } = req.body;

  try {
    await db.query(
      `UPDATE users
       SET email=$1, password=$2, role=$3
       WHERE id=$4`,
      [email, password, role.toUpperCase(), id]
    );

    res.send("Updated ✅");

  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating");
  }
});

/* ================= DELETE EMPLOYEE ================= */
app.delete("/admin/employees/delete/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db.query("DELETE FROM users WHERE id=$1", [id]);
    res.send("Deleted ✅");

  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting");
  }
});
/* ================= MARKETING TASKS ================= */
app.get("/marketing/tasks/:userId", async (req, res) => {
  const result = await db.query(
    "SELECT * FROM marketing_tasks WHERE assigned_to=$1 ORDER BY created_at DESC",
    [req.params.userId]
  );
  res.json(result.rows);
});

/* ================= MARKETING ACCEPT ================= */
app.post("/marketing/accept", async (req, res) => {
  const { task_id } = req.body;

  const task = await db.query(
    "SELECT * FROM marketing_tasks WHERE id=$1",
    [task_id]
  );

  const userId = task.rows[0].assigned_to;
  const paper_id = task.rows[0].paper_id;

  await db.query(
    "UPDATE marketing_tasks SET status='DENIED' WHERE assigned_to=$1 AND status='ACCEPTED'",
    [userId]
  );

  await db.query(
    "UPDATE marketing_tasks SET status='ACCEPTED' WHERE id=$1",
    [task_id]
  );

  await db.query(
    `INSERT INTO author_details (paper_id, submitted_by, stage)
     VALUES ($1,$2,1)
     ON CONFLICT (paper_id) DO NOTHING`,
    [paper_id, userId]
  );

  res.send("Task accepted ✅");
});

/* ================= AUTHOR DETAILS ================= */
app.post("/marketing/submit-details", async (req, res) => {
  const {
    paper_id,
    author_name,
    designation,
    department,
    college_name,
    address,
    email,
    orcid,
    contact,
    user_id,
  } = req.body;

  await db.query(
    `INSERT INTO author_details (
      paper_id, author_name, designation, department,
      college_name, address, email, orcid_id,
      contact_number, submitted_by, stage
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,2)
    ON CONFLICT (paper_id)
    DO UPDATE SET
      author_name=EXCLUDED.author_name,
      designation=EXCLUDED.designation,
      department=EXCLUDED.department,
      college_name=EXCLUDED.college_name,
      address=EXCLUDED.address,
      email=EXCLUDED.email,
      orcid_id=EXCLUDED.orcid_id,
      contact_number=EXCLUDED.contact_number,
      stage=2`,
    [
      paper_id,
      author_name,
      designation,
      department,
      college_name,
      address,
      email,
      orcid,
      contact,
      user_id,
    ]
  );

  await db.query(
    "UPDATE marketing_tasks SET status='COMPLETED' WHERE paper_id=$1",
    [paper_id]
  );

  res.send("Author details saved ✅");
});

/* ================= PAYMENT ================= */
app.post("/marketing/payment", async (req, res) => {
  try {
    const {
      paper_id,
      total_amount,
      initial_payment_status,
      payment_proof,
      remaining_payment_status,
    } = req.body;

    console.log("PAYMENT HIT:", req.body);

    await db.query(
      `UPDATE author_details
       SET total_amount=$1,
           initial_payment_status=$2,
           payment_proof=$3,
           remaining_payment_status=$4,
           stage=4
       WHERE paper_id=$5`,
      [
        total_amount,
        initial_payment_status,
        payment_proof,
        remaining_payment_status,
        paper_id,
      ]
    );

    const writers = await db.query(
  "SELECT id FROM users WHERE role='WRITING'"
);

if (writers.rows.length === 0) {
  return res.status(500).send("No WRITING users found");
}

for (let user of writers.rows) {
  await db.query(
    `INSERT INTO writing_tasks (paper_id, assigned_to, status)
     VALUES ($1,$2,'PENDING')
     ON CONFLICT DO NOTHING`,
    [paper_id, user.id]
  );
}

    console.log("✅ Inserted into writing_tasks:", paper_id);

    await db.query(
      "UPDATE author_details SET stage=5 WHERE paper_id=$1",
      [paper_id]
    );

    const author = await db.query(
      "SELECT email FROM author_details WHERE paper_id=$1",
      [paper_id]
    );

    if (author.rows.length > 0) {
      await sendEmail(
        author.rows[0].email,
        "Paper Process has been initiated",
        "Your paper has been sent to the writing team and Thank You for Choosing Our Publication and you will be notified on each update."
      );
    }


    res.send("Sent to writing ✅");

  } catch (err) {
    console.error("🔥 Payment Error:", err);
    res.status(500).send("Error processing payment");
  }
});

/* ================= UNPAID PAPERS ================= */
app.get("/marketing/unpaid-papers/:userId", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT DISTINCT a.paper_id
       FROM author_details a
       LEFT JOIN writing_tasks w ON a.paper_id = w.paper_id
       WHERE a.submitted_by = $1
       AND w.paper_id IS NULL   -- 🔥 NOT SENT TO WRITING
       ORDER BY a.paper_id DESC`,
      [req.params.userId]
    );

    console.log("FINAL FILTER:", result.rows);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

/* ================= MARKETING DASHBOARD ================= */
app.get("/marketing/dashboard/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const tasks = await db.query(
      `SELECT paper_id FROM marketing_tasks WHERE assigned_to=$1`,
      [userId]
    );

    const paperIds = tasks.rows.map(t => t.paper_id);

    if (paperIds.length === 0) {
      return res.json({
        total: 0,
        inProgress: 0,
        completed: 0,
        papers: []
      });
    }

    const papers = await db.query(
      `SELECT paper_id, stage 
       FROM author_details 
       WHERE paper_id = ANY($1)
       ORDER BY id DESC`,
      [paperIds]
    );

    let total = paperIds.length;
    let inProgress = 0;
    let completed = 0;

    papers.rows.forEach(p => {
      if (p.stage < 5) inProgress++;
      else completed++;
    });

    res.json({
      total,
      inProgress,
      completed,
      papers: papers.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

/* ================= WRITING TASKS ================= */
app.get("/writing/tasks/:userId", async (req, res) => {
  const result = await db.query(
  `SELECT wt.*, ad.stage 
   FROM writing_tasks wt
   LEFT JOIN author_details ad 
   ON wt.paper_id = ad.paper_id
   WHERE wt.assigned_to=$1 
   AND wt.status IN ('PENDING','ACCEPTED')
   AND NOT EXISTS (
     SELECT 1 FROM writing_tasks wt2
     WHERE wt2.paper_id = wt.paper_id
     AND wt2.status='ACCEPTED'
     AND wt2.assigned_to != $1
   )
   ORDER BY wt.id DESC`,
  [req.params.userId]
);

  res.json(result.rows);
});

/* ================= WRITING ACCEPT ================= */
app.post("/writing/accept", async (req, res) => {
  const { task_id } = req.body;

  try {
    const task = await db.query(
      "SELECT * FROM writing_tasks WHERE id=$1",
      [task_id]
    );

    if (task.rows.length === 0) {
      return res.status(404).send("Task not found");
    }
    const paper_id = task.rows[0].paper_id;

    const userId = task.rows[0].assigned_to;

    // ❌ Remove previous accepted
    await db.query(
      "UPDATE writing_tasks SET status='DENIED' WHERE assigned_to != $2 AND paper_id=$1",
      [paper_id, userId]
    );

    // ✅ THIS LINE WAS MISSING 🔥
    await db.query(
      "UPDATE writing_tasks SET status='ACCEPTED' WHERE id=$1",
      [task_id]
    );

    res.send("Task accepted ✅");

  } catch (err) {
    console.error(err);
    res.status(500).send("Error accepting task");
  }
});

/* ================= MANUSCRIPT ================= */
app.post("/writing/manuscript", async (req, res) => {
  const { paper_id, manuscript_link } = req.body;

  await db.query(
    `UPDATE author_details
     SET manuscript_link=$1, stage=6
     WHERE paper_id=$2`,
    [manuscript_link, paper_id]
  );

  res.send("Manuscript saved");
});

/* ================= PLAG ================= */
app.post("/writing/plag", async (req, res) => {
  const { paper_id, plag_report_link } = req.body;

  await db.query(
    `UPDATE author_details
     SET plag_report_link=$1, stage=7
     WHERE paper_id=$2`,
    [plag_report_link, paper_id]
  );

  res.send("Plag saved");
});

/* ================= FINAL ================= */
app.post("/writing/review", async (req, res) => {
  const { paper_id, review_comment_link, updated_paper_link } = req.body;

  await db.query(
    `UPDATE author_details
     SET review_comment_link=$1,
         updated_paper_link=$2,
         stage=8
     WHERE paper_id=$3`,
    [review_comment_link, updated_paper_link, paper_id]
  );

  await db.query(
    `UPDATE writing_tasks
     SET status='COMPLETED'
     WHERE paper_id=$1 AND status='ACCEPTED'`,
    [paper_id]
  );

  const users = await db.query(
    "SELECT id FROM users WHERE role='SUBMISSION'"
  );

  for (let user of users.rows) {
    await db.query(
      `INSERT INTO submission_tasks (paper_id, assigned_to, status)
       VALUES ($1,$2,'PENDING')
       ON CONFLICT DO NOTHING`,
      [paper_id, user.id]
    );
  }

  const author = await db.query(
    "SELECT email FROM author_details WHERE paper_id=$1",
    [paper_id]
  );

  if (author.rows.length > 0) {
    await sendEmail(
      author.rows[0].email,
      "Manuscript wor has been completed",
      "Your paper has been forwarded to the Submission Team."
    );
  }


  res.send("Sent to submission ✅");
});

/* ================= WRITING DASHBOARD (FINAL FIX) ================= */
app.get("/writing/dashboard/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    // 🔥 Get all papers assigned to this writer
    const tasks = await db.query(
      `SELECT paper_id FROM writing_tasks WHERE assigned_to=$1`,
      [userId]
    );

    const paperIds = tasks.rows.map(t => t.paper_id);

    if (paperIds.length === 0) {
      return res.json({
        total: 0,
        inProgress: 0,
        completed: 0,
        papers: []
      });
    }

    // 🔥 Get actual progress from author_details
    const papers = await db.query(
      `SELECT paper_id, stage 
       FROM author_details
       WHERE paper_id = ANY($1)
       ORDER BY stage DESC, paper_id DESC`,
      [paperIds]
    );

    let total = new Set(paperIds).size;     // ✅ NEVER RESET
    let inProgress = 0;
    let completed = 0;

    papers.rows.forEach(p => {
      if (p.stage >= 6 && p.stage < 8) {
        inProgress++;   // manuscript + report
      }
      if (p.stage === 8) {
        completed++;    // final submit
      }
    });

    res.json({
      total,
      inProgress,
      completed,
      papers: papers.rows
    });

  } catch (err) {
    console.error("Writing Dashboard Error:", err);
    res.status(500).send("Error fetching writing dashboard");
  }
});

/* ================= SUBMISSION TASKS ================= */
app.get("/submission/tasks/:userId", async (req, res) => {
  const result = await db.query(
  `SELECT st.*, ad.stage 
   FROM submission_tasks st
   LEFT JOIN author_details ad 
   ON st.paper_id = ad.paper_id
   WHERE st.assigned_to=$1 
   AND st.status IN ('PENDING','ACCEPTED')
   AND NOT EXISTS (
     SELECT 1 FROM submission_tasks st2
     WHERE st2.paper_id = st.paper_id
     AND st2.status='ACCEPTED'
     AND st2.assigned_to != $1
   )
   ORDER BY st.id DESC`,
  [req.params.userId]
);

  res.json(result.rows);
});

/* ================= SUBMISSION ACCEPT ================= */
app.post("/submission/accept", async (req, res) => {
  const { task_id } = req.body;

  try {
    const task = await db.query(
      "SELECT * FROM submission_tasks WHERE id=$1",
      [task_id]
    );
    const paper_id = task.rows[0].paper_id;
    const userId = task.rows[0].assigned_to;

    await db.query(
      "UPDATE submission_tasks SET status='DENIED' WHERE assigned_to != $2 AND paper_id=$1",
      [paper_id, userId]
    );

    await db.query(
      "UPDATE submission_tasks SET status='ACCEPTED' WHERE id=$1",
      [task_id]
    );

    res.send("Submission Accepted ✅");

  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

/* ================= SUBMISSION Deny ================= */
app.post("/submission/deny", async (req, res) => {
  const { task_id } = req.body;

  await db.query(
    "UPDATE submission_tasks SET status='DENIED' WHERE id=$1",
    [task_id]
  );

  res.send("Denied");
});
/* ================= SUBMISSION UPDATE ================= */
app.post("/submission/update", async (req, res) => {
  const {
    paper_id,
    paper_title,
    publisher_name,
    journal_name,
    username,
    password,
    current_status,
    submission_proof,
  } = req.body;

  try {
    await db.query(
      `UPDATE author_details
       SET paper_title=$1,
           publisher_name=$2,
           journal_name=$3,
           submission_username=$4,
           submission_password=$5,
           current_status=$6,
           submission_proof=$7,
           stage=10
       WHERE paper_id=$8`,
      [
        paper_title,
        publisher_name,
        journal_name,
        username,
        password,
        current_status,
        submission_proof,
        paper_id,
      ]
    );

    await db.query(
  `UPDATE submission_tasks
   SET status='COMPLETED'
   WHERE paper_id=$1 AND status='ACCEPTED'`,
  [paper_id]
);

const author = await db.query(
  "SELECT email FROM author_details WHERE paper_id=$1",
  [paper_id]
);  
if (author.rows.length > 0) {
  await sendEmail(
    author.rows[0].email, 
    "Paper Submitted Successfully",
    "The Paper has been submitted successfully and Further details will be notified."
  );
}


    res.send("Submission details saved ✅");

  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving submission");
  }
});

/* ================= SUBMISSION DASHBOARD ================= */
app.get("/submission/dashboard/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const tasks = await db.query(
      `SELECT paper_id FROM submission_tasks WHERE assigned_to=$1`,
      [userId]
    );
    const paperIds = tasks.rows.map(t => t.paper_id);

    if (paperIds.length === 0) { 
      return res.json({
        total: 0,
        inProgress: 0,
        completed: 0,
        papers: []
      });
    }

    const papers = await db.query(
      `SELECT paper_id, stage 
       FROM author_details
       WHERE paper_id = ANY($1)
       ORDER BY stage DESC, paper_id DESC`,
      [paperIds]
    );

    let total = new Set(paperIds).size;     // ✅ NEVER RESET
    let inProgress = 0;
    let completed = 0;

    papers.rows.forEach(p => {
      if (p.stage >= 9 && p.stage < 10) inProgress++;
      if (p.stage === 10) completed++;
    });

    res.json({
      total,
      inProgress,
      completed,
      papers: papers.rows
    }); 

  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

/* ================= EMAIL API ================= */
app.post("/submission/send-email", async (req, res) => {
  const { paper_id } = req.body;

  await db.query(
    `UPDATE author_details
     SET stage=11
     WHERE paper_id=$1`,
    [paper_id]
  );

  res.send("Email sent ✅");
});

/* ================= START ================= */
app.listen(5000, () => {
  console.log("Server running on port 5000 🚀");
});