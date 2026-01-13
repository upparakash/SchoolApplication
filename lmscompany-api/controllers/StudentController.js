const path = require("path");
const fs = require("fs");
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken"); // ADD THIS
// Save uploaded photo
const saveImage = (file) => {
  if (!file) return null;
  const fileName = `student_${Date.now()}.png`;
  const uploadPath = path.join(__dirname, "..", "uploads", fileName);
  fs.writeFileSync(uploadPath, file.buffer);
  return `/uploads/${fileName}`;
};

//  ADD Student
exports.addStudent = async (req, res) => {
  try {
    const {
      // ================= PERSONAL INFO =================
      firstName,
      lastName,
      fatherName,
      motherName,
      dateOfBirth,
      gender,
      bloodGroup,
      nationality,
      category,
      religion,

      // ================= CONTACT INFO =================
      phone,
      email,
      password,
      address,
      city,
      state,
      pinCode,
      guardianName,
      guardianPhone,
      relation,
      emergencyContact,

      // ================= ACADEMIC INFO =================
      studentClass,
      section,
      rollNumber,
      academicSession,
      feeCategory,
      feeDiscount,
      previousClass,
      previousSchool,

      // ================= MEDICAL & OTHER =================
      medicalConditions,
      allergies,
      specialNeeds,
      documents,
      optionalServices,
      confirmationAccepted,

      // ================= SYSTEM =================
      schoolCode
    } = req.body;

    // 🔹 Confirmation validation
    if (!confirmationAccepted) {
      return res.status(400).json({
        success: false,
        message: "Please accept confirmation before submitting"
      });
    }

    // 🔹 Auto roll number support
    const finalRollNumber = rollNumber === "Auto" ? null : rollNumber;

    // 🔹 Duplicate check (email + school)
    const [existing] = await db.query(
      "SELECT id FROM students1 WHERE email = ? AND schoolCode = ?",
      [email, schoolCode]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Student already exists"
      });
    }


    
    const hashedPassword = await bcrypt.hash(password, 10);

   
    const profilePhoto = req.file
      ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
      : null;

    const sql = `
      INSERT INTO students1 (
        firstName, lastName, fatherName, motherName, dateOfBirth,
        gender, bloodGroup, nationality, category, religion,
        phone, email, password, profilePhoto, address, city, state, pinCode,
        guardianName, guardianPhone, relation, emergencyContact,
        studentClass, section, rollNumber, academicSession,
        feeCategory, feeDiscount, previousClass, previousSchool,
        medicalConditions, allergies, specialNeeds,
        documents, optionalServices,
        schoolCode
      )
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `;

    await db.query(sql, [
      firstName,
      lastName,
      fatherName,
      motherName,
      dateOfBirth,
      gender,
      bloodGroup,
      nationality,
      category,
      religion,
      phone,
      email,
      hashedPassword,
      profilePhoto,
      address,
      city,
      state,
      pinCode,
      guardianName,
      guardianPhone,
      relation,
      emergencyContact,
      studentClass,
      section,
      finalRollNumber,
      academicSession,
      feeCategory,
      feeDiscount,
      previousClass,
      previousSchool,
      medicalConditions,
      allergies,
      specialNeeds,
      JSON.stringify(documents),
      JSON.stringify(optionalServices),
      schoolCode
    ]);

    res.json({
      success: true,
      message: "Student added successfully"
    });
  } catch (err) {
    console.error("Add Student Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};


// GET Students
const safeJsonParse = (value) => {
  try {
    if (!value) return [];
    if (typeof value !== "string") return value;

    if (value.trim().startsWith("[")) {
      return JSON.parse(value);
    }

    return value.split(",").map((v) => v.trim());
  } catch {
    return [];
  }
};

// GET Students
exports.getStudents = async (req, res) => {
  try {
    const { schoolCode } = req.query;

    if (!schoolCode) {
      return res.status(400).json({
        success: false,
        message: "schoolCode is required"
      });
    }

    const [rows] = await db.query(
      `SELECT 
        id,
        firstName,
        lastName,
        fatherName,
        motherName,
        dateOfBirth,
        gender,
        bloodGroup,
        nationality,
        category,
        religion,

        phone,
        email,
        password,
        profilePhoto,
        address,
        city,
        state,
        pinCode,
        guardianName,
        guardianPhone,
        relation,
        emergencyContact,

        studentClass,
        section,
        rollNumber,
        academicSession,
        feeCategory,
        feeDiscount,
        previousClass,
        previousSchool,

        medicalConditions,
        allergies,
        specialNeeds,
        documents,
        optionalServices,

        schoolCode,
        createdAt
      FROM students1
      WHERE schoolCode = ?
      ORDER BY id DESC`,
      [schoolCode]
    );

    const students = rows.map((s) => ({
      ...s,
      documents: safeJsonParse(s.documents),
      optionalServices: safeJsonParse(s.optionalServices),
    }));

    res.json({
      success: true,
      total: students.length,
      data: students
    });
  } catch (err) {
    console.error("Get Students Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};



// UPDATE Student
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      firstName, lastName, fatherName, motherName, dateOfBirth,
      gender, bloodGroup, nationality, category, religion,
      phone, email, password,  address, city, state, pinCode,
      guardianName, guardianPhone, relation, emergencyContact,
      studentClass, section, rollNumber, academicSession,
      feeCategory, feeDiscount, previousClass, previousSchool,
      medicalConditions, allergies, specialNeeds,
      documents, optionalServices
    } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

   
    

    const profilePhoto = req.file
      ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
      : null;


    const sql = `
      UPDATE students1 SET
        firstName=?, lastName=?, fatherName=?, motherName=?, dateOfBirth=?,
        gender=?, bloodGroup=?, nationality=?, category=?, religion=?,
        phone=?, email=?, password=?, profilePhoto=?, address=?, city=?, state=?, pinCode=?,
        guardianName=?, guardianPhone=?, relation=?, emergencyContact=?,
        studentClass=?, section=?, rollNumber=?, academicSession=?,
        feeCategory=?, feeDiscount=?, previousClass=?, previousSchool=?,
        medicalConditions=?, allergies=?, specialNeeds=?,
        documents=?, optionalServices=?
      WHERE id = ?
    `;


    await db.query(sql, [
      firstName, lastName, fatherName, motherName, dateOfBirth,
      gender, bloodGroup, nationality, category, religion,
      phone, email, hashedPassword, profilePhoto, address, city, state, pinCode,
      guardianName, guardianPhone, relation, emergencyContact,
      studentClass, section, rollNumber, academicSession,
      feeCategory, feeDiscount, previousClass, previousSchool,
      medicalConditions, allergies, specialNeeds,
      JSON.stringify(documents || []),
      JSON.stringify(optionalServices || []),
      id
    ]);

    res.json({ success: true, message: "Student updated successfully" });
  } catch (err) {
    console.error("Update Student Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


// DELETE Student
exports.deleteStudent = async (req, res) => {
  try {
    const id = req.params.id;

    const [[student]] = await db.query("SELECT photo FROM students WHERE id=?", [id]);

    if (!student) return res.status(404).json({ success: false, message: "Not found" });

    if (student.photo) {
      const filePath = path.join(__dirname, "..", student.photo);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await db.query("DELETE FROM students WHERE id=?", [id]);

    res.json({ success: true, message: "Student deleted successfully" });
  } catch (err) {
    console.error("Delete Student Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


exports.studentLogin = async (req, res) => {
  try {
    console.log("Login Request Body:", req.body);

    const { admissionId, password, schoolCode } = req.body;

    if (!admissionId || !password || !schoolCode) {
      console.log("Missing fields");
      return res.status(400).json({
        success: false,
        message: "Admission ID, Password & School Code are required"
      });
    }

    console.log("Checking student in DB...");

    const [rows] = await db.query(
      "SELECT id, fullname, admissionId, password, schoolCode FROM students WHERE admissionId = ? AND schoolCode = ?",
      [admissionId, schoolCode]
    );

    console.log("DB Result:", rows);

    if (rows.length === 0) {
      console.log("No student found");
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const student = rows[0];
    console.log("Student Found:", student);

    const isMatch = await bcrypt.compare(password, student.password);
    console.log("Password Match:", isMatch);

    if (!isMatch) {
      console.log("Password does not match");
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: student.id,
        admissionId: student.admissionId,
        schoolCode: student.schoolCode
      },
      process.env.JWT_SECRET || "STUDENT_SECRET_KEY",
      { expiresIn: "7d" }
    );

    console.log("Token Generated");

    res.json({
      success: true,
      message: "Login successful",
      token,
      student: {
        id: student.id,
        fullname: student.fullname,
        admissionId: student.admissionId,
        schoolCode: student.schoolCode
      }
    });

  } catch (err) {
    console.error("Student Login Error:", err.message, err.stack);
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

//  Get Logged-in Student Profile
exports.studentProfile = async (req, res) => {
  try {
    const { admissionId, schoolCode } = req.user; // comes from JWT

    const [student] = await db.query(
      `SELECT 
        id,
        firstName,
        lastName,
        fatherName,
        motherName,
        dateOfBirth,
        gender,
        bloodGroup,
        nationality,
        category,
        religion,
        phone,
        email,
        profilePhoto,
        address,
        city,
        state,
        pinCode,
        guardianName,
        guardianPhone,
        relation,
        emergencyContact,
        studentClass,
        section,
        rollNumber,
        academicSession,
        feeCategory,
        feeDiscount,
        previousClass,
        previousSchool,
        medicalConditions,
        allergies,
        specialNeeds,
        documents,
        optionalServices,
        photo,
        schoolCode,
        createdAt
      FROM students1 
      WHERE id = ? AND schoolCode = ?`,
      [admissionId, schoolCode]
    );

    if (student.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Student not found" 
      });
    }

    const studentData = {
      ...student[0],
      documents: safeJsonParse(student[0].documents),
      optionalServices: safeJsonParse(student[0].optionalServices),
    };

    res.json({ 
      success: true, 
      data: studentData 
    });
    
  } catch (err) {
    console.error("Student Profile Error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server Error" 
    });
  }
};


exports.searchStudents = async (req, res) => {
  try {
    const { query, schoolCode } = req.query;

    if (!query || !schoolCode) {
      return res.status(400).json({
        success: false,
        message: "query & schoolCode required"
      });
    }

    const search = `%${query}%`;

    const [rows] = await db.query(
      `SELECT 
        id,
        firstName,
        lastName,
        fatherName,
        motherName,
        dateOfBirth,
        gender,
        bloodGroup,
        nationality,
        category,
        religion,
        phone,
        email,
        ProfilePhoto,
        address,
        city,
        state,
        pinCode,
        guardianName,
        guardianPhone,
        relation,
        emergencyContact,
        studentClass,
        section,
        rollNumber,
        academicSession,
        feeCategory,
        feeDiscount,
        previousClass,
        previousSchool,
        medicalConditions,
        allergies,
        specialNeeds,
        documents,
        optionalServices,
        schoolCode,
        createdAt
      FROM students1
      WHERE schoolCode = ?
      AND (
        CONCAT(firstName, ' ', lastName) LIKE ?
        OR firstName LIKE ?
        OR lastName LIKE ?
        OR phone LIKE ?
        OR email LIKE ?
        OR rollNumber LIKE ?
        OR studentClass LIKE ?
        OR CAST(id AS CHAR) LIKE ?
      )
      ORDER BY id DESC`,
      [schoolCode, search, search, search, search, search, search, search, search]
    );

    const students = rows.map((s) => ({
      ...s,
      documents: safeJsonParse(s.documents),
      optionalServices: safeJsonParse(s.optionalServices),
    }));

    res.json({ 
      success: true, 
      total: students.length,
      data: students 
    });

  } catch (err) {
    console.error("Search Students Error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server Error" 
    });
  }
};
