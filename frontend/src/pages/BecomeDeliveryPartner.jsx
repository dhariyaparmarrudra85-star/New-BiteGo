import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function BecomeDeliveryPartner() {
  const { user, applyDelivery, register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    password: "",
    phone: user?.phone || "",
    dob: "1998-05-15",
    address: "",
    profilePhoto: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    vehicleType: "Bike",
    vehicleNumber: "",
    drivingLicenseNumber: "",
    drivingLicenseDoc: "",
    vehicleRCNumber: "",
    vehicleRCDoc: "",
    governmentId: "",
    govtIdDoc: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate motor vehicle driving licence rule
      if (
        (formData.vehicleType === "Bike" || formData.vehicleType === "Scooter") &&
        (!formData.drivingLicenseNumber || !formData.drivingLicenseNumber.trim())
      ) {
        throw new Error(
          "Valid Driving Licence number is required for motor vehicles (Bike / Scooter)."
        );
      }

      // If not logged in, create delivery partner user account first
      if (!user) {
        if (!formData.password || formData.password.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }

        await register({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          role: "delivery",
        });
      }

      // Submit application
      await applyDelivery({
        fullName: formData.fullName,
        phone: formData.phone,
        dob: formData.dob,
        address: formData.address,
        profilePhoto:
          formData.profilePhoto ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        vehicleType: formData.vehicleType,
        vehicleNumber: formData.vehicleNumber,
        drivingLicenseNumber: formData.drivingLicenseNumber,
        vehicleRCNumber: formData.vehicleRCNumber,
        governmentId: formData.governmentId,
        documents: [
          {
            name: "Government ID Proof",
            url: formData.govtIdDoc || "https://storage.bitego.com/docs/govt-id.pdf",
            documentType: "government_id",
          },
          ...(formData.vehicleType !== "Bicycle" && formData.drivingLicenseNumber
            ? [
                {
                  name: "Driving Licence",
                  url:
                    formData.drivingLicenseDoc ||
                    "https://storage.bitego.com/docs/driving-licence.pdf",
                  documentType: "driving_license",
                },
              ]
            : []),
          ...(formData.vehicleRCNumber
            ? [
                {
                  name: "Vehicle Registration Certificate (RC)",
                  url: formData.vehicleRCDoc || "https://storage.bitego.com/docs/vehicle-rc.pdf",
                  documentType: "vehicle_rc",
                },
              ]
            : []),
        ],
      });

      navigate("/verification-pending", { replace: true });
    } catch (err) {
      setError(err.message || "Failed to submit delivery partner application.");
    } finally {
      setLoading(false);
    }
  };

  const isBicycle = formData.vehicleType === "Bicycle";

  return (
    <div className="min-h-screen bg-surface py-10 px-4 sm:px-6 lg:px-8 selection:bg-primary selection:text-on-primary">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-tertiary to-tertiary-container flex items-center justify-center text-on-tertiary font-bold text-lg shadow-sm">
              ⚡
            </div>
            <span className="text-2xl font-black text-on-surface">
              Bite<span className="text-primary">Go</span> Fleet Partner Network
            </span>
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface mt-1">
            Deliver With BiteGo &amp; Earn Daily
          </h1>
          <p className="text-sm text-secondary max-w-xl mx-auto mt-2">
            Join 1,420+ active couriers across Ahmedabad. Flexible hours, EV charging incentives &amp; instant payouts.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-surface-container-lowest p-6 sm:p-10 rounded-3xl shadow-sm border border-surface-container-high/60">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-error-container text-on-error-container text-sm font-semibold flex items-center gap-2 border border-error/20">
              <span className="material-symbols-outlined text-[20px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Personal Information */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-tertiary flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[20px]">person</span>
                1. Personal Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Rajesh Vaghela"
                    className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-tertiary/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Primary Phone (WhatsApp enabled) *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98980 55667"
                    className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-tertiary/50"
                  />
                </div>

                {!user && (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="rajesh@example.com"
                        className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-tertiary/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                        Account Password *
                      </label>
                      <input
                        type="password"
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Create a strong password"
                        className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-tertiary/50"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="dob"
                    required
                    value={formData.dob}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-tertiary/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Government ID (Aadhaar / Voter ID) *
                  </label>
                  <input
                    type="text"
                    name="governmentId"
                    required
                    value={formData.governmentId}
                    onChange={handleChange}
                    placeholder="12-digit Aadhaar / ID number"
                    className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-tertiary/50"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Current Residential Address in Ahmedabad *
                  </label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Bodakdev Core / Vastrapur, Ahmedabad"
                    className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-tertiary/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleChange}
                    placeholder="e.g. Ramesh Vaghela (Father)"
                    className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-tertiary/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Emergency Contact Phone
                  </label>
                  <input
                    type="tel"
                    name="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={handleChange}
                    placeholder="+91 98980 11223"
                    className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-tertiary/50"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Profile Photo URL
                  </label>
                  <input
                    type="url"
                    name="profilePhoto"
                    value={formData.profilePhoto}
                    onChange={handleChange}
                    placeholder="https://images.unsplash.com/photo-1534528741775-53994a69daeb"
                    className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-tertiary/50 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 2. Vehicle & Licence Information */}
            <div className="pt-4 border-t border-surface-container-high/60">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[20px]">two_wheeler</span>
                2. Vehicle &amp; Driving Credentials
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Delivery Vehicle Type *
                  </label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-primary/50 font-bold"
                  >
                    <option value="Bike">Motorcycle / Bike (EV or Petrol)</option>
                    <option value="Scooter">Scooter / Chetak / Ather</option>
                    <option value="Bicycle">Bicycle / Cycle (No Licence Required)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Vehicle Number / Registration {isBicycle && "(Optional)"}
                  </label>
                  <input
                    type="text"
                    name="vehicleNumber"
                    value={formData.vehicleNumber}
                    onChange={handleChange}
                    placeholder="GJ-01-ET-4501"
                    className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-primary/50 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Driving Licence Number {isBicycle ? "(Not required for Bicycle)" : "*"}
                  </label>
                  <input
                    type="text"
                    name="drivingLicenseNumber"
                    required={!isBicycle}
                    disabled={isBicycle}
                    value={formData.drivingLicenseNumber}
                    onChange={handleChange}
                    placeholder={isBicycle ? "N/A for Bicycle delivery" : "GJ0120150049281"}
                    className={`w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm border font-mono ${
                      isBicycle
                        ? "opacity-50 cursor-not-allowed bg-slate-100"
                        : "border-surface-container-high focus:outline-none focus:border-primary/50 text-on-surface"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Vehicle Registration Certificate (RC) {isBicycle && "(Optional)"}
                  </label>
                  <input
                    type="text"
                    name="vehicleRCNumber"
                    value={formData.vehicleRCNumber}
                    onChange={handleChange}
                    placeholder="RC-GJ01-2022-881"
                    className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-primary/50 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 3. Verification Documents */}
            <div className="pt-4 border-t border-surface-container-high/60">
              <h3 className="text-sm font-bold uppercase tracking-wider text-tertiary flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[20px]">badge</span>
                3. Verification Documents
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Government ID Document URL (PDF / JPG)
                  </label>
                  <input
                    type="url"
                    name="govtIdDoc"
                    value={formData.govtIdDoc}
                    onChange={handleChange}
                    placeholder="https://storage.bitego.com/docs/aadhaar.pdf"
                    className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-tertiary/50 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Driving Licence Document URL {!isBicycle && "*"}
                  </label>
                  <input
                    type="url"
                    name="drivingLicenseDoc"
                    disabled={isBicycle}
                    value={formData.drivingLicenseDoc}
                    onChange={handleChange}
                    placeholder={
                      isBicycle
                        ? "Not required for Bicycle"
                        : "https://storage.bitego.com/docs/licence.pdf"
                    }
                    className={`w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm border font-mono text-xs ${
                      isBicycle
                        ? "opacity-50 cursor-not-allowed bg-slate-100"
                        : "border-surface-container-high focus:outline-none focus:border-tertiary/50 text-on-surface"
                    }`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Vehicle RC Document URL
                  </label>
                  <input
                    type="url"
                    name="vehicleRCDoc"
                    value={formData.vehicleRCDoc}
                    onChange={handleChange}
                    placeholder="https://storage.bitego.com/docs/vehicle-rc.pdf"
                    className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-tertiary/50 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-6 border-t border-surface-container-high/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-secondary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-tertiary">
                  bolt
                </span>
                <span>Includes ₹5,00,000 on-duty accident insurance coverage</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-tertiary hover:bg-tertiary-container text-on-tertiary font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span>Submit Fleet Partner Application</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
