
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { AddDeviceSheet } from "@/components/AddDeviceSheet";
import { MyDevicesList } from "@/components/MyDevicesList";
import { MyRewards } from "@/components/MyRewards";
import { ManageRewards } from "@/components/ManageRewards";

const Index = () => {
  const { user, loading, signIn, signUp, signOut } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  console.log('Index render:', { user, loading });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (!isLogin && password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    if (isLogin) {
      await signIn(email, password);
    } else {
      await signUp(email, password);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-slate-900 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-sm space-y-6">
          {/* App Logo */}
          <div className="text-center">
            <img 
              src="/lovable-uploads/e5e82c4c-0d70-4723-843b-9147d156804a.png" 
              alt="Roark Aerospace Logo" 
              className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-lg"
            />
            <h1 className="text-2xl font-bold text-white mb-2">Roark Aerospace</h1>
            <p className="text-lg text-slate-300 mb-3">DDaaS Host Companion</p>
            <p className="text-slate-400 text-sm truncate">Welcome back, {user.email}!</p>
          </div>

          {/* Dashboard Card */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-lg">Dashboard</CardTitle>
              <CardDescription className="text-slate-300 text-sm">
                Your DDaaS Host Companion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <MyDevicesList />
                
                <AddDeviceSheet />
                
                <MyRewards />
                
                <ManageRewards />
              </div>
              
              <div className="pt-4 border-t border-white/20">
                <Button 
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full h-12 bg-white/20 hover:bg-white/30 text-white border-white/30 text-base"
                >
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-slate-900 flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-sm space-y-6">
        {/* App Logo */}
        <div className="text-center">
          <img 
            src="/lovable-uploads/e5e82c4c-0d70-4723-843b-9147d156804a.png" 
            alt="Roark Aerospace Logo" 
            className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-lg"
          />
          <h1 className="text-2xl font-bold text-white mb-2">Roark Aerospace</h1>
          <p className="text-lg text-slate-300">DDaaS Host Companion</p>
        </div>

        {/* Login/Register Form */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg">
              {isLogin ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription className="text-slate-300 text-sm">
              {isLogin ? "Sign in to your account" : "Register for a new account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 text-base"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white text-sm">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 text-base"
                  required
                />
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white text-sm">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-400 text-base"
                    required
                  />
                </div>
              )}

              <Button 
                type="submit"
                className="w-full h-12 bg-white/20 hover:bg-white/30 text-white border-white/30 text-base"
              >
                {isLogin ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setEmail("");
                  setPassword("");
                  setConfirmPassword("");
                }}
                className="text-slate-300 hover:text-white underline text-sm min-h-[44px] flex items-center justify-center w-full"
              >
                {isLogin ? "Need an account? Register here" : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <div className="text-center text-xs text-slate-400 space-y-2">
          <p>Mobile App Ready for iOS and Android</p>
          <div className="text-left bg-black/20 p-3 rounded-lg">
            <ol className="space-y-1 text-xs leading-relaxed">
              <li>1. Export to GitHub</li>
              <li>2. Run: npm install</li>
              <li>3. Run: npx cap add ios/android</li>
              <li>4. Run: npm run build</li>
              <li>5. Run: npx cap sync</li>
              <li>6. Run: npx cap run ios/android</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
