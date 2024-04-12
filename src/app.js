const express = require("express");
const path = require("path");
const http = require("http");
const hbs = require("hbs");
const session = require("express-session");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

require("./db/conn");
const admin = require("./models/userlogin");
const Student=require("./models/student");

const port = process.env.PORT || 80;

const static_path = path.join(__dirname, "../public");
const templates_path = path.join(__dirname, "../templates/views");
const partials_path = path.join(__dirname, "../templates/partials");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(static_path));
app.use(cors());

app.use(
  session({
    secret: "your secret key",
    resave: true,
    saveUninitialized: true,
  })
);

app.set("view engine", "hbs");
app.set("views", templates_path);
hbs.registerPartials(partials_path);

app.get("/", (req, res) => {
  res.render("index");
});
app.get("/studentacess", (req, res) => {
  res.render("studentacess");
});
app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/login-head", (req, res) => {
  res.render("login-head");
});

app.get("/head", (req, res) => {
  res.render("head");
});

app.get("/admin", (req, res) => {
  res.render("admin", { adminName: req.session.usern });
});

app.get("/class-details/:classId", async (req, res) => {
  try {
    const { classId } = req.params;
    // Assuming you have a Student model
    const students = await Student.find({ className: `Class ${classId}` });
    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});


app.post("/check", async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const user = await admin.findOne({ email: email });

    if (user && user.password === password) {
      req.session.loggedIn = true;
      req.session.usern = await user.name;
      req.session.emailn = req.body.email;
      res.render("admin", { adminName: req.session.usern });
    } else {
      res.redirect("/login?message=Incorrect%20password");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.post("/head-check", (req, res) => {
  const { email, password } = req.body;

  // Check if the provided email and password match the predefined ones
  const predefinedEmail = "admin@example.com";
  const predefinedPassword = "admin123";

  if (email === predefinedEmail && password === predefinedPassword) {
    // Redirect to the admin dashboard or perform any other actions
    res.redirect("/head");
  } else {
    // Redirect back to the login page with an error message
    res.redirect("/login-head?error=Incorrect%20credentials");
  }
});


app.get("/logout", function (req, res) {
  req.session.destroy(function (err) {
    if (err) {
      console.error(err);
      res.status(500).send("Server error");
    } else {
      res.redirect("/");
    }
  });
});

app.get("/student-dashboard/:classId/:rollNumber", async (req, res) => {
  try {
    const { classId, rollNumber } = req.params;
    const student = await Student.findOne({ className: `Class ${classId}`, rollNumber });

    if (!student) {
      return res.status(404).send("Student not found");
    }

    res.render("student-dashboard", { student });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});


app.post("/add-fees/:className/:rollNumber", async (req, res) => {
  try {
    const { className, rollNumber } = req.params;
    const { feesAmount } = req.body;

    // Find the student in the database
    const student = await Student.findOne({ className, rollNumber });

    if (!student) {
      return res.status(404).send("Student not found");
    }

    // Update pending fees
    student.pendingFees -= feesAmount;

    // Create a new transaction history entry
    const transaction = {
      amountPaid: feesAmount,
      cashierName: req.session.usern, // Assuming you have the admin's name in the session
      date: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), // Format date in Indian time
    };

    // Push the new transaction to the transaction history array
    student.transactionHistory.push(transaction);

    // Save the updated student object
    await student.save();
    let classId = className.replace("Class ", "");
    res.redirect(`/student-dashboard/${classId}/${rollNumber}`);

  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});


// Handle adding a new student
app.post("/add-student", async (req, res) => {
  try {
    const { studentName, rollNumber, className } = req.body;

    // Create a new student instance
    const newStudent = new Student({
      studentName,
      rollNumber,
      className,
      pendingFees: 0, 
      transactionHistory: [] 
    });

    // Save the new student to the database
    await newStudent.save();

    res.redirect("/head");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.post("/add-cashier", async (req, res) => {
  try {
    const { cashierName, email, password } = req.body;

    // Create a new cashier instance
    const newCashier = new admin({
      name: cashierName, // Use the provided cashierName as the name field
      email,
      password
    });

    // Save the new cashier to the database
    await newCashier.save();

    res.redirect("/head");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// Handle removing a student
app.post("/remove-student", async (req, res) => {
  try {
    const { className, rollNumber } = req.body;

    // Find the student in the database
    const student = await Student.findOneAndDelete({ className, rollNumber });

    if (!student) {
      return res.status(404).send("Student not found");
    }

    res.redirect("/head");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});


// Handle removing a cashier
app.post("/remove-cashier", async (req, res) => {
  try {
    const { email } = req.body;

    // Find the cashier in the database
    const cashier = await admin.findOneAndDelete({ email });

    if (!cashier) {
      return res.status(404).send("Cashier not found");
    }

    res.redirect("/head");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});




server.listen(port, () => {
  console.log(`server is running at port no ${port}`);
});
