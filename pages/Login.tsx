
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Activity, Mail, Lock, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hardcoded administrative credentials
  const ADMIN_EMAIL = 'admin@medisync.com';
  const ADMIN_PASSWORD = 'admin@medisync';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. First, check the local hardcoded credentials
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      setError("Incorrect email or password for administrator access.");
      setLoading(false);
      return;
    }

    // 2. Then, attempt to authenticate with Supabase Auth
    // NOTE: The user 'admin@medisync.com' must be manually created in your Supabase Auth dashboard!
    const { error: authError, data } = await supabase.auth.signInWithPassword({ email, password });
    
    if (authError) {
      console.error('Supabase Auth Error:', authError);
      // Helpful error for developers if they forgot to create the user in Supabase
      if (authError.message.includes("Invalid login credentials")) {
        setError("Admin verified locally, but this user does not exist in Supabase Auth. Please create user 'admin@medisync.com' in your Supabase project's Authentication tab.");
      } else {
        setError(authError.message);
      }
    } else {
      console.log('Login successful!', data.session);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 mb-4">
            <Activity className="text-white w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome to Medisync</h2>
          <p className="text-slate-500 mt-2">Hospital Administration Portal</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all outline-none"
                  placeholder="hospital@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all outline-none"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium animate-in slide-in-from-top-2">
                <div className="flex items-start">
                  <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-100 transition-all transform active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Validating Connection...' : 'Sign In to Dashboard'}
            </button>
          </form>
        </div>
        
        <p className="text-center mt-8 text-slate-400 text-sm italic">
          Authorized personnel only. Secure tunnel established.
        </p>
      </div>
    </div>
  );
};

export default Login;
