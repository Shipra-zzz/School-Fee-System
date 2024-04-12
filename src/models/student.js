const mongoose = require("mongoose");

const studentSchema = mongoose.Schema({
  className: { type: String, required: true },
  studentName: { type: String, required: true },
  rollNumber: { type: String, required: true, unique: true },
  pendingFees: { type: Number, default: 0 }, // Assuming fees are in numbers
  transactionHistory: [{
    amountPaid: { type: Number, required: true },
    cashierName: { type: String, required: true },
    date: { type: Date, default: Date.now }
  }]
});

// Create a model from the schema
const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
