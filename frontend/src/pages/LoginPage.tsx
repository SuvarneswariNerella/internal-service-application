import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/api/auth";
import { loginSchema, type LoginInput } from "@/validations/auth";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setError("");
    setIsLoading(true);
    try {
      const res = await authApi.login(data.email, data.password);
      if (res.data.success && res.data.data) {
        const { user, accessToken, refreshToken } = res.data.data;
        setAuth(user, accessToken, refreshToken);
        navigate("/");
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Login failed. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">IO</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">IOMS</h1>
          <p className="text-gray-500 mt-1">Internal Operations Management</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Sign in</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="admin@expinova.io"
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              error={errors.password?.message}
              {...register("password")}
            />
            <Button type="submit" isLoading={isLoading} className="w-full">
              Sign in
            </Button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Default Demo Accounts</span>
              <span className="text-[11px] font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">password: password123</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: "Admin", email: "admin@expinova.io" },
                { label: "Project Mgr", email: "pm@expinova.io" },
                { label: "Developer", email: "dev@expinova.io" },
                { label: "Accounts", email: "accounts@expinova.io" },
              ].map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setValue("email", acc.email);
                    setValue("password", "password123");
                  }}
                  className="px-2.5 py-1.5 text-xs text-left font-medium text-gray-700 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-gray-200 rounded-lg transition-colors flex items-center justify-between"
                >
                  <span>{acc.label}</span>
                  <span className="text-[10px] text-gray-400 font-mono">Fill</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
