import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function BecomeMerchant() {
  const { user, applyMerchant, register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    restaurantName: "",
    ownerName: user?.name || "",
    email: user?.email || "",
    password: "",
    phone: user?.phone || "",
    address: "",
    hub: "Bodakdev Hub",
    category: "Gourmet Dining & Snacks",
    description: "",
    photo: "",
    fssaiNumber: "",
    gstin: "",
    fssaiDoc: "",
    gstDoc: "",
    requestedCommission: 18.0,
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
      // If not logged in, create merchant account first
      if (!user) {
        if (!formData.password || formData.password.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }

        await register({
          name: formData.ownerName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          role: "merchant",
        });
      }

      // Submit merchant application
      await applyMerchant({
        restaurantName: formData.restaurantName,
        ownerName: formData.ownerName,
        phone: formData.phone,
        address: formData.address,
        hub: formData.hub,
        category: formData.category,
        description: formData.description,
        photo: formData.photo || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
        fssaiNumber: formData.fssaiNumber,
        gstin: formData.gstin,
        requestedCommission: Number(formData.requestedCommission),
        documents: [
          {
            name: "FSSAI License Document",
            url: formData.fssaiDoc || "https://images.unsplash.com/photo-1554415707-9e4466bfe0dc?auto=format&fit=crop&w=600&q=80",
            documentType: "fssai",
          },
          {
            name: "GST Registration Certificate",
            url: formData.gstDoc || "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80",
            documentType: "gst",
          },
        ],
      });

      navigate("/verification-pending", { replace: true });
    } catch (err) {
      setError(err.message || "Failed to submit merchant application.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface py-10 px-4 sm:px-6 lg:px-8 selection:bg-primary selection:text-on-primary">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-on-primary font-bold text-lg shadow-sm">
              B
            </div>
            <span className="text-2xl font-black text-on-surface">
              Bite<span className="text-primary">Go</span> Merchant Onboarding
            </span>
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface mt-1">
            Partner With Ahmedabad's Premier Food Network
          </h1>
          <p className="text-sm text-secondary max-w-xl mx-auto mt-2">
            Reach thousands of hungry patrons across Bodakdev, Vastrapur, Navrangpura &amp; SG Highway.
            Applications are reviewed within 4 hours.
          </p>
        </div>

        {/* Application Card */}
        <div className="bg-surface-container-lowest p-6 sm:p-10 rounded-3xl shadow-sm border border-surface-container-high/60">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-error-container text-on-error-container text-sm font-semibold flex items-center gap-2 border border-error/20">
              <span className="material-symbols-outlined text-[20px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Restaurant Profile */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[20px]">storefront</span>
                1. Restaurant Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Restaurant Brand Name *
                  </label>
                  <input
                    type="text"
                    name="restaurantName"
                    required
                    value={formData.restaurantName}
                    onChange={handleChange}
                    placeholder="e.g. The Dark Roast Pizzeria"
                    className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Owner / Representative Name *
                  </label>
                  <input
                    type="text"
                    name="ownerName"
                    required
                    value={formData.ownerName}
                    onChange={handleChange}
                    placeholder="Chef Vikram Patel"
                    className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 79 4002 9182"
                    className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-primary/50"
                  />
                </div>

                {!user && (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                        Business Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="contact@darkroast.com"
                        className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-primary/50"
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
                        className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-primary/50"
                      />
                    </div>
                  </>
                )}

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Outlet Physical Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Shop 14, Sindhu Bhavan Road, Bodakdev, Ahmedabad - 380054"
                    className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Operational Micro-Hub *
                  </label>
                  <select
                    name="hub"
                    value={formData.hub}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-primary/50"
                  >
                    <option value="Bodakdev Hub">Bodakdev Hub</option>
                    <option value="Vastrapur Lake Hub">Vastrapur Lake Hub</option>
                    <option value="Navrangpura Hub">Navrangpura Hub</option>
                    <option value="SG Highway Hub">SG Highway Hub</option>
                    <option value="C.G. Road Hub">C.G. Road Hub</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Cuisine / Food Category *
                  </label>
                  <input
                    type="text"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="e.g. Italian • Gourmet Pizza"
                    className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Restaurant Story / Description
                  </label>
                  <textarea
                    rows={2}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe your kitchen concept, signature culinary style, and specialty ingredients..."
                    className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Storefront / Hero Photo URL
                  </label>
                  <input
                    type="url"
                    name="photo"
                    value={formData.photo}
                    onChange={handleChange}
                    placeholder="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4"
                    className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-primary/50 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Statutory Compliance & Documents */}
            <div className="pt-4 border-t border-surface-container-high/60">
              <h3 className="text-sm font-bold uppercase tracking-wider text-tertiary flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[20px]">verified</span>
                2. Legal, Food Compliance &amp; Verification Documents
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    FSSAI 14-Digit License Number *
                  </label>
                  <input
                    type="text"
                    name="fssaiNumber"
                    required
                    value={formData.fssaiNumber}
                    onChange={handleChange}
                    placeholder="108230049281"
                    className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-primary/50 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    FSSAI License Document URL (PDF / JPG)
                  </label>
                  <input
                    type="url"
                    name="fssaiDoc"
                    value={formData.fssaiDoc}
                    onChange={handleChange}
                    placeholder="https://storage.bitego.com/docs/fssai-cert.pdf"
                    className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-primary/50 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    GSTIN Number (Optional)
                  </label>
                  <input
                    type="text"
                    name="gstin"
                    value={formData.gstin}
                    onChange={handleChange}
                    placeholder="24AAECB1029P1Z2"
                    className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-primary/50 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    GST Registration Document URL (Optional)
                  </label>
                  <input
                    type="url"
                    name="gstDoc"
                    value={formData.gstDoc}
                    onChange={handleChange}
                    placeholder="https://storage.bitego.com/docs/gst-certificate.pdf"
                    className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-primary/50 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Requested Commission Tier (%)
                  </label>
                  <select
                    name="requestedCommission"
                    value={formData.requestedCommission}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-primary/50"
                  >
                    <option value="16.0">16.0% (Tier-1 Preferred Partner)</option>
                    <option value="18.0">18.0% (Standard Commercial Tier)</option>
                    <option value="20.0">20.0% (High Support & Dedicated Account)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Bank Mandate
                  </label>
                  <div className="w-full px-4 py-2.5 bg-tertiary-fixed text-on-tertiary-fixed-variant rounded-xl text-sm font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">account_balance</span>
                    <span>RazorpayX Escrow Settlement Ready</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Actions */}
            <div className="pt-6 border-t border-surface-container-high/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-secondary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-tertiary">
                  security
                </span>
                <span>Protected by BiteGo Merchant Governance SLA</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    <span>Submit Merchant Application</span>
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
