const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./db");

const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(bodyParser.json());

/* =========================
   ROOT TEST
========================= */
app.get("/", (req, res) => {
  res.send("Backend Running 🚀");
});

/* =========================
   TEST DB
========================= */
app.get("/test-db", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.send("DB Error");
  }
});

/* =========================
   LOGIN API
========================= */
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

/* =========================
   CREATE PAPER + ASSIGN + DEADLINE
========================= */
app.post("/create-paper", async (req, res) => {
  const { paper_type, year, month, paper_number } = req.body;

  try {
    const paper_id = `${paper_type}-${year}-${month}-${paper_number}`;

    // insert paper
    await db.query(
      `INSERT INTO papers (paper_id, paper_type, year, month, paper_number)
       VALUES ($1,$2,$3,$4,$5)`,
      [paper_id, paper_type, year, month, paper_number]
    );

    // set deadline (30 days)
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 30);

    // get marketing users
    const marketingUsers = await db.query(
      "SELECT id FROM users WHERE role='MARKETING'"
    );

    // assign task to all marketing users
    for (let user of marketingUsers.rows) {
      await db.query(
        `INSERT INTO marketing_tasks (paper_id, assigned_to, deadline)
         VALUES ($1,$2,$3)`,
        [paper_id, user.id, deadline]
      );
    }

    res.json({
      message: "Paper created & assigned with deadline ✅",
      paper_id,
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating paper");
  }
});

/* =========================
   GET MARKETING TASKS
   (FIXED: includes ACCEPTED tasks)
========================= */
app.get("/marketing-tasks/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const tasks = await db.query(
      `SELECT * FROM marketing_tasks 
       WHERE assigned_to=$1 
       AND status IN ('PENDING','ACCEPTED')`,
      [userId]
    );

    res.json(tasks.rows);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching tasks");
  }
});

/* =========================
   ACCEPT / DENY TASK
========================= */
app.post("/marketing-response", async (req, res) => {
  const { task_id, action } = req.body;

  try {
    if (action === "ACCEPT") {
      await db.query(
        "UPDATE marketing_tasks SET status='ACCEPTED' WHERE id=$1",
        [task_id]
      );
    } else {
      await db.query(
        "UPDATE marketing_tasks SET status='DENIED' WHERE id=$1",
        [task_id]
      );
    }

    res.send("Task updated ✅");

  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating task");
  }
});

/* =========================
   SUBMIT AUTHOR DETAILS
========================= */
app.post("/author-details", async (req, res) => {
  const {
    paper_id,
    author_name,
    designation,
    department,
    college_name,
    address,
    email,
    orcid_id,
    contact_number,
    user_id,
  } = req.body;

  try {
    await db.query(
      `INSERT INTO author_details 
      (paper_id, author_name, designation, department, college_name, address, email, orcid_id, contact_number, submitted_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        paper_id,
        author_name,
        designation,
        department,
        college_name,
        address,
        email,
        orcid_id,
        contact_number,
        user_id,
      ]
    );

    res.send("Author details saved ✅");

  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving author details");
  }
});

/* =========================
   START SERVER
========================= */
app.listen(5000, () => {
  console.log("Server running on port 5000 🚀");
});