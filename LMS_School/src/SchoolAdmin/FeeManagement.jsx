import React, { useEffect, useState } from "react";
import axios from "axios";
import "./FeeManagement.css";
import { useNavigate } from "react-router-dom";

const FEE_HEADS = [
  "Tuition Fee",
  "Transport",
  "Generator/Electricity",
  "Books & Stationary",
  "Examination Fee",
  "Library Fee",
  "Computer Lab Fee",
  "Games & Sports Fee",
  "Miscellaneous Charge",
  "Fine",
  "Others",
];

const FeeManagement = () => {
  const schoolCode = localStorage.getItem("schoolCode");
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const API_URL = import.meta.env.VITE_API_URL;
  const [selected, setSelected] = useState(null);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [totalFee, setTotalFee] = useState(0);
  const [paidFee, setPaidFee] = useState(0);
  const [dueDate, setDueDate] = useState("");
  const [payingDate] = useState(new Date().toISOString().split("T")[0]);

  const [fees, setFees] = useState({});
  const [pendingFees, setPendingFees] = useState({}); // New state for pending fees
  const [feeHistory, setFeeHistory] = useState([]);

  // -----------------------------------
  // FETCH STUDENTS
  // -----------------------------------
  const fetchStudents = async () => {
    try {
      console.log("🔍 Fetching students...");
      console.log("School Code:", schoolCode);
      console.log("API URL:", API_URL);

      const res = await axios.get(
        `${API_URL}/api/students?schoolCode=${schoolCode}`
      );

      console.log("✅ API Response:", res.data);

      const list = Array.isArray(res.data.data) ? res.data.data : [];
      console.log("📋 Students List:", list);

      setStudents(list);
      setResults(list);
    } catch (err) {
      console.error("❌ Fetch Students Error:", err);
      console.error("Error Response:", err.response?.data);
      console.error("Error Status:", err.response?.status);
      alert(
        `Failed to fetch students: ${
          err.response?.data?.message || err.message
        }`
      );
    }
  };

  useEffect(() => {
    if (!schoolCode) {
      alert("⚠️ School Code is missing! Please log in again.");
      return;
    }

    if (!API_URL) {
      alert("⚠️ API URL is not configured! Check your .env file.");
      return;
    }

    fetchStudents();
  }, []);

  // -----------------------------------
  // SEARCH
  // -----------------------------------
  const searchNow = async () => {
    // If search is empty, show all students
    if (!searchQuery.trim()) {
      setResults(students);
      return;
    }

    console.log("🔍 Searching for:", searchQuery);

    try {
      const res = await axios.get(
        `${API_URL}/api/students/search?query=${searchQuery}&schoolCode=${schoolCode}`
      );

      console.log("✅ Search Response:", res.data);
      setResults(res.data.data || []);
    } catch (err) {
      console.error("❌ Search Error:", err);
      console.error("Error Response:", err.response?.data);

      // If search endpoint doesn't exist, filter locally
      if (err.response?.status === 404 || err.response?.status === 500) {
        console.log("⚠️ Backend search not available, filtering locally");
        filterLocally();
      } else {
        setResults([]);
      }
    }
  };

  // -----------------------------------
  // LOCAL FILTER (Fallback)
  // -----------------------------------
  const filterLocally = () => {
    const query = searchQuery.toLowerCase().trim();

    const filtered = students.filter((student) => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      const phone = String(student.phone || "");
      const rollNumber = String(student.rollNumber || "").toLowerCase();
      const studentClass = String(student.studentClass || "").toLowerCase();
      const section = String(student.section || "").toLowerCase();
      const email = String(student.email || "").toLowerCase();

      return (
        fullName.includes(query) ||
        phone.includes(query) ||
        rollNumber.includes(query) ||
        studentClass.includes(query) ||
        section.includes(query) ||
        email.includes(query)
      );
    });

    console.log(
      `📊 Filtered ${filtered.length} out of ${students.length} students`
    );
    setResults(filtered);
  };

  // -----------------------------------
  // OPEN ADD FEE
  // -----------------------------------
  const openFeeModal = async (stu) => {
    setSelected(stu);
    setFees({});
    setPendingFees({}); // Reset pending fees

    try {
      const res = await axios.get(
        `${API_URL}/api/fee/summary/${stu.id}/${schoolCode}`
      );

      const summary = res.data.summary || {};
      setTotalFee(summary.totalFeeAmount ?? 0);
      setPaidFee(summary.totalPaid ?? 0);

      if (summary.lastDueDate) {
        setDueDate(
          new Date(summary.lastDueDate).toISOString().split("T")[0]
        );
      } else {
        setDueDate("");
      }
    } catch (err) {
      console.error("❌ Fee Summary Error:", err);
      console.error("Error Response:", err.response?.data);
    }

    setShowFeeModal(true);
  };

  // -----------------------------------
  // OUTSTANDING DUES
  // -----------------------------------
  const openOutstandingModal = (student) => {
    navigate("/school-dashboard/outstanding-dues", {
      state: { student },
    });
  };

  // -----------------------------------
  // OPEN HISTORY
  // -----------------------------------
  const openHistoryModal = async (stu) => {
    setSelected(stu);
    try {
      const res = await axios.get(
        `${API_URL}/api/fee/history/${stu.id}/${schoolCode}`
      );
      setFeeHistory(res.data.payments || []);
    } catch (err) {
      console.error("❌ Fee History Error:", err);
      console.error("Error Response:", err.response?.data);
      setFeeHistory([]);
    }
    setShowHistoryModal(true);
  };

  // -----------------------------------
  // PAYING NOW FEE HANDLERS
  // -----------------------------------
  const toggleFee = (head) => {
    setFees((prev) => {
      const updated = { ...prev };
      if (updated[head]) delete updated[head];
      else updated[head] = { amount: "", note: "" };
      return updated;
    });
  };

  const updateFee = (head, field, value) => {
    setFees((prev) => ({
      ...prev,
      [head]: {
        ...prev[head],
        [field]: value,
      },
    }));
  };

  const totalPayingNow = Object.values(fees).reduce(
    (sum, f) => sum + Number(f.amount || 0),
    0
  );

  // -----------------------------------
  // PENDING FEE HANDLERS
  // -----------------------------------
  const togglePendingFee = (head) => {
    setPendingFees((prev) => {
      const updated = { ...prev };
      if (updated[head]) delete updated[head];
      else updated[head] = { amount: "", note: "" };
      return updated;
    });
  };

  const updatePendingFee = (head, field, value) => {
    setPendingFees((prev) => ({
      ...prev,
      [head]: {
        ...prev[head],
        [field]: value,
      },
    }));
  };

  const totalPending = Object.values(pendingFees).reduce(
    (sum, f) => sum + Number(f.amount || 0),
    0
  );

  // -----------------------------------
  // SUBMIT PAYMENT
  // -----------------------------------
  const submitFee = async () => {
    if (totalPayingNow <= 0 && totalPending <= 0) {
      alert("Please add at least one fee item (paying or pending)");
      return;
    }

    const requestPayload = {
      studentId: selected.id,
      schoolCode,
      payingNow: totalPayingNow,
      pendingAmount: totalPending,
      dueDate,
      feeBreakup: fees, // Fees being paid now
      pendingFeeBreakup: pendingFees, // Fees that are pending
      totalAmount: totalPayingNow + totalPending,
    };

    // ===============================
    // 🔍 BEFORE API CALL (DEVTOOLS)
    // ===============================
    console.group("💰 FEE PAYMENT SUBMIT");
    console.log("👨‍🎓 Student Selected:", selected);
    console.log("🏫 School Code:", schoolCode);
    console.log("🧾 Student ID:", selected.id);
    console.log("💵 Total Paying Now:", totalPayingNow);
    console.log("⏳ Total Pending:", totalPending);
    console.log("💰 Grand Total:", totalPayingNow + totalPending);
    console.log("📆 Due Date:", dueDate);
    console.log("🧮 Fee Breakup (Paying):", fees);
    console.log("🧮 Pending Fee Breakup:", pendingFees);
    console.log("📦 Final Payload:", requestPayload);
    console.groupEnd();

    try {
      const res = await axios.post(`${API_URL}/api/fee/pay`, requestPayload);

      // ===============================
      // ✅ AFTER SUCCESS
      // ===============================
      console.group("✅ FEE PAYMENT SUCCESS");
      console.log("✅ API Response:", res.data);
      console.groupEnd();

      alert("Fee payment added successfully");
      setShowFeeModal(false);
      fetchStudents();
    } catch (err) {
      // ===============================
      // ❌ ERROR HANDLING
      // ===============================
      console.group("❌ FEE PAYMENT FAILED");
      console.error("Error Message:", err.message);
      console.error("Error Response:", err.response?.data);
      console.error("Error Status:", err.response?.status);
      console.groupEnd();

      alert(
        `Fee payment failed: ${err.response?.data?.message || err.message}`
      );
    }
  };

  // -----------------------------------
  // UI
  // -----------------------------------
  return (
    <section className="fee-container">
      <h2>Fee Management</h2>

      <div className="fee-search-box">
        <input
          placeholder="Search by Name / Roll Number / Phone"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && searchNow()}
        />
        <button onClick={searchNow}>Search</button>
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery("");
              setResults(students);
            }}
            style={{ marginLeft: "10px" }}
          >
            Clear
          </button>
        )}
      </div>

      <table className="students-table">
        <thead>
          <tr>
            <th>Photo</th>
            <th>Name</th>
            <th>Class</th>
            <th>Roll Number</th>
            <th>Contact</th>
            <th>Add Fee</th>
            <th>Pending Fees</th>
            <th>History</th>
          </tr>
        </thead>
        <tbody>
          {results.length === 0 ? (
            <tr>
              <td colSpan="8" style={{ textAlign: "center", padding: "20px" }}>
                No students found
              </td>
            </tr>
          ) : (
            results.map((s) => (
              <tr key={s.id}>
                <td>
                  <img
                    src={s.photo ? `${API_URL}${s.photo}` : "/user.png"}
                    className="student-photo"
                    alt="student"
                  />
                </td>
                <td>
                  {s.firstName} {s.lastName}
                </td>
                <td>
                  {s.studentClass} - {s.section}
                </td>
                <td>{s.rollNumber}</td>
                <td>{s.phone}</td>
                <td>
                  <button onClick={() => openFeeModal(s)}>Add Fee</button>
                </td>
                <td>
                  <button
                    className="dues-btn"
                    onClick={() => openOutstandingModal(s)}
                  >
                    Outstanding Dues
                  </button>
                </td>
                <td>
                  <button onClick={() => openHistoryModal(s)}>View</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* ADD FEE MODAL */}
      {showFeeModal && selected && (
        <div className="fee-modal">
          <div className="fee-modal-content">
            {/* STUDENT DETAILS */}
            <div className="student-info-box">
              <div>
                <strong>Name:</strong> {selected.firstName} {selected.lastName}
              </div>
              <div>
                <strong>Student ID:</strong> {selected.id}
              </div>
              <div>
                <strong>Class:</strong> {selected.studentClass} -{" "}
                {selected.section}
              </div>
              <div>
                <strong>Roll Number:</strong> {selected.rollNumber}
              </div>
              <div>
                <strong>Contact:</strong> {selected.phone}
              </div>
            </div>

            {/* FEE SUMMARY */}
            <div className="fee-summary-box">
              <div>
                <strong>Total Fee:</strong> ₹ {totalFee}
              </div>
              <div>
                <strong>Paid:</strong> ₹ {paidFee}
              </div>
              <div>
                <strong>Pending:</strong> ₹ {totalFee - paidFee}
              </div>
            </div>

            <h3>
              Add Fee – {selected.firstName} {selected.lastName}
            </h3>

            {/* PAYING NOW SECTION */}
            <h4 style={{ marginTop: "20px", color: "#2563eb" }}>
              💰 Paying Now
            </h4>
            <table className="receipt-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Particulars</th>
                  <th>Note</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {FEE_HEADS.map((h) => (
                  <tr key={h}>
                    <td>
                      <input
                        type="checkbox"
                        checked={!!fees[h]}
                        onChange={() => toggleFee(h)}
                      />
                    </td>
                    <td>{h}</td>
                    <td>
                      <input
                        disabled={!fees[h]}
                        value={fees[h]?.note || ""}
                        onChange={(e) => updateFee(h, "note", e.target.value)}
                        placeholder="Optional note"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        disabled={!fees[h]}
                        value={fees[h]?.amount || ""}
                        onChange={(e) =>
                          updateFee(h, "amount", e.target.value)
                        }
                        placeholder="0"
                        min="0"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3">
                    <strong>TOTAL PAYING NOW</strong>
                  </td>
                  <td>
                    <strong>₹ {totalPayingNow}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>

            <div className="form-row">
              <label>Payment Date</label>
              <input
                type="date"
                value={payingDate}
                readOnly
                style={{ backgroundColor: "#f3f4f6" }}
              />
            </div>

            {/* PENDING FEES SECTION */}
            <h4 style={{ marginTop: "30px", color: "#dc2626" }}>
              📋 Pending Fees
            </h4>
            <table className="receipt-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Particulars</th>
                  <th>Note</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {FEE_HEADS.map((h) => (
                  <tr key={h}>
                    <td>
                      <input
                        type="checkbox"
                        checked={!!pendingFees[h]}
                        onChange={() => togglePendingFee(h)}
                      />
                    </td>
                    <td>{h}</td>
                    <td>
                      <input
                        disabled={!pendingFees[h]}
                        value={pendingFees[h]?.note || ""}
                        onChange={(e) =>
                          updatePendingFee(h, "note", e.target.value)
                        }
                        placeholder="Optional note"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        disabled={!pendingFees[h]}
                        value={pendingFees[h]?.amount || ""}
                        onChange={(e) =>
                          updatePendingFee(h, "amount", e.target.value)
                        }
                        placeholder="0"
                        min="0"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3">
                    <strong>TOTAL PENDING</strong>
                  </td>
                  <td>
                    <strong>₹ {totalPending}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>

            <div className="form-row">
              <label>Due Date for Pending Fees</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            {/* GRAND TOTAL */}
            <div
              style={{
                marginTop: "20px",
                padding: "15px",
                backgroundColor: "#f9fafb",
                borderRadius: "8px",
                border: "2px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}
              >
                <span>
                  <strong>Paying Now:</strong>
                </span>
                <span style={{ color: "#16a34a" }}>
                  <strong>₹ {totalPayingNow}</strong>
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}
              >
                <span>
                  <strong>Pending:</strong>
                </span>
                <span style={{ color: "#dc2626" }}>
                  <strong>₹ {totalPending}</strong>
                </span>
              </div>
              <hr
                style={{
                  margin: "10px 0",
                  border: "none",
                  borderTop: "2px solid #d1d5db",
                }}
              />
              <div
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                <span style={{ fontSize: "18px" }}>
                  <strong>GRAND TOTAL:</strong>
                </span>
                <span style={{ fontSize: "18px", color: "#1e40af" }}>
                  <strong>₹ {totalPayingNow + totalPending}</strong>
                </span>
              </div>
            </div>

            <div className="fee-modal-buttons">
              <button
                onClick={submitFee}
                disabled={totalPayingNow <= 0 && totalPending <= 0}
              >
                Submit Payment
              </button>
              <button onClick={() => setShowFeeModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fee-modal">
          <div className="fee-modal-content">
            <h3>
              Fee History - {selected?.firstName} {selected?.lastName}
            </h3>

            {feeHistory.length === 0 ? (
              <p style={{ textAlign: "center", padding: "20px" }}>
                No payment history found
              </p>
            ) : (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Paid Amount</th>
                    <th>Payment Date</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {feeHistory.map((f, index) => (
                    <tr key={f.paymentId || index}>
                      <td>₹ {f.payingNow}</td>
                      <td>{new Date(f.paymentDate).toLocaleDateString()}</td>
                      <td>{new Date(f.dueDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <button onClick={() => setShowHistoryModal(false)}>Close</button>
          </div>
        </div>
      )}
    </section>
  );
};

export default FeeManagement;