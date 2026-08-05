import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { EyeIcon as Eye, EyeSlashIcon as EyeOff } from "@heroicons/react/24/outline";
import { useLoginMutation, useGoogleLoginMutation } from "@/store/api/authApi";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { selectIsAuthenticated, logout } from "@/store/slices/authSlice";
import { isInternalAdmin } from "@/utils/adminType";
import AuthLayout from "@/components/layout/AuthLayout";
import { loadGoogleSDK, initializeGoogleLogin, renderGoogleButton } from "@/lib/googleSdk";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from") || "/dashboard";
  const { toast } = useToast();
  const [login, { isLoading }] = useLoginMutation();
  const [googleLogin, { isLoading: isGoogleLoading }] = useGoogleLoginMutation();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const dispatch = useAppDispatch();

  /**
   * The backend authenticates every VaakuOS account against one user table, so
   * valid brand credentials would otherwise open the internal console. Drop the
   * session unless the tenant is internal.
   */
  const rejectNonInternal = (res: any) => {
    if (isInternalAdmin(res?.user?.adminType, res?.user?.tenantType)) return true;
    dispatch(logout());
    toast({
      title: "Access denied",
      description: "This console is for VaakuOS internal accounts only.",
      variant: "destructive",
    });
    return false;
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from);
    }
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    const initGoogle = async () => {
      try {
        await loadGoogleSDK();
        initializeGoogleLogin(import.meta.env.VITE_GOOGLE_CLIENT_ID, async (response: any) => {
          try {
            const res = await googleLogin({ token: response.credential }).unwrap();
            if (!rejectNonInternal(res)) return;
            toast({
              title: "Welcome back!",
              description: "You have successfully logged in with Google.",
            });
            navigate(from);
          } catch (error: any) {
            toast({
              title: "Google Login failed",
              description: error?.data?.message || "Something went wrong during Google Login.",
              variant: "destructive",
            });
          }
        });
        renderGoogleButton("google-auth-button-container");
      } catch (error) {
        console.error("Google SDK load error:", error);
      }
    };

    initGoogle();
  }, [googleLogin, navigate, from, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await login({ email, password, rememberMe }).unwrap();

      if (!rejectNonInternal(res)) return;

      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      navigate(from);
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error?.data?.message || "Invalid email or password.",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 lg:text-5xl">
            Welcome Back
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Enter your email and password to access your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2.5">
            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 bg-slate-50 border-transparent focus:bg-white focus:ring-1 focus:ring-primary transition-all"
              required
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-slate-50 border-transparent focus:bg-white focus:ring-1 focus:ring-primary pr-12 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="remember" 
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                className="border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label htmlFor="remember" className="text-xs font-medium text-slate-600 cursor-pointer">
                Remember me
              </Label>
            </div>
            <Link
              to="/forgot-password"
              className="text-xs font-bold text-slate-900 hover:text-primary transition-colors"
            >
              Forgot Password
            </Link>
          </div>

          

            <div className="space-y-4 pt-2">
              <Button 
                  type="submit" 
                  className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary-hover rounded-lg text-sm font-bold transition-all transform active:scale-[0.98] shadow-md shadow-primary/10" 
                  disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Or continue with
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <div className="flex justify-center">
                <div 
                  id="google-auth-button-container" 
                  className="w-full h-12 overflow-hidden rounded-lg  border-slate-200 hover:border-slate-300 transition-colors flex justify-center items-center"
                ></div>
              </div>
            </div>
        </form>

        <div className="text-center pt-4">
          <p className="text-xs text-slate-500 font-medium">
            Internal accounts are provisioned by the platform team.
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;

