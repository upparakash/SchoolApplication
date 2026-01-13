import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AddStudentModal.css";

const AddStudentModal = ({ onClose, editData }) => {
  const [step, setStep] = useState(1);

  const token = localStorage.getItem("schoolToken");
  const schoolCode = localStorage.getItem("schoolCode");

  const [formData, setFormData] = useState({
    // PERSONAL
    firstName: "",
    lastName: "",
    fatherName: "",
    motherName: "",
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
    nationality: "Indian",
    category: "",
    religion: "",

    // CONTACT
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pinCode: "",
    guardianName: "",
    guardianPhone: "",
    relation: "",
    emergencyContact: "",

    // ACADEMIC
    studentClass: "",
    section: "",
    rollNumber: "",
    academicSession: "2024-25",
    feeCategory: "General",
    feeDiscount: 0,
    previousClass: "",
    previousSchool: "",

    // MEDICAL
    medicalConditions: "",
    allergies: "",
    specialNeeds: "",

    // ARRAYS
    documents: [],
    optionalServices: [],

    confirmationAccepted: false,
  });

  /* ================= PREFILL FOR EDIT ================= */

  useEffect(() => {
    if (editData) {
      setFormData({
        ...formData,
        ...editData,
        documents: editData.documents || [],
        optionalServices: editData.optionalServices || [],
        confirmationAccepted: false,
      });
      setStep(1);
    }
    // eslint-disable-next-line
  }, [editData]);

  /* ================= HANDLERS ================= */

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const handleArrayCheck = (name, value) => {
    setFormData((p) => ({
      ...p,
      [name]: p[name].includes(value)
        ? p[name].filter((v) => v !== value)
        : [...p[name], value],
    }));
  };

  /* ================= VALIDATION ================= */

  const validateStep = () => {
    if (step === 1)
      return (
        formData.firstName &&
        formData.fatherName &&
        formData.gender &&
        formData.dateOfBirth
      );

    if (step === 2)
      return (
        formData.phone &&
        formData.address &&
        formData.city &&
        formData.guardianPhone
      );

    if (step === 3) return formData.studentClass && formData.section;

    return true;
  };

  const nextStep = () => {
    if (!validateStep()) {
      alert("Please fill all required fields (*)");
      return;
    }
    setStep((p) => p + 1);
  };

  /* ================= SUBMIT (ADD / EDIT) ================= */

  const handleSubmit = async () => {
    if (!formData.confirmationAccepted) {
      alert("Please confirm all details");
      return;
    }

    try {
      const payload = {
        ...formData,
        schoolCode,
      };

      let res;

      if (editData) {
        // UPDATE
        res = await axios.put(
          `http://localhost:4000/api/students/update/${editData.id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // ADD
        res = await axios.post(
          "http://localhost:4000/api/students/add",
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      if (res.data.success) {
        alert(editData ? "Student Updated Successfully" : "Student Added Successfully");
        onClose();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Server Error");
    }
  };

  /* ================= REVIEW ROW ================= */

  const R = ({ l, v }) => (
    <p>
      <b>{l}:</b> {v || "-"}
    </p>
  );

  /* ================= UI ================= */

  return (
    <div className="modal-overlay">
      <div className="modal-container">

        <div className="modal-header">
          <h2>{editData ? "Edit Student" : "Add Student"}</h2>
          <button className="close-btn" onClick={onClose}>✖</button>
        </div>

        {/* ================= STEPPER ================= */}
        <div className="stepper">
          {[
            "Personal Information",
            "Contact Details",
            "Academic Information",
            "Additional Details",
            "Review & Submit",
          ].map((label, index) => (
            <div
              key={index}
              className={`step ${step === index + 1 ? "active" : ""}`}
            >
              <span>{index + 1}</span>
              <p>{label}</p>
            </div>
          ))}
        </div>

        {/* ================= STEP 1 ================= */}
        {step === 1 && (
          <div className="form-grid">
            <input name="firstName" placeholder="First Name*" value={formData.firstName} onChange={handleChange}/>
            <input name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange}/>
            <input name="fatherName" placeholder="Father Name*" value={formData.fatherName} onChange={handleChange}/>
            <input name="motherName" placeholder="Mother Name" value={formData.motherName} onChange={handleChange}/>
            <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange}/>
            <select name="gender" value={formData.gender} onChange={handleChange}>
              <option value="">Gender*</option>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
            <input name="bloodGroup" placeholder="Blood Group" value={formData.bloodGroup} onChange={handleChange}/>
            <input name="nationality" value={formData.nationality} onChange={handleChange}/>
            <input name="religion" placeholder="Religion" value={formData.religion} onChange={handleChange}/>
            <select name="category" value={formData.category} onChange={handleChange}>
              <option value="">Category</option>
              <option>General</option><option>OBC</option><option>SC</option><option>ST</option>
            </select>
          </div>
        )}

        {/* ================= STEP 2 ================= */}
        {step === 2 && (
          <div className="form-grid">
            <input name="phone" placeholder="Phone*" value={formData.phone} onChange={handleChange}/>
            <input name="email" placeholder="Email" value={formData.email} onChange={handleChange}/>
            <textarea className="full-width" name="address" placeholder="Address*" value={formData.address} onChange={handleChange}/>
            <input name="city" placeholder="City*" value={formData.city} onChange={handleChange}/>
            <input name="state" placeholder="State" value={formData.state} onChange={handleChange}/>
            <input name="pinCode" placeholder="PIN" value={formData.pinCode} onChange={handleChange}/>
            <input name="guardianName" placeholder="Guardian Name" value={formData.guardianName} onChange={handleChange}/>
            <input name="guardianPhone" placeholder="Guardian Phone*" value={formData.guardianPhone} onChange={handleChange}/>
            <input name="relation" placeholder="Relation" value={formData.relation} onChange={handleChange}/>
            <input name="emergencyContact" placeholder="Emergency Contact" value={formData.emergencyContact} onChange={handleChange}/>
          </div>
        )}

        {/* ================= STEP 3 ================= */}
        {step === 3 && (
          <div className="form-grid">
            <input name="studentClass" placeholder="Class*" value={formData.studentClass} onChange={handleChange}/>
            <input name="section" placeholder="Section*" value={formData.section} onChange={handleChange}/>
            <input name="rollNumber" placeholder="Roll Number" value={formData.rollNumber} onChange={handleChange}/>
            <input name="academicSession" value={formData.academicSession} onChange={handleChange}/>
            <input name="feeCategory" value={formData.feeCategory} onChange={handleChange}/>
            <input type="number" name="feeDiscount" value={formData.feeDiscount} onChange={handleChange}/>
            <input name="previousClass" placeholder="Previous Class" value={formData.previousClass} onChange={handleChange}/>
            <input name="previousSchool" placeholder="Previous School" value={formData.previousSchool} onChange={handleChange}/>
          </div>
        )}

        {/* ================= STEP 4 ================= */}
        {step === 4 && (
          <>
            <div className="form-grid">
              <textarea name="medicalConditions" placeholder="Medical Conditions" value={formData.medicalConditions} onChange={handleChange}/>
              <textarea name="allergies" placeholder="Allergies" value={formData.allergies} onChange={handleChange}/>
              <textarea name="specialNeeds" placeholder="Special Needs" value={formData.specialNeeds} onChange={handleChange}/>
            </div>

            <h4>Documents</h4>
            <div className="checkbox-grid">
              {["Birth Certificate","TC","Mark Sheet","Address Proof"].map(d=>(
                <label key={d}>
                  <input type="checkbox" checked={formData.documents.includes(d)}
                    onChange={()=>handleArrayCheck("documents",d)}/> {d}
                </label>
              ))}
            </div>

            <h4>Optional Services</h4>
            <div className="checkbox-grid">
              {["Transport","Hostel","Lunch","Coaching"].map(s=>(
                <label key={s}>
                  <input type="checkbox" checked={formData.optionalServices.includes(s)}
                    onChange={()=>handleArrayCheck("optionalServices",s)}/> {s}
                </label>
              ))}
            </div>
          </>
        )}

        {/* ================= STEP 5 ================= */}
        {step === 5 && (
          <div className="review-section">
            <R l="Name" v={`${formData.firstName} ${formData.lastName}`} />
            <R l="Father" v={formData.fatherName} />
            <R l="DOB" v={formData.dateOfBirth} />
            <R l="Gender" v={formData.gender} />
            <R l="Phone" v={formData.phone} />
            <R l="Address" v={`${formData.address}, ${formData.city}`} />
            <R l="Class" v={`${formData.studentClass}-${formData.section}`} />
            <R l="Fee Category" v={formData.feeCategory} />
            <R l="Documents" v={formData.documents.join(", ")} />

            <label className="final-confirm">
              <input type="checkbox" name="confirmationAccepted"
                checked={formData.confirmationAccepted}
                onChange={handleChange}/> I confirm all details are correct
            </label>
          </div>
        )}

        {/* ================= FOOTER ================= */}
        <div className="modal-footer">
          {step > 1 && <button onClick={() => setStep(step - 1)}>Back</button>}
          {step < 5 ? (
            <button className="primary" onClick={nextStep}>Next</button>
          ) : (
            <button className="primary" onClick={handleSubmit}>
              {editData ? "Update" : "Submit"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default AddStudentModal;
