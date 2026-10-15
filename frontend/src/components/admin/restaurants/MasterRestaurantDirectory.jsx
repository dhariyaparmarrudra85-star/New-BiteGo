import React, { useState, useEffect } from "react";
import api from "../../../services/api";

export default function MasterRestaurantDirectory({
  onOpenRateInspector,
  onActionToast,
  filterStatus,
  searchQuery,
}) {
  const [restaurants, setRestaurants] = useState([
    {
      id: "REST-0192",
      name: "The Dark Roast Pizzeria",
      emoji: "🍕",
      hub: "Bodakdev Hub",
      owner: "Chef Vikram Patel",
      phone: "+91 79 4002 9182",
      cuisinePrimary: "Neapolitan Pizzas",
      cuisineSecondary: "Artisanal Pastas",
      rating: "4.8",
      ordersWk: "1,280 orders/wk",
      fssaiBadge: "FSSAI Verified",
      fssaiMeta: "Exp: Dec 2026",
      commission: "18.0%",
      netWk: "₹68,450 net/wk",
      status: "online",
      statusLabel: "Online",
      isLive: true,
      isSuspended: false,
    },
    {
      id: "REST-0044",
      name: "Agashiye - House of MG",
      emoji: "🏛️",
      hub: "Lal Darwaja",
      owner: "Abhay Mangaldas",
      phone: "+91 79 2550 6555",
      cuisinePrimary: "Heritage Thali",
      cuisineSecondary: "Gujarati Fine Dine",
      rating: "4.9",
      ordersWk: "940 orders/wk",
      fssaiBadge: "Grade A+ Heritage",
      fssaiMeta: "FSSAI Certified",
      commission: "17.5%",
      netWk: "₹89,200 net/wk",
      status: "online",
      statusLabel: "Online",
      isLive: true,
      isSuspended: false,
    },
    {
      id: "REST-0312",
      name: "Gwalia Sweets & Street Food",
      emoji: "🥟",
      hub: "Vastrapur Lake",
      owner: "Suresh Sharma",
      phone: "+91 98 2519 2200",
      cuisinePrimary: "Chaat • Fafda",
      cuisineSecondary: "North Indian Sweets",
      rating: "4.7",
      ordersWk: "2,140 orders/wk",
      fssaiBadge: "FSSAI Verified",
      fssaiMeta: "Audit: Oct 2024",
      commission: "20.0%",
      netWk: "₹112,000 net/wk",
      status: "online",
      statusLabel: "Online",
      isLive: true,
      isSuspended: false,
    },
    {
      id: "REST-0589",
      name: "Behrouz Royal Biryani",
      emoji: "🍚",
      hub: "Bodakdev Cloud",
      owner: "Rebel Foods Cluster",
      phone: "+91 80 4710 8822",
      cuisinePrimary: "Mughlai Biryani",
      cuisineSecondary: "Kebabs • Desserts",
      rating: "4.5",
      ordersWk: "1,620 orders/wk",
      fssaiBadge: "Multi-Kitchen Pass",
      fssaiMeta: "ISO 22000 Cert",
      commission: "22.0%",
      netWk: "₹94,800 net/wk",
      status: "busy",
      statusLabel: "Busy (+15m)",
      isLive: true,
      isSuspended: false,
    },
    {
      id: "REST-0210",
      name: "Sasumaa Gujarati Thali",
      emoji: "🍲",
      hub: "C.G. Road Hub",
      owner: "Jayeshbhai Prajapati",
      phone: "+91 79 2640 1199",
      cuisinePrimary: "Unlimited Thali",
      cuisineSecondary: "Kathiyawadi Specials",
      rating: "4.9",
      ordersWk: "1,150 orders/wk",
      fssaiBadge: "FSSAI Verified",
      fssaiMeta: "Valid thru 2028",
      commission: "18.0%",
      netWk: "₹54,200 net/wk",
      status: "online",
      statusLabel: "Online",
      isLive: true,
      isSuspended: false,
    },
    {
      id: "REST-0701",
      name: "Wok in the Clouds",
      emoji: "🍜",
      hub: "Navrangpura",
      owner: "R. Fernandes",
      phone: "+91 79 4018 7720",
      cuisinePrimary: "Pan-Asian",
      cuisineSecondary: "Dim Sum • Hakka",
      rating: "3.6",
      ordersWk: "420 orders/wk",
      fssaiBadge: "Hygiene Audit Flag",
      fssaiMeta: "2 Consumer Complaints",
      commission: "20.0%",
      netWk: "Frozen",
      status: "suspended",
      statusLabel: "Suspended",
      isLive: false,
      isSuspended: true,
    },
  ]);

  const [activePage, setActivePage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchRealMerchants = async () => {
    try {
      const res = await api.get("/admin/merchants");
      if (res.data?.success && res.data.merchants?.length > 0) {
        const mapped = res.data.merchants.map((m) => ({
          id: m.restaurant?._id || m._id,
          merchantUserId: m._id,
          name: m.restaurant?.name || m.name,
          emoji: "🏪",
          hub: m.restaurant?.hub || "Ahmedabad Central",
          owner: m.name,
          phone: m.phone || "N/A",
          cuisinePrimary: m.restaurant?.cuisine?.[0] || "Fast Food",
          cuisineSecondary: m.restaurant?.cuisine?.[1] || "Beverages",
          rating: "4.8",
          ordersWk: "Active Outlet",
          fssaiBadge: "FSSAI Verified",
          fssaiMeta: "Audit Valid",
          commission: "18.0%",
          netWk: m.isActive ? "Settlement Healthy" : "Frozen",
          status: m.isActive ? (m.restaurant?.isOpen ? "online" : "paused") : "suspended",
          statusLabel: m.isActive ? (m.restaurant?.isOpen ? "Online" : "Paused") : "Suspended",
          isLive: m.isActive && (m.restaurant?.isOpen ?? true),
          isSuspended: !m.isActive,
        }));
        setRestaurants(mapped);
      }
    } catch (err) {
      console.error("Fetch merchants error:", err);
    }
  };

  useEffect(() => {
    fetchRealMerchants();
  }, []);

  const handleToggleLive = async (id) => {
    const r = restaurants.find((item) => item.id === id);
    if (!r) return;
    const targetUserId = r.merchantUserId || r.id;
    const nextActive = !r.isLive;
    try {
      await api.patch(`/admin/users/${targetUserId}/status`, { isActive: nextActive });
      if (onActionToast) {
        onActionToast(`${r.name} status updated to ${nextActive ? "Online" : "Paused / Suspended"}`);
      }
      fetchRealMerchants();
    } catch (err) {
      if (onActionToast) onActionToast("Failed to update status.");
    }
  };

  const handlePauseRestaurant = async (id, name) => {
    const r = restaurants.find((item) => item.id === id);
    if (!r) return;
    const targetUserId = r.merchantUserId || r.id;
    const nextActive = !r.isLive;
    try {
      await api.patch(`/admin/users/${targetUserId}/status`, { isActive: nextActive });
      if (onActionToast) {
        onActionToast(`${name} is now ${nextActive ? "Online" : "Paused / Suspended"}`);
      }
      fetchRealMerchants();
    } catch (err) {
      if (onActionToast) onActionToast("Failed to update status.");
    }
  };

  const handleReinstate = async (id, name) => {
    const r = restaurants.find((item) => item.id === id);
    const targetUserId = r?.merchantUserId || id;
    try {
      await api.patch(`/admin/users/${targetUserId}/status`, { isActive: true });
      if (onActionToast) {
        onActionToast(`${name} has been reinstated to Active.`);
      }
      fetchRealMerchants();
    } catch (err) {
      if (onActionToast) onActionToast("Failed to reinstate merchant.");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onActionToast) {
      onActionToast("Refreshing Master Restaurant Directory feed...");
    }
    await fetchRealMerchants();
    setIsRefreshing(false);
  };

  // Filter based on filterStatus and searchQuery
  const filteredRestaurants = restaurants.filter((r) => {
    // Status check
    if (filterStatus === "pending") return false; // None in directory, they are in urgent pipeline
    if (filterStatus === "active" && (!r.isLive || r.isSuspended)) return false;
    if (filterStatus === "paused" && (r.isLive || r.isSuspended)) return false;
    if (filterStatus === "suspended" && !r.isSuspended) return false;

    // Search query check
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.name.toLowerCase().includes(q);
      const matchId = r.id.toLowerCase().includes(q);
      const matchOwner = r.owner.toLowerCase().includes(q);
      const matchPhone = r.phone.toLowerCase().includes(q);
      const matchCuisine =
        r.cuisinePrimary.toLowerCase().includes(q) ||
        r.cuisineSecondary.toLowerCase().includes(q);
      return matchName || matchId || matchOwner || matchPhone || matchCuisine;
    }
    return true;
  });

  return (
    <section className="flex flex-col gap-space-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-xs">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight font-bold">
            Master Restaurant Directory
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Live feed of all licensed merchant outlets, revenue sharing tiers, and dispatch status.
          </p>
        </div>

        <div className="flex items-center gap-space-xs">
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            Showing {filteredRestaurants.length} of 842 records
          </span>
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-high transition-colors shadow-xs cursor-pointer border border-surface-container-high/40"
            title="Refresh Feed"
            type="button"
          >
            <span
              className={`material-symbols-outlined text-[18px] ${
                isRefreshing ? "animate-spin text-primary" : ""
              }`}
            >
              refresh
            </span>
          </button>
        </div>
      </div>

      {/* Data Table Container */}
      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container-high/40 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[960px]">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider h-11 border-b border-surface-container-high/60">
                <th className="py-2 px-space-md">Restaurant &amp; ID</th>
                <th className="py-2 px-space-md">Owner / Contact</th>
                <th className="py-2 px-space-md">Cuisine &amp; Category</th>
                <th className="py-2 px-space-md">Rating &amp; Volume</th>
                <th className="py-2 px-space-md">FSSAI / Hygiene</th>
                <th className="py-2 px-space-md">Commission %</th>
                <th className="py-2 px-space-md">Live Status</th>
                <th className="py-2 px-space-md text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm text-on-surface divide-y divide-surface-container-high/40">
              {filteredRestaurants.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-secondary">
                    No restaurant partners found matching current filter or search criteria.
                  </td>
                </tr>
              ) : (
                filteredRestaurants.map((r) => {
                  const isRowSuspended = r.isSuspended;

                  return (
                    <tr
                      key={r.id}
                      className={`transition-colors ${
                        isRowSuspended
                          ? "bg-error-container/10 hover:bg-error-container/20"
                          : "hover:bg-surface-container-low/60 bg-surface-container-lowest"
                      }`}
                    >
                      {/* 1. Restaurant & ID */}
                      <td className="py-space-sm px-space-md">
                        <div className="flex items-center gap-space-sm">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold font-headline-sm text-headline-sm shrink-0 ${
                              isRowSuspended
                                ? "bg-error-container text-on-error-container"
                                : r.emoji === "🏛️" || r.emoji === "🍲"
                                ? "bg-secondary-fixed text-on-secondary-fixed"
                                : "bg-primary-fixed text-on-primary-fixed"
                            }`}
                          >
                            {r.emoji}
                          </div>
                          <div className="min-w-0">
                            <p className="font-label-lg text-label-lg font-bold text-on-surface truncate">
                              {r.name}
                            </p>
                            <p className="font-label-sm text-label-sm text-on-surface-variant">
                              {r.hub} •{" "}
                              <span
                                className={`font-semibold ${
                                  isRowSuspended ? "text-error" : "text-primary"
                                }`}
                              >
                                #{r.id}
                              </span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 2. Owner / Contact */}
                      <td className="py-space-sm px-space-md">
                        <p className="font-label-md text-label-md font-semibold text-on-surface">
                          {r.owner}
                        </p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant font-tabular-nums text-tabular-nums">
                          {r.phone}
                        </p>
                      </td>

                      {/* 3. Cuisine & Category */}
                      <td className="py-space-sm px-space-md">
                        <span className="inline-block px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm">
                          {r.cuisinePrimary}
                        </span>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                          {r.cuisineSecondary}
                        </p>
                      </td>

                      {/* 4. Rating & Volume */}
                      <td className="py-space-sm px-space-md">
                        <div
                          className={`flex items-center gap-1 font-bold ${
                            isRowSuspended ? "text-error" : "text-on-surface"
                          }`}
                        >
                          <span className={isRowSuspended ? "text-error" : "text-primary"}>
                            ★
                          </span>
                          <span>{r.rating}</span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant font-tabular-nums text-tabular-nums">
                          {r.ordersWk}
                        </p>
                      </td>

                      {/* 5. FSSAI / Hygiene */}
                      <td className="py-space-sm px-space-md">
                        <div
                          className={`flex items-center gap-1 font-label-md text-label-md font-bold ${
                            isRowSuspended ? "text-error" : "text-tertiary"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {isRowSuspended ? "report_problem" : "verified"}
                          </span>
                          <span>{r.fssaiBadge}</span>
                        </div>
                        <p
                          className={`font-label-sm text-label-sm ${
                            isRowSuspended ? "text-error" : "text-on-surface-variant"
                          }`}
                        >
                          {r.fssaiMeta}
                        </p>
                      </td>

                      {/* 6. Commission % */}
                      <td className="py-space-sm px-space-md">
                        <p className="font-label-lg text-label-lg font-bold text-on-surface font-tabular-nums text-tabular-nums">
                          {r.commission}
                        </p>
                        <p
                          className={`font-body-sm text-body-sm font-tabular-nums text-tabular-nums ${
                            isRowSuspended
                              ? "text-on-surface-variant"
                              : "text-tertiary"
                          }`}
                        >
                          {r.netWk}
                        </p>
                      </td>

                      {/* 7. Live Status */}
                      <td className="py-space-sm px-space-md">
                        <div className="flex items-center gap-2">
                          {isRowSuspended ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-bold uppercase tracking-wider">
                              Suspended
                            </span>
                          ) : r.status === "busy" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm font-bold uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                              Busy (+15m)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-sm text-label-sm font-bold uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
                              Online
                            </span>
                          )}

                          {/* Toggle Switch */}
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              checked={r.isLive}
                              onChange={() => handleToggleLive(r.id)}
                              className="sr-only peer"
                              type="checkbox"
                            />
                            <div className="w-8 h-4 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-surface peer-checked:bg-tertiary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:rounded-full after:h-3 after:w-3 after:transition-all"></div>
                          </label>
                        </div>
                      </td>

                      {/* 8. Actions */}
                      <td className="py-space-sm px-space-md text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isRowSuspended ? (
                            <>
                              <button
                                onClick={() => handleReinstate(r.id, r.name)}
                                className="h-8 px-2.5 rounded-lg bg-surface-container-high hover:bg-tertiary hover:text-on-tertiary text-on-surface font-label-sm text-label-sm font-semibold transition-colors cursor-pointer"
                                type="button"
                              >
                                Reinstate
                              </button>
                              <button
                                onClick={() =>
                                  onActionToast &&
                                  onActionToast("Surprise health & hygiene inspection scheduled")
                                }
                                className="h-8 px-2.5 rounded-lg bg-error-container text-on-error-container hover:bg-error hover:text-on-error font-label-sm text-label-sm font-semibold transition-colors cursor-pointer"
                                title="Schedule Surprise Inspection"
                                type="button"
                              >
                                Inspect
                              </button>
                            </>
                          ) : r.status === "busy" ? (
                            <>
                              <button
                                onClick={() =>
                                  onActionToast &&
                                  onActionToast(`Opening menu for ${r.name}`)
                                }
                                className="h-8 px-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-sm text-label-sm font-semibold transition-colors cursor-pointer"
                                type="button"
                              >
                                Menu
                              </button>
                              <button
                                onClick={() =>
                                  onActionToast &&
                                  onActionToast("Incoming order throttle enabled.")
                                }
                                className="h-8 px-2.5 rounded-lg bg-primary-fixed hover:bg-primary hover:text-on-primary text-on-primary-fixed-variant font-label-sm text-label-sm font-semibold transition-colors cursor-pointer"
                                title="Throttle Incoming Influx"
                                type="button"
                              >
                                Throttle
                              </button>
                            </>
                          ) : r.name.includes("Agashiye") ||
                            r.name.includes("Gwalia") ? (
                            <>
                              <button
                                onClick={() =>
                                  onActionToast &&
                                  onActionToast(`Opening menu for ${r.name}`)
                                }
                                className="h-8 px-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-sm text-label-sm font-semibold transition-colors cursor-pointer"
                                type="button"
                              >
                                Menu
                              </button>
                              <button
                                onClick={() =>
                                  handlePauseRestaurant(r.id, r.name)
                                }
                                className="h-8 px-2.5 rounded-lg bg-surface-container-high hover:bg-error hover:text-on-error text-on-surface font-label-sm text-label-sm font-semibold transition-colors cursor-pointer"
                                type="button"
                              >
                                Pause
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() =>
                                  onActionToast &&
                                  onActionToast(`Opening menu for ${r.name}`)
                                }
                                className="h-8 px-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-sm text-label-sm font-semibold transition-colors cursor-pointer"
                                type="button"
                              >
                                Menu
                              </button>
                              <button
                                onClick={() => onOpenRateInspector(r)}
                                className="h-8 px-2.5 rounded-lg bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface font-label-sm text-label-sm font-semibold transition-colors cursor-pointer"
                                title="Adjust Payout Rate"
                                type="button"
                              >
                                Rate
                              </button>
                            </>
                          )}

                          <button
                            onClick={() =>
                              onActionToast &&
                              onActionToast(`Options drawer opened for ${r.name}`)
                            }
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high cursor-pointer"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              more_vert
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="p-space-md bg-surface-container-lowest flex flex-col sm:flex-row items-center justify-between gap-space-sm border-t border-surface-container-high/40">
          <div className="font-body-sm text-body-sm text-on-surface-variant">
            Showing <span className="font-semibold text-on-surface">1 - 6</span> of{" "}
            <span className="font-semibold text-on-surface">842</span> registered
            merchant locations
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActivePage((p) => Math.max(1, p - 1))}
              disabled={activePage === 1}
              className="h-9 px-3 rounded-lg bg-surface-container-low text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-high disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              type="button"
            >
              Previous
            </button>
            <button
              onClick={() => setActivePage(1)}
              className={`h-9 w-9 rounded-lg font-label-md text-label-md font-bold cursor-pointer transition-colors ${
                activePage === 1
                  ? "bg-primary text-on-primary shadow-xs"
                  : "bg-surface-container-low hover:bg-surface-container-high text-on-surface"
              }`}
              type="button"
            >
              1
            </button>
            <button
              onClick={() => setActivePage(2)}
              className={`h-9 w-9 rounded-lg font-label-md text-label-md cursor-pointer transition-colors ${
                activePage === 2
                  ? "bg-primary text-on-primary shadow-xs font-bold"
                  : "bg-surface-container-low hover:bg-surface-container-high text-on-surface"
              }`}
              type="button"
            >
              2
            </button>
            <button
              onClick={() => setActivePage(3)}
              className={`h-9 w-9 rounded-lg font-label-md text-label-md cursor-pointer transition-colors ${
                activePage === 3
                  ? "bg-primary text-on-primary shadow-xs font-bold"
                  : "bg-surface-container-low hover:bg-surface-container-high text-on-surface"
              }`}
              type="button"
            >
              3
            </button>
            <span className="px-1 text-on-surface-variant">•••</span>
            <button
              onClick={() => setActivePage(141)}
              className={`h-9 w-9 rounded-lg font-label-md text-label-md cursor-pointer transition-colors ${
                activePage === 141
                  ? "bg-primary text-on-primary shadow-xs font-bold"
                  : "bg-surface-container-low hover:bg-surface-container-high text-on-surface"
              }`}
              type="button"
            >
              141
            </button>
            <button
              onClick={() => setActivePage((p) => Math.min(141, p + 1))}
              className="h-9 px-3 rounded-lg bg-surface-container-low text-on-surface font-label-md text-label-md hover:bg-surface-container-high cursor-pointer transition-colors"
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
