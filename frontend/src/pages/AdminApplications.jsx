import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminHeader from "../components/admin/AdminHeader";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../services/api";

export default function AdminApplications() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState("merchants"); // 'merchants' | 'delivery'
  const [statusFilter, setStatusFilter] = useState("all");

  const [merchantApps, setMerchantApps] = useState([]);
  const [deliveryApps, setDeliveryApps] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedItem, setSelectedItem] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [toastMessage, setToastMessage] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch applications
  const fetchApplications = async () => {
    setLoading(true);
    const activeToken = token || localStorage.getItem("bitego_token");

    try {
      const [resMerchants, resDelivery] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/merchant-applications`, {
          headers: { Authorization: `Bearer ${activeToken}` },
        }),
        fetch(`${API_BASE_URL}/admin/delivery-applications`, {
          headers: { Authorization: `Bearer ${activeToken}` },
        }),
      ]);

      const dataMerchants = await resMerchants.json();
      const dataDelivery = await resDelivery.json();

      if (dataMerchants.success) setMerchantApps(dataMerchants.applications || []);
      if (dataDelivery.success) setDeliveryApps(dataDelivery.applications || []);
    } catch (err) {
      console.error("Fetch applications error:", err);
      showToast("Error connecting to applications service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // Approve action
  const handleApprove = async (id, type) => {
    setActionLoading(true);
    const activeToken = token || localStorage.getItem("bitego_token");
    const endpoint =
      type === "merchant"
        ? `${API_BASE_URL}/admin/merchants/${id}/approve`
        : `${API_BASE_URL}/admin/delivery/${id}/approve`;

    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
      });

      const data = await response.json();
      if (response.ok && data.success) {
        showToast(data.message || "Application approved successfully!");
        fetchApplications();
      } else {
        showToast(data.message || "Approval failed.");
      }
    } catch (err) {
      showToast("Error processing approval.");
    } finally {
      setActionLoading(false);
    }
  };

  // Reject action
  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      showToast("Please provide a rejection reason.");
      return;
    }

    setActionLoading(true);
    const activeToken = token || localStorage.getItem("bitego_token");
    const endpoint =
      activeTab === "merchants"
        ? `${API_BASE_URL}/admin/merchants/${selectedItem._id}/reject`
        : `${API_BASE_URL}/admin/delivery/${selectedItem._id}/reject`;

    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        showToast(data.message || "Application rejected with reason.");
        setIsRejectModalOpen(false);
        setRejectionReason("");
        setSelectedItem(null);
        fetchApplications();
      } else {
        showToast(data.message || "Rejection failed.");
      }
    } catch (err) {
      showToast("Error processing rejection.");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter lists
  const currentList = activeTab === "merchants" ? merchantApps : deliveryApps;
  const filteredList = currentList.filter((item) => {
    if (statusFilter === "all") return true;
    return item.status === statusFilter;
  });

  const pendingMerchantCount = merchantApps.filter((m) => m.status === "pending").length;
  const pendingDeliveryCount = deliveryApps.filter((d) => d.status === "pending").length;

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen selection:bg-primary selection:text-on-primary">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-xl shadow-lg border border-surface-container-high/40 animate-fade-in transition-all">
          <span className="material-symbols-outlined text-[20px] text-primary-fixed">
            info
          </span>
          <span className="font-label-md text-label-md font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-inverse-on-surface/70 hover:text-inverse-on-surface ml-2 p-0.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Sidebar */}
      <AdminSidebar
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        onActionToast={showToast}
        activeNav="restaurants"
      />

      {/* Main Container */}
      <div className="pl-0 lg:pl-72 min-h-screen flex flex-col bg-surface">
        <AdminHeader
          onToggleMobileMenu={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          onActionToast={showToast}
        />

        <main className="w-full pt-16 bg-surface px-space-lg py-space-lg flex-1">
          <div className="flex flex-col w-full gap-space-lg pb-space-2xl">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider font-bold mb-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-primary" />
                  Operational Governance Desk
                </div>
                <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
                  Partner Applications &amp; Verification Desk
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-4xl mt-1">
                  Inspect legal credentials, FSSAI compliance, Driving Licences &amp; vehicle documents for merchant kitchens and delivery fleets.
                </p>
              </div>

              <button
                onClick={fetchApplications}
                className="self-start lg:self-center h-11 px-4 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-[18px]">sync</span>
                <span>Refresh Queue</span>
              </button>
            </div>

            {/* Application Category Segmented Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-2 bg-surface-container-lowest rounded-2xl border border-surface-container-high/40 shadow-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("merchants")}
                  className={`px-5 py-2.5 rounded-xl font-label-md text-label-md font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === "merchants"
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-surface-container-low text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">storefront</span>
                  <span>Merchant Applications</span>
                  {pendingMerchantCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-[11px] font-black">
                      {pendingMerchantCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("delivery")}
                  className={`px-5 py-2.5 rounded-xl font-label-md text-label-md font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === "delivery"
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-surface-container-low text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">two_wheeler</span>
                  <span>Delivery Fleet Applications</span>
                  {pendingDeliveryCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant text-[11px] font-black">
                      {pendingDeliveryCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 p-1 bg-surface-container-low rounded-xl">
                {["all", "pending", "approved", "rejected"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                      statusFilter === st
                        ? "bg-surface-container-lowest text-on-surface shadow-xs"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Applications Table Card */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-xs border border-surface-container-high/40 overflow-hidden">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider h-11 border-b border-surface-container-high/60">
                      <th className="py-2 px-4">Applicant / Entity</th>
                      <th className="py-2 px-4">Contact &amp; Hub</th>
                      {activeTab === "merchants" ? (
                        <>
                          <th className="py-2 px-4">FSSAI &amp; GSTIN</th>
                          <th className="py-2 px-4">Category &amp; Comm.</th>
                        </>
                      ) : (
                        <>
                          <th className="py-2 px-4">Vehicle &amp; Type</th>
                          <th className="py-2 px-4">Driving Licence &amp; RC</th>
                        </>
                      )}
                      <th className="py-2 px-4">Status</th>
                      <th className="py-2 px-4 text-right">Verification Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high/40 text-sm">
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-secondary">
                          <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                          Loading verification applications...
                        </td>
                      </tr>
                    ) : filteredList.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-secondary">
                          No {activeTab} applications found matching the current status filter.
                        </td>
                      </tr>
                    ) : (
                      filteredList.map((item) => {
                        const isMerchant = activeTab === "merchants";
                        const title = isMerchant ? item.restaurantName : item.fullName;
                        const subtitle = isMerchant ? item.ownerName : `DOB: ${item.dob || "N/A"}`;
                        const phone = item.phone;
                        const email = item.email;

                        return (
                          <tr key={item._id} className="hover:bg-surface-container-low/50 transition-colors">
                            {/* Entity */}
                            <td className="py-3 px-4">
                              <div className="font-bold text-on-surface">{title}</div>
                              <div className="text-xs text-secondary">{subtitle}</div>
                              <div className="text-[11px] text-on-surface-variant font-mono mt-0.5">
                                App #{item._id.slice(-6).toUpperCase()}
                              </div>
                            </td>

                            {/* Contact & Hub */}
                            <td className="py-3 px-4">
                              <div className="text-on-surface font-medium">{phone}</div>
                              <div className="text-xs text-secondary truncate max-w-[180px]">{email}</div>
                              <div className="text-xs font-semibold text-primary">
                                {item.hub || item.address}
                              </div>
                            </td>

                            {/* Dynamic Details Column 1 */}
                            {isMerchant ? (
                              <td className="py-3 px-4">
                                <div className="font-mono text-xs font-bold text-on-surface">
                                  FSSAI: {item.fssaiNumber}
                                </div>
                                <div className="text-xs text-secondary font-mono">
                                  GSTIN: {item.gstin || "Not provided"}
                                </div>
                              </td>
                            ) : (
                              <td className="py-3 px-4">
                                <span className="inline-block px-2.5 py-0.5 rounded-full bg-surface-container-high font-bold text-xs">
                                  {item.vehicleType}
                                </span>
                                <div className="font-mono text-xs text-secondary mt-1">
                                  {item.vehicleNumber || "No registration required"}
                                </div>
                              </td>
                            )}

                            {/* Dynamic Details Column 2 */}
                            {isMerchant ? (
                              <td className="py-3 px-4">
                                <div className="font-semibold text-xs text-on-surface">
                                  {item.category}
                                </div>
                                <div className="text-xs text-tertiary font-bold">
                                  Tier: {item.requestedCommission || 18.0}%
                                </div>
                              </td>
                            ) : (
                              <td className="py-3 px-4">
                                <div className="font-mono text-xs font-bold text-on-surface">
                                  DL: {item.drivingLicenseNumber || "Bicycle (Exempt)"}
                                </div>
                                <div className="text-xs text-secondary font-mono">
                                  RC: {item.vehicleRCNumber || "N/A"}
                                </div>
                              </td>
                            )}

                            {/* Status */}
                            <td className="py-3 px-4">
                              {item.status === "approved" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant text-xs font-bold uppercase">
                                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                                  Approved
                                </span>
                              ) : item.status === "rejected" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container text-xs font-bold uppercase">
                                  Rejected
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                  Pending
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedItem(item);
                                    setIsViewModalOpen(true);
                                  }}
                                  className="h-8 px-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-xs transition-colors cursor-pointer"
                                  title="View Full Application"
                                >
                                  View
                                </button>

                                {item.status === "pending" && (
                                  <>
                                    <button
                                      disabled={actionLoading}
                                      onClick={() =>
                                        handleApprove(
                                          item._id,
                                          isMerchant ? "merchant" : "delivery"
                                        )
                                      }
                                      className="h-8 px-3 rounded-lg bg-tertiary hover:bg-tertiary-container text-on-tertiary font-bold text-xs transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
                                    >
                                      Approve
                                    </button>

                                    <button
                                      onClick={() => {
                                        setSelectedItem(item);
                                        setRejectionReason("");
                                        setIsRejectModalOpen(true);
                                      }}
                                      className="h-8 px-3 rounded-lg bg-error-container hover:bg-error hover:text-on-error text-on-error-container font-bold text-xs transition-colors cursor-pointer"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* View Details Modal */}
      {isViewModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-surface-container-lowest max-w-lg w-full rounded-2xl shadow-xl p-6 border border-surface-container-high">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
              <h3 className="font-bold text-base text-on-surface">
                Application Review: #{selectedItem._id.slice(-6).toUpperCase()}
              </h3>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-1 rounded-lg hover:bg-surface-container text-secondary cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-bold text-secondary uppercase text-[10px]">Title / Name</span>
                  <p className="font-semibold text-sm text-on-surface">
                    {selectedItem.restaurantName || selectedItem.fullName}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-secondary uppercase text-[10px]">Contact</span>
                  <p className="font-semibold text-sm text-on-surface">{selectedItem.phone}</p>
                </div>
              </div>

              <div>
                <span className="font-bold text-secondary uppercase text-[10px]">Email</span>
                <p className="font-mono text-on-surface">{selectedItem.email}</p>
              </div>

              <div>
                <span className="font-bold text-secondary uppercase text-[10px]">Address</span>
                <p className="text-on-surface">{selectedItem.address}</p>
              </div>

              {selectedItem.fssaiNumber && (
                <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high/60 space-y-1">
                  <div className="font-bold text-tertiary">FSSAI Licence: {selectedItem.fssaiNumber}</div>
                  <div className="text-secondary font-mono">GSTIN: {selectedItem.gstin || "Not provided"}</div>
                  <div className="text-secondary">Category: {selectedItem.category}</div>
                </div>
              )}

              {selectedItem.vehicleType && (
                <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">Vehicle: {selectedItem.vehicleType}</span>
                    <span className="font-mono text-xs font-bold text-on-surface bg-surface-container px-2 py-0.5 rounded">
                      Reg: {selectedItem.vehicleNumber || "N/A"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-secondary block font-medium">Date of Birth:</span>
                      <span className="font-semibold text-on-surface">{selectedItem.dob || "Not specified"}</span>
                    </div>
                    <div>
                      <span className="text-secondary block font-medium">Emergency Contact:</span>
                      <span className="font-semibold text-on-surface">
                        {selectedItem.emergencyContactName ? `${selectedItem.emergencyContactName} (${selectedItem.emergencyContactPhone})` : "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="text-secondary font-mono text-xs pt-1 border-t border-surface-container-high/40">
                    <div>Driving Licence: {selectedItem.drivingLicenseNumber || "Bicycle Exempt"}</div>
                    <div>RC Number: {selectedItem.vehicleRCNumber || "N/A"}</div>
                    <div>Govt ID / Aadhaar: {selectedItem.governmentId || "N/A"}</div>
                  </div>

                  {selectedItem.documents && selectedItem.documents.length > 0 && (
                    <div className="pt-2 border-t border-surface-container-high/40">
                      <span className="text-xs font-bold text-on-surface block mb-1">Attached Verification Documents:</span>
                      <div className="space-y-1">
                        {selectedItem.documents.map((doc, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-surface-container-lowest p-1.5 px-2.5 rounded-lg text-xs">
                            <span className="font-medium text-on-surface">{doc.name || doc.documentType}</span>
                            {doc.url ? (
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary font-bold hover:underline flex items-center gap-1"
                              >
                                View Doc <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                              </a>
                            ) : (
                              <span className="text-secondary italic">No link</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedItem.profilePhoto && (
                    <div className="pt-2 border-t border-surface-container-high/40 flex items-center gap-3">
                      <img
                        src={selectedItem.profilePhoto}
                        alt="Partner Profile"
                        className="w-12 h-12 rounded-full object-cover border border-slate-300"
                      />
                      <div className="text-xs">
                        <span className="font-bold block text-on-surface">Partner Photo</span>
                        <a href={selectedItem.profilePhoto} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          Open Full Image
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedItem.rejectionReason && (
                <div className="p-3 rounded-xl bg-error-container/20 border border-error-container text-error">
                  <span className="font-bold block">Rejection Feedback:</span>
                  {selectedItem.rejectionReason}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-surface-container-high flex justify-end gap-2">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-surface-container-lowest max-w-md w-full rounded-2xl shadow-xl p-6 border border-error-container">
            <h3 className="font-bold text-base text-error flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">cancel</span>
              Reject Application
            </h3>
            <p className="text-xs text-secondary mt-1">
              Please specify why this application does not meet compliance requirements. The reason will be communicated to the applicant.
            </p>

            <textarea
              rows="3"
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. FSSAI registration document unreadable or expired. Please upload valid certificate."
              className="w-full mt-3 p-3 bg-surface-container-low rounded-xl text-xs text-on-surface border border-surface-container-high focus:outline-none focus:border-error"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-error hover:bg-error/90 text-on-error font-bold text-xs cursor-pointer disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
