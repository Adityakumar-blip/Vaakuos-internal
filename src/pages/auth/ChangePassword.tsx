import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { EyeIcon as Eye, EyeSlashIcon as EyeOff } from "@heroicons/react/24/outline";
import { useChangePasswordMutation, useLogoutMutation } from "@/store/api/authApi";
import AuthLayout from "@/components/layout/AuthLayout";

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [logout] = useLogoutMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please ensure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    try {
      await changePassword({ currentPassword, newPassword: password }).unwrap();
      // Sign out so the old-password session dies and Login doesn't bounce us back in.
      await logout();

      toast({
        title: "Password Updated",
        description: "Your password has been set. Please sign in again.",
      });
      navigate("/login", { replace: true });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error?.data?.message || "Could not update your password. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 lg:text-5xl">
            Set Your Password
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Your account was created by an administrator. Choose a new password to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2.5">
            <Label htmlFor="currentPassword" className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Current Password
            </Label>
            <Input
              id="currentPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Enter the password you signed in with"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="h-12 bg-slate-50 border-transparent focus:bg-white focus:ring-1 focus:ring-primary transition-all"
              required
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-700">
              New Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-slate-50 border-transparent focus:bg-white focus:ring-1 focus:ring-primary pr-12 transition-all"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12 bg-slate-50 border-transparent focus:bg-white focus:ring-1 focus:ring-primary transition-all"
              required
              minLength={6}
            />
          </div>

          <div className="space-y-4 pt-2">
            <Button
              type="submit"
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary-hover rounded-lg text-sm font-bold transition-all transform active:scale-[0.98] shadow-md shadow-primary/10"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Set Password"}
            </Button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
};

export default ChangePassword;
