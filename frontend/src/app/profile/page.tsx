"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Trash2, LogOut, ShieldCheck, AlertTriangle, Eye, EyeOff } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useUserStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAnonymousId, setShowAnonymousId] = useState(false);

  if (!isAuthenticated || !user) {
    router.push("/login");
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleDeleteAccount = () => {
    // In production: call DELETE /auth/me then logout
    logout();
    if (typeof window !== "undefined") {
      localStorage.removeItem("guest_uuid");
    }
    router.push("/");
  };

  const guestId = typeof window !== "undefined" ? localStorage.getItem("guest_uuid") : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile & Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account and privacy settings.</p>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-teal-600" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {user.is_anonymous ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                You are using Aura in <strong>anonymous mode</strong>. Your session is tracked by a random ID — no personal information is stored.
              </p>
              {guestId && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Session ID:</span>
                  <code className="text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded font-mono">
                    {showAnonymousId ? guestId : "••••••••••••••••"}
                  </code>
                  <button
                    onClick={() => setShowAnonymousId(!showAnonymousId)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showAnonymousId ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              )}
              <div className="mt-4">
                <Button variant="outline" size="sm" onClick={() => router.push("/register")}>
                  Create a full account →
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Username</span>
                <span className="font-medium text-gray-900">{user.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-medium text-gray-900">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Account type</span>
                <span className="font-medium text-gray-900">Registered</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Member since</span>
                <span className="font-medium text-gray-900">
                  {new Date(user.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-teal-600" />
            Privacy & Consent
          </CardTitle>
          <CardDescription>You have given consent to data processing for emotional support analysis.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>✓ Sentiment analysis of your messages</p>
          <p>✓ Depression risk scoring (non-clinical)</p>
          <p>✓ Mood trend aggregation</p>
          <p>✗ No data shared with third parties</p>
          <p>✗ No location or device tracking</p>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-gray-700"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>

          {!showDeleteConfirm ? (
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete Account &amp; All Data
            </Button>
          ) : (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
              <div className="flex gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">
                  This will permanently delete your account and all associated data including messages, mood logs, and analysis history. This cannot be undone.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  className="flex-1"
                >
                  Yes, Delete Everything
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700 flex gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          Aura is not a medical tool. All emotional support is non-clinical. If you are in crisis, please contact
          iCall at <a href="tel:9152987821" className="underline font-medium">9152987821</a> or Vandrevala Foundation at{" "}
          <a href="tel:18602662345" className="underline font-medium">1860-2662-345</a>.
        </p>
      </div>
    </div>
  );
}
