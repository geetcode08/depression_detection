"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Shield,
  Trash2,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Mail,
  UserCheck,
  Lock,
} from "lucide-react";

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, consentGiven, logout } = useUserStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) return null;

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    // In production: await api.delete("/auth/me")
    await new Promise((r) => setTimeout(r, 1200));
    setDeleted(true);
    setDeleteLoading(false);
    setTimeout(() => {
      logout();
      router.push("/");
    }, 2000);
  };

  if (deleted) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <p className="font-semibold text-gray-900">Account deleted</p>
          <p className="text-sm text-gray-500">All your data has been permanently removed. Redirecting…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your profile, privacy, and data.</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-teal-600" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <UserCheck className="h-4 w-4 text-gray-400" />
              Username
            </div>
            <span className="text-sm font-medium text-gray-900">{user.username}</span>
          </div>
          {!user.is_anonymous && (
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4 text-gray-400" />
                Email
              </div>
              <span className="text-sm font-medium text-gray-900">{user.email}</span>
            </div>
          )}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4 text-gray-400" />
              Member since
            </div>
            <span className="text-sm font-medium text-gray-900">
              {new Date(user.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Lock className="h-4 w-4 text-gray-400" />
              Account type
            </div>
            <Badge variant={user.is_anonymous ? "secondary" : "default"} className="text-xs">
              {user.is_anonymous ? "Anonymous" : "Registered"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Consent */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-teal-600" />
            Privacy & Consent
          </CardTitle>
          <CardDescription>Your data rights and consent status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="text-sm text-gray-600">Data collection consent</div>
            <Badge variant={consentGiven ? "success" : "destructive"} className="text-xs gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {consentGiven ? "Granted" : "Not given"}
            </Badge>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="text-sm text-gray-600">Third-party data sharing</div>
            <Badge variant="success" className="text-xs">Never</Badge>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="text-sm text-gray-600">Location / device tracking</div>
            <Badge variant="success" className="text-xs">Disabled</Badge>
          </div>
          <div className="mt-2 rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
            Per our privacy policy, we store only the minimal data needed to provide the service.
            Your conversations are encrypted and never sold or shared with advertisers.
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions — proceed with caution</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Sign out</p>
              <p className="text-xs text-gray-500">Sign out from this device. Your data is preserved.</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1.5 shrink-0">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>

          <div className="border-t border-gray-100 pt-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-red-700">Delete account & all data</p>
              <p className="text-xs text-gray-500">
                Permanently deletes your account, all messages, mood logs, and analysis data.
                This action cannot be undone.
              </p>
            </div>
            {!showDeleteConfirm ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="gap-1.5 shrink-0"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            ) : (
              <div className="flex flex-col gap-2 shrink-0">
                <p className="text-xs text-red-600 font-medium text-right">Are you sure?</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleteLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                    className="gap-1.5"
                  >
                    {deleteLoading ? "Deleting…" : "Yes, Delete"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-gray-400">
        ⚠️ Aura is not a medical tool. For clinical mental health concerns, please consult a
        qualified professional.
      </p>
    </div>
  );
}
