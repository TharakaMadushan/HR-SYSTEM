import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface ResetPasswordModalProps {
  accessToken: string;
  onSuccess: (newUsername?: string) => void;
}

export default function ResetPasswordModal({ accessToken, onSuccess }: ResetPasswordModalProps) {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5168/api/Auth/first-time-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          newUsername: newUsername || undefined,
          newPassword: newPassword
        })
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        toast.error(data.message || 'Setup failed. ' + JSON.stringify(data.errors || ''));
        setLoading(false);
        return;
      }

      toast.success('Credentials updated successfully! Returning to Dashboard...');
      onSuccess(newUsername);
    } catch (err) {
      toast.error('Failed to connect to the server.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-in fade-in duration-500">
      <Card className="w-full max-w-md shadow-2xl bg-white border-none relative overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
        <CardHeader className="pt-8">
          <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500">
            First-Time Setup
          </CardTitle>
          <CardDescription className="text-slate-500 mt-2">
            For security reasons, you must change your temporary credentials before accessing the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="newUsername" className="text-sm font-semibold text-slate-700">New Username (Optional)</Label>
              <Input 
                id="newUsername" 
                placeholder="Leave blank to keep current" 
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                className="h-11 border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-semibold text-slate-700">New Password *</Label>
              <Input 
                id="newPassword" 
                type="password" 
                required
                placeholder="••••••••" 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="h-11 border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-600"
              />
            </div>
            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 font-medium text-white transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-70 shadow-sm"
              >
                {loading ? 'Updating...' : 'Update Credentials & Continue'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
