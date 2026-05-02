import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';
import toast from 'react-hot-toast';
import { ShoppingCart, Lock, Mail, Loader2, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(username, password);
      toast.success('Login berhasil!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Login gagal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />

      <div className="relative w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl shadow-indigo-500/30 mb-4">
            <ShoppingCart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">POS System</h1>
          <p className="text-slate-500 mt-2">Sign in to your account</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/60 p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Username
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="Enter your username"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm text-slate-600">Remember me</span>
              </label>
              <a href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-500">Demo Accounts</span>
            </div>
          </div>

          {/* Demo Accounts */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setUsername('admin'); setPassword('admin123'); }}
              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all group"
            >
              <p className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">Admin</p>
              <p className="text-xs text-slate-500">admin / admin123</p>
            </button>
            <button
              onClick={() => { setUsername('cashier'); setPassword('cashier123'); }}
              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all group"
            >
              <p className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">Cashier</p>
              <p className="text-xs text-slate-500">cashier / cashier123</p>
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 mt-8">
          By signing in, you agree to our{' '}
          <a href="#" className="font-medium text-indigo-600 hover:text-indigo-700">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="font-medium text-indigo-600 hover:text-indigo-700">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
