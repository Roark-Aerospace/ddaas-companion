
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

const Index = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
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

    // Simulate authentication
    setIsLoggedIn(true);
    toast({
      title: "Success",
      description: isLogin ? "Logged in successfully!" : "Account created successfully!",
    });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* App Logo */}
          <div className="text-center">
            <img 
              src="/lovable-uploads/e5e82c4c-0d70-4723-843b-9147d156804a.png" 
              alt="Roark Aerospace Logo" 
              className="w-24 h-24 mx-auto mb-6 rounded-2xl shadow-lg"
            />
            <h1 className="text-3xl font-bold text-white mb-2">Roark Aerospace</h1>
            <p className="text-xl text-slate-300 mb-4">DDaaS Host Companion</p>
            <p className="text-slate-400">Welcome back, {email}!</p>
          </div>

          {/* Dashboard Card */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Dashboard</CardTitle>
              <CardDescription className="text-slate-300">
                Your DDaaS Host Companion dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <div className="text-2xl mb-2">🚀</div>
                  <div className="text-sm text-white">Systems Online</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <div className="text-2xl mb-2">📡</div>
                  <div className="text-sm text-white">Connected</div>
                </div>
              </div>
              
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* App Logo */}
        <div className="text-center">
          <img 
            src="/lovable-uploads/e5e82c4c-0d70-4723-843b-9147d156804a.png" 
            alt="Roark Aerospace Logo" 
            className="w-24 h-24 mx-auto mb-6 rounded-2xl shadow-lg"
          />
          <h1 className="text-3xl font-bold text-white mb-2">Roark Aerospace</h1>
          <p className="text-xl text-slate-300">DDaaS Host Companion</p>
        </div>

        {/* Login/Register Form */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white">
              {isLogin ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription className="text-slate-300">
              {isLogin ? "Sign in to your account" : "Register for a new account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  required
                />
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                    required
                  />
                </div>
              )}

              <Button 
                type="submit"
                className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
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
                className="text-slate-300 hover:text-white underline text-sm"
              >
                {isLogin ? "Need an account? Register here" : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <div className="text-center text-sm text-slate-400 space-y-2">
          <p>Mobile App Ready for iOS and Android</p>
          <ol className="text-left space-y-1 bg-black/20 p-4 rounded-lg">
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
  );
};

export default Index;
