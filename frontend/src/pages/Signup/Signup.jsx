import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { Eye, EyeOff, Contrast, Type, UserPlus, AlertCircle, CheckCircle } from "lucide-react";
import pmiLogo from "@/assets/pmi-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAccessibility } from "@/hooks/useAccessibility";
import ThemeToggle from "@/components/ThemeToggle";
import API, { getErrorMessage } from "@/api";

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const {
    largeText,
    toggleHighContrast,
    toggleLargeText,
  } = useAccessibility();

  // Calculate password strength
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    return strength;
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const response = await API.post("/auth/signup", {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        if (response.data.refreshToken) {
          localStorage.setItem("refreshToken", response.data.refreshToken);
        }
        localStorage.setItem("user", JSON.stringify(response.data.user));

        setSignupSuccess(true);

        setTimeout(() => navigate("/dashboard"), 2000);
      }
    } catch (err) {
      const errorMsg = getErrorMessage(err, "Signup failed. Please try again.");
      setErrors({ general: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Calculate password strength
    if (name === "password") {
      setPasswordStrength(calculatePasswordStrength(value));
    }

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  // Google signup handler
  const googleSignup = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);

        const response = await API.post("/auth/google", {
          token: tokenResponse.access_token
        });

        if (response.data.token) {
          localStorage.setItem("token", response.data.token);
          if (response.data.refreshToken) {
            localStorage.setItem("refreshToken", response.data.refreshToken);
          }
          localStorage.setItem("user", JSON.stringify(response.data.user));

          navigate("/dashboard");
        }
      } catch (err) {
        const errorMsg = "Google signup failed. Please try again.";
        setErrors({ general: errorMsg });
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      const errorMsg = "Google signup failed";
      setErrors({ general: errorMsg });
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 pt-20 sm:pt-4 font-inter">
      {/* Skip to main content link */}
      <a href="#signup-form" className="sr-only-focusable">
        Skip to signup form
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
        <Button
          variant="outline"
          size="icon"
          onClick={toggleLargeText}
          aria-label={largeText ? "Disable large text" : "Enable large text"}
          title={largeText ? "Disable large text" : "Enable large text"}
        >
          <Type className="h-4 w-4" />
        </Button>
      </div>

      <Card className="w-full max-w-md shadow-xl border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-500" id="signup-form">
        <CardHeader className="text-center pb-2">
          {/* PMI Logo */}
          <div className="mx-auto mb-6 flex items-center justify-center">
            <img src={pmiLogo} alt="PMI Logo" className="h-16 w-auto shadow-lg shadow-blue-200 dark:shadow-none transition-transform duration-300" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100">Create Account</CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">
            Join the community and start listening
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Success message */}
            {signupSuccess && (
              <Alert className="animate-slide-in border-green-500 bg-green-50 dark:bg-green-900/20">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600 dark:text-green-400">
                  Account created successfully! Redirecting to dashboard...
                </AlertDescription>
              </Alert>
            )}

            {/* General error message */}
            {errors.general && !signupSuccess && (
              <Alert variant="destructive" className="animate-slide-in">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {errors.general}
                </AlertDescription>
              </Alert>
            )}

            {/* Name field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="block mb-1.5 font-semibold text-slate-700 dark:text-slate-200">
                Full Name
                <span className="sr-only">Required field</span>
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleInputChange}
                required
                autoComplete="name"
                aria-required="true"
                aria-invalid={errors.name ? "true" : "false"}
                aria-describedby={errors.name ? "name-error" : undefined}
                className="enhanced-focus transition-all duration-200 hover:border-purple-400"
              />
              {errors.name && (
                <p id="name-error" className="text-sm text-red-600" role="alert">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="block mb-1.5 font-semibold text-slate-700 dark:text-slate-200">
                Email Address
                <span className="sr-only">Required field</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                required
                autoComplete="email"
                aria-required="true"
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby={errors.email ? "email-error" : undefined}
                className="enhanced-focus transition-all duration-200 hover:border-purple-400"
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-red-600" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="block mb-1.5 font-semibold text-slate-700 dark:text-slate-200">
                Password
                <span className="sr-only">Required field, minimum 8 characters</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  autoComplete="new-password"
                  aria-required="true"
                  aria-invalid={errors.password ? "true" : "false"}
                  aria-describedby="password-requirements"
                  className="enhanced-focus pr-10 transition-all duration-200 hover:border-purple-400"
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
              <p id="password-requirements" className="text-xs text-muted-foreground">
                Password must be at least 8 characters long
              </p>

              {/* Password strength indicator */}
              {formData.password && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>Password strength:</span>
                    <span className="font-medium">
                      {passwordStrength === 0 ? "Too weak" :
                       passwordStrength === 1 ? "Weak" :
                       passwordStrength === 2 ? "Fair" :
                       passwordStrength === 3 ? "Good" : "Strong"}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        passwordStrength === 0 ? "bg-red-500 w-1/5" :
                        passwordStrength === 1 ? "bg-orange-500 w-2/5" :
                        passwordStrength === 2 ? "bg-yellow-500 w-3/5" :
                        passwordStrength === 3 ? "bg-blue-500 w-4/5" :
                        "bg-green-500 w-full"
                      }`}
                    />
                  </div>
                  {passwordStrength < 3 && (
                    <p className="text-xs text-muted-foreground">
                      Tip: Use uppercase, lowercase, numbers, and symbols for a stronger password
                    </p>
                  )}
                </div>
              )}

              {errors.password && (
                <p className="text-sm text-red-600" role="alert">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="block mb-1.5 font-semibold text-slate-700 dark:text-slate-200">
                Confirm Password
                <span className="sr-only">Required field</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  autoComplete="new-password"
                  aria-required="true"
                  aria-invalid={errors.confirmPassword ? "true" : "false"}
                  aria-describedby={errors.confirmPassword ? "confirm-error" : undefined}
                  className="enhanced-focus pr-10 transition-all duration-200 hover:border-purple-400"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p id="confirm-error" className="text-sm text-red-600" role="alert">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100 dark:shadow-none h-11 transition-all"
              disabled={loading || signupSuccess}
              aria-busy={loading}
            >
              {loading ? (
                <span className="animate-pulse">Creating account...</span>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Account
                </>
              )}
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-900 px-2 text-slate-400">Or sign up with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full border-slate-200 dark:border-slate-700 h-11 hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors"
              onClick={() => googleSignup()}
              disabled={loading || signupSuccess}
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
              Sign up with Google
            </Button>
          </form>
        </CardContent>

        <CardFooter className="text-center text-sm">
          <div className="w-full">
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                Sign in
              </Link>
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              By creating an account, you agree to our accessible audiobook service terms.
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

export default Signup;
