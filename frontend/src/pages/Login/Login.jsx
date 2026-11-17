import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { Eye, EyeOff, Contrast, LogIn } from "lucide-react";
import pmiLogo from "@/assets/pmi-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useAccessibility } from "@/hooks/useAccessibility";
import ThemeToggle from "@/components/ThemeToggle";
import API, { getErrorMessage } from "@/api";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    toggleHighContrast,
  } = useAccessibility();

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await API.post("/auth/login", { email, password });

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        if (response.data.refreshToken) {
          localStorage.setItem("refreshToken", response.data.refreshToken);
        }
        localStorage.setItem("user", JSON.stringify(response.data.user));

        navigate("/dashboard");
      }
    } catch (err) {
      const errorMsg = getErrorMessage(err, "Login failed. Please try again.");
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Google login handler
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        setError('');

        // First, get the user info to ensure we have a valid token
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then(res => res.json());

        if (!userInfo || userInfo.error) {
          throw new Error('Failed to fetch user info from Google');
        }

        // Send the ID token to your backend for verification
        const response = await API.post("/auth/google", {
          token: tokenResponse.id_token || tokenResponse.access_token
        });

        if (response.data.token) {
          // Store the tokens and user data
          localStorage.setItem("token", response.data.token);
          if (response.data.refreshToken) {
            localStorage.setItem("refreshToken", response.data.refreshToken);
          }
          if (response.data.user) {
            localStorage.setItem("user", JSON.stringify(response.data.user));
          }

          navigate("/dashboard", { replace: true });
        } else {
          throw new Error('No token received from server');
        }
      } catch (err) {
        const errorMsg = getErrorMessage(err, "Google login failed. Please try again.");
        setError(errorMsg);

      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google OAuth error:', error);
      const errorMsg = getErrorMessage(error, "Google login was cancelled or failed. Please try again.");
      setError(errorMsg);

    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 pt-20 sm:pt-4 font-inter">
      {/* Skip to main content link */}
      <a href="#login-form" className="sr-only-focusable">
        Skip to login form
      </a>

      {/* Accessibility controls */}
      <div className="fixed top-4 right-4 flex gap-2 z-50">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleHighContrast}
          className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
          aria-label="Toggle high contrast"
        >
          <Contrast className="h-4 w-4" />
        </Button>
      </div>

      <Card className="w-full max-w-md shadow-xl border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-500" id="login-form">
        <CardHeader className="text-center pb-2">
          {/* PMI Logo */}
          <div className="mx-auto mb-6 flex items-center justify-center">
            <img src={pmiLogo} alt="PMI Logo" className="h-16 w-auto shadow-lg shadow-blue-200 dark:shadow-none" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100">Welcome Back</CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">
            Sign in to continue your reading journey
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Login errors */}
            {error && (
              <div 
                role="alert" 
                className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm"
                aria-live="assertive"
              >
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="block mb-1.5 font-semibold text-slate-700 dark:text-slate-200">
                Email address
                <span className="sr-only">Required field</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                aria-required="true"
                aria-invalid={error ? "true" : "false"}
                aria-describedby={error ? "email-error" : undefined}
                className="enhanced-focus"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="block mb-1.5 font-semibold text-slate-700 dark:text-slate-200">
                Password
                <span className="sr-only">Required field</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  aria-required="true"
                  aria-invalid={error ? "true" : "false"}
                  aria-describedby="password-help"
                  className="enhanced-focus pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p id="password-help" className="sr-only">
                Password must be at least 8 characters long
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100 dark:shadow-none h-11"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <span className="animate-pulse">Signing in...</span>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-900 px-2 text-slate-400">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full border-slate-200 dark:border-slate-700 h-11 hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors"
              onClick={() => googleLogin()}
              disabled={loading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </Button>
          </form>
        </CardContent>

        <CardFooter className="text-center text-sm">
          <div className="w-full">
            <p className="text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                Sign up
              </Link>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              <kbd className="px-1 py-0.5 text-xs font-mono bg-muted rounded">Tab</kbd> to navigate •{" "}
              <kbd className="px-1 py-0.5 text-xs font-mono bg-muted rounded">Enter</kbd> to select
            </p>
          </div>
        </CardFooter>
      </Card>

    </div>
  );
};

export default Login;
