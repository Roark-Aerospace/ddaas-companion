
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { AddDeviceSheet } from "@/components/AddDeviceSheet";
import { MyDevicesList } from "@/components/MyDevicesList";
import { MyRewards } from "@/components/MyRewards";
import { ManageRewards } from "@/components/ManageRewards";
import { AlertPreferences } from "@/components/AlertPreferences";
import { AlertHistory } from "@/components/AlertHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, LogIn, UserPlus, Wifi, Gift, Bell, History } from "lucide-react";

const Index = () => {
  const { user, loading, signIn, signUp, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showSignUp, setShowSignUp] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }
    await signIn(email, password);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Missing Information", 
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }
    await signUp(email, password);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Shield className="w-12 h-12 text-purple-400" />
            </div>
            <CardTitle className="text-2xl text-white">DDaaS Companion</CardTitle>
            <CardDescription className="text-slate-300">
              Device Detection as a Service - Monitor and manage your network devices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={showSignUp ? handleSignUp : handleSignIn} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/20 border-white/30 text-white placeholder:text-slate-300"
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/20 border-white/30 text-white placeholder:text-slate-300"
              />
              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {showSignUp ? (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Sign Up
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
            <div className="text-center">
              <Button
                variant="ghost"
                className="text-slate-300 hover:text-white"
                onClick={() => setShowSignUp(!showSignUp)}
              >
                {showSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <Shield className="w-8 h-8 text-purple-400 mr-3" />
            <h1 className="text-3xl font-bold text-white">DDaaS Companion</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-slate-300">Welcome, {user.email}</span>
            <Button
              onClick={signOut}
              variant="outline"
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              Sign Out
            </Button>
          </div>
        </div>

        <Tabs defaultValue="devices" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 bg-white/10 backdrop-blur-lg border-white/20">
            <TabsTrigger value="devices" className="data-[state=active]:bg-white/20 text-white">
              <Wifi className="w-4 h-4 mr-2" />
              Devices
            </TabsTrigger>
            <TabsTrigger value="rewards" className="data-[state=active]:bg-white/20 text-white">
              <Gift className="w-4 h-4 mr-2" />
              Rewards
            </TabsTrigger>
            <TabsTrigger value="alerts" className="data-[state=active]:bg-white/20 text-white">
              <Bell className="w-4 h-4 mr-2" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-white/20 text-white">
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="manage" className="data-[state=active]:bg-white/20 text-white">
              Manage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="devices" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">My Devices</h2>
              <AddDeviceSheet />
            </div>
            <MyDevicesList />
          </TabsContent>

          <TabsContent value="rewards" className="space-y-4">
            <h2 className="text-2xl font-bold text-white">My Rewards</h2>
            <MyRewards />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Alert Settings</h2>
            <p className="text-slate-300 mb-4">
              Configure how you want to be notified when your devices go offline or come back online.
            </p>
            <AlertPreferences />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Alert History</h2>
            <p className="text-slate-300 mb-4">
              View recent notifications that have been sent about your devices.
            </p>
            <AlertHistory />
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Manage Rewards</h2>
            <ManageRewards />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
