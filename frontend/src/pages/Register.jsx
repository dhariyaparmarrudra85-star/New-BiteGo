import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, getRedirectPathForUser } from "../context/AuthContext";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register({
        name,
        email,
        password,
        phone,
        role: "customer",
      });
      navigate("/login", { state: { message: "Registration successful. Please login with your new account." }, replace: true });
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-primary selection:text-on-primary">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-2">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary to-primary-container flex items-center justify-center text-on-primary font-bold text-xl shadow-md">
            🔥
          </div>
          <span className="text-3xl font-black tracking-tight text-on-surface">
            Bite<span className="text-primary">Go</span>
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-on-surface mt-2">
          Create Customer Account
        </h2>
        <p className="text-sm text-secondary mt-1">
          Enjoy Ahmedabad's fastest 24-minute food delivery
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-surface-container-lowest py-8 px-6 sm:px-10 shadow-sm rounded-2xl border border-surface-container-high/60">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-error-container text-on-error-container text-sm font-semibold flex items-center gap-2 border border-error/20">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ananya Sharma"
                className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-primary/50 focus:bg-surface-container-lowest transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ananya@example.com"
                className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-primary/50 focus:bg-surface-container-lowest transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-primary/50 focus:bg-surface-container-lowest transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-sm text-on-surface border border-surface-container-high focus:outline-none focus:border-primary/50 focus:bg-surface-container-lowest transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Register Account</span>
              )}
            </button>
          </form>

          {/* Business & Fleet Onboarding Banners */}
          <div className="mt-8 pt-6 border-t border-surface-container-high/60 space-y-3">
            <Link
              to="/become-merchant"
              className="block p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all border border-surface-container-high/40 group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                    🍕 Want to list your restaurant?
                  </h4>
                  <p className="text-[11px] text-secondary mt-0.5">
                    Submit merchant application &amp; start receiving orders
                  </p>
                </div>
                <span className="material-symbols-outlined text-[18px] text-primary">
                  chevron_right
                </span>
              </div>
            </Link>

            <Link
              to="/become-delivery-partner"
              className="block p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all border border-surface-container-high/40 group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-on-surface group-hover:text-tertiary transition-colors">
                    🛵 Want to deliver with BiteGo?
                  </h4>
                  <p className="text-[11px] text-secondary mt-0.5">
                    Apply as a fleet partner with daily payouts
                  </p>
                </div>
                <span className="material-symbols-outlined text-[18px] text-tertiary">
                  chevron_right
                </span>
              </div>
            </Link>
          </div>

          <div className="mt-6 text-center text-xs text-secondary">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-primary hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
