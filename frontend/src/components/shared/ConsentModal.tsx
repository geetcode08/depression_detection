"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, UserX } from "lucide-react";

interface ConsentModalProps {
  onAccept: () => void;
  onGuest?: () => void;
}

export default function ConsentModal({ onAccept, onGuest }: ConsentModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="max-w-lg w-full animate-in fade-in zoom-in-95">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
            <ShieldCheck className="h-6 w-6 text-teal-600" />
          </div>
          <CardTitle className="text-xl">Before We Begin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-gray-600">
          <p>
            Welcome to <strong>Aura</strong>, your AI emotional support assistant. Before we
            proceed, please read and accept the following:
          </p>
          <div className="rounded-lg bg-gray-50 p-4 space-y-2 border border-gray-100 max-h-48 overflow-y-auto">
            <p>
              <strong>1. Not a Medical Tool:</strong> Aura is NOT a doctor, therapist, or clinical
              diagnostic tool. It provides emotional support and self-reflection only.
            </p>
            <p>
              <strong>2. Data Collection:</strong> Your messages will be analyzed for sentiment
              and emotional patterns to provide personalized support. No data is shared with
              third parties.
            </p>
            <p>
              <strong>3. Confidentiality:</strong> Your conversations are stored securely. You
              can delete your data at any time from your account settings.
            </p>
            <p>
              <strong>4. Crisis Support:</strong> If the system detects signs of distress, it
              will provide crisis helpline information. In emergencies, please contact your local
              emergency services immediately.
            </p>
            <p>
              <strong>5. Professional Help:</strong> For clinical mental health concerns, please
              consult a qualified mental health professional.
            </p>
            <p>
              <strong>6. Anonymous Mode:</strong> You may use Aura without creating an account.
              Anonymous sessions use a device-generated ID; no email or personal info is stored.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button onClick={onAccept} className="w-full" size="lg">
            I Understand &amp; Accept
          </Button>
          {onGuest && (
            <Button
              onClick={onGuest}
              variant="ghost"
              size="sm"
              className="w-full text-gray-500 gap-1.5"
            >
              <UserX className="h-4 w-4" />
              Continue Anonymously (no account)
            </Button>
          )}
          <p className="text-xs text-gray-400 text-center">
            By clicking accept, you consent to the data practices described above.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
