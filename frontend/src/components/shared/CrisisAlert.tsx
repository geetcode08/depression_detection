"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, X, ExternalLink } from "lucide-react";

interface CrisisAlertProps {
  onDismiss: () => void;
}

export default function CrisisAlert({ onDismiss }: CrisisAlertProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="max-w-md w-full border-red-200 bg-red-50">
        <CardHeader className="relative text-center pb-2">
          <button
            onClick={onDismiss}
            className="absolute right-4 top-4 text-red-400 hover:text-red-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <Phone className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl text-red-800">
            We&apos;re Here For You
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-red-700 text-center">
            It seems like you might be going through a really difficult time.
            Your feelings are valid, and you don&apos;t have to face this alone.
            Please consider reaching out to one of these helplines:
          </p>

          <div className="space-y-3">
            <a
              href="tel:9152987821"
              className="flex items-center justify-between rounded-lg bg-white p-3 border border-red-200 hover:bg-red-50 transition-colors"
            >
              <div>
                <p className="font-semibold text-red-800 text-sm">
                  iCall (TISS)
                </p>
                <p className="text-xs text-red-600">Mon–Sat, 8am–10pm</p>
              </div>
              <span className="text-sm font-bold text-red-700">
                9152987821
              </span>
            </a>

            <a
              href="tel:18602662345"
              className="flex items-center justify-between rounded-lg bg-white p-3 border border-red-200 hover:bg-red-50 transition-colors"
            >
              <div>
                <p className="font-semibold text-red-800 text-sm">
                  Vandrevala Foundation
                </p>
                <p className="text-xs text-red-600">24/7</p>
              </div>
              <span className="text-sm font-bold text-red-700">
                1860-2662-345
              </span>
            </a>

            <a
              href="tel:08046110007"
              className="flex items-center justify-between rounded-lg bg-white p-3 border border-red-200 hover:bg-red-50 transition-colors"
            >
              <div>
                <p className="font-semibold text-red-800 text-sm">
                  NIMHANS Helpline
                </p>
                <p className="text-xs text-red-600">Mon–Sat, 8am–8pm</p>
              </div>
              <span className="text-sm font-bold text-red-700">
                080-46110007
              </span>
            </a>

            <a
              href="https://icallhelpline.org"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg bg-white p-3 border border-red-200 hover:bg-red-50 transition-colors text-sm text-red-700"
            >
              <ExternalLink className="h-4 w-4" />
              iCall Online Chat
            </a>
          </div>

          <Button
            onClick={onDismiss}
            variant="outline"
            className="w-full border-red-300 text-red-700 hover:bg-red-100"
          >
            I understand, continue chatting
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
