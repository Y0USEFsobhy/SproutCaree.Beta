import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router";
import { login } from "../../features/auth/authSlice";
import { login as loginApi } from "../../services/api";

const roleRoutes = {
  // super_admin: "/admin",
  admin: "/admin",
  teacher: "/teacher",
  parent: "/parent",
  // user: "/user",
};

const demoAccounts = [
  { role: "Admin", email: import.meta.env.VITE_DEMO_ADMIN_EMAIL },
  { role: "Teacher", email: import.meta.env.VITE_DEMO_TEACHER_EMAIL },
  { role: "Parent", email: import.meta.env.VITE_DEMO_PARENT_EMAIL },
];
const demoPassword = import.meta.env.VITE_DEMO_PASSWORD;

const fieldClass =
  "min-h-11 w-full rounded-xl border border-[#e8e0d4] bg-white px-4 text-sm text-[#262723] placeholder:text-[#9a9d97] focus:border-brand focus:outline-none focus:ring-2 focus:ring-[#1f7a4d]/30 disabled:bg-[#f5f1ea] disabled:text-[#7a7d77]";

const labelClass = "mb-1 block text-sm font-semibold text-[#262723]";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoRole, setDemoRole] = useState(null);

  if (isAuthenticated && user) {
    const destination = roleRoutes[user.role] ?? "/unauthorized";
    return <Navigate to={destination} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userData = await loginApi(email, password);
      dispatch(login(userData));

      const destination = roleRoutes[userData.role];

      if (!destination) {
        setError("Invalid user role");
        return;
      }

      navigate(destination, { replace: true });
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (account) => {
    setError("");
    setDemoRole(account.role);

    try {
      const userData = await loginApi(account.email, demoPassword);
      dispatch(login(userData));

      const destination = roleRoutes[userData.role];
      if (!destination) {
        setError("Invalid user role");
        return;
      }

      navigate(destination, { replace: true });
    } catch {
      setError("Could not start the demo. Please try again.");
    } finally {
      setDemoRole(null);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f1ea] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-[#e8e0d4] bg-white p-8 shadow-xl sm:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#1f7a4d]/10">
            <img className="scale-150" src="logo.png" alt="logo" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[#262723]">
            Welcome Back
          </h1>

          <p className="mt-2 text-sm text-[#7a7d77]">
            Enter your details to sign in to your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <div>
            <label htmlFor="email" className={labelClass}>
              Email Address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@nursery.com"
              autoComplete="email"
              required
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="password" className={labelClass}>
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                className={`${fieldClass} pr-20`}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-4 text-sm font-semibold text-[#7a7d77] transition hover:text-[#1f7a4d]"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-brand px-4 py-3 font-semibold text-white transition hover:bg-[#17633d] focus:outline-none focus:ring-2 focus:ring-[#1f7a4d]/40 focus:ring-offset-2 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-8 border-t border-[#e8e0d4] pt-6">
          <h2 className="text-sm font-semibold text-[#262723]">
            Just exploring?
          </h2>
          <p className="mt-1 text-xs text-[#555C57]">
            Try the app instantly as any role. No sign-up needed.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {demoAccounts.map((account) => (
              <button
                key={account.role}
                type="button"
                onClick={() => handleDemo(account)}
                disabled={loading || demoRole !== null}
                className="min-h-11 rounded-full bg-[#e3f2ea] px-3 text-sm font-semibold text-brand transition hover:bg-[#d3ebdf] focus:outline-none focus:ring-2 focus:ring-[#1f7a4d]/40 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {demoRole === account.role ? "Opening..." : account.role}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
