
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const [isReady, setIsReady] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* App Logo */}
        <div className="text-center">
          <img 
            src="/lovable-uploads/e5e82c4c-0d70-4723-843b-9147d156804a.png" 
            alt="App Logo" 
            className="w-24 h-24 mx-auto mb-6 rounded-2xl shadow-lg"
          />
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Your App</h1>
          <p className="text-slate-300">Ready for iOS and Android deployment</p>
        </div>

        {/* Mobile App Card */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Mobile App Ready</CardTitle>
            <CardDescription className="text-slate-300">
              Your app is configured for both iOS and Android deployment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-2xl mb-2">📱</div>
                <div className="text-sm text-white">iOS Ready</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-2xl mb-2">🤖</div>
                <div className="text-sm text-white">Android Ready</div>
              </div>
            </div>
            
            <Button 
              onClick={() => setIsReady(true)}
              className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              {isReady ? "App Initialized ✓" : "Initialize App"}
            </Button>
          </CardContent>
        </Card>

        {/* Instructions */}
        <div className="text-center text-sm text-slate-400 space-y-2">
          <p>To run on a physical device:</p>
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
