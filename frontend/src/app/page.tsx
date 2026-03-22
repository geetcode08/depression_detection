"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ConsentModal from "@/components/shared/ConsentModal";
import { useUserStore } from "@/store/userStore";
import {
  Heart,
  MessageCircle,
  BarChart3,
  Brain,
  Shield,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: MessageCircle,
    title: "Empathetic AI Chat",
    description:
      "Talk to Aura, your compassionate AI assistant that listens without judgment and helps you reflect on your feelings.",
  },
  {
    icon: BarChart3,
    title: "Mood Tracking",
    description:
      "Visualize your emotional patterns over time with interactive charts and gain insights into your well-being.",
  },
  {
    icon: Brain,
    title: "Smart Analysis",
    description:
      "Advanced NLP analyzes your messages for sentiment and emotional patterns, providing personalized support.",
  },
  {
    icon: Shield,
    title: "Safe & Private",
    description:
      "Your data stays secure. Full consent controls, no third-party sharing, and you can delete your data anytime.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, consentGiven, giveConsent } = useUserStore();
  const [showConsent, setShowConsent] = useState(false);

  const handleGetStarted = () => {
    if (isAuthenticated && consentGiven) {
      router.push("/chat");
    } else if (isAuthenticated && !consentGiven) {
      setShowConsent(true);
    } else {
      setShowConsent(true);
    }
  };

  const handleConsentAccept = async () => {
    try {
      await giveConsent();
    } catch {
      // Consent will work with mock
    }
    setShowConsent(false);
    if (isAuthenticated) {
      router.push("/chat");
    } else {
      router.push("/register");
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-20 sm:py-32">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-teal-50 via-white to-purple-50" />
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-teal-100 px-4 py-1.5 text-sm font-medium text-teal-800">
            <Heart className="h-4 w-4 fill-teal-600 text-teal-600" />
            AI-Powered Emotional Support
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Your Safe Space to{" "}
            <span className="text-teal-600">Feel Heard</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Aura is a compassionate AI assistant that helps you track your
            emotional well-being, detect early signs of distress, and find
            personalized coping strategies — all in a safe, private
            environment.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={handleGetStarted} className="text-base px-8">
              Get Started
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <Link href="/login">
              <Button variant="outline" size="lg" className="text-base px-8">
                Sign In
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            Free to use · No credit card required · Not a medical tool
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16 bg-white">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl mb-12">
            How Aura Supports You
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-xl border border-gray-100 bg-gray-50/50 p-6 text-center hover:shadow-md transition-shadow"
                >
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
                    <Icon className="h-6 w-6 text-teal-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 bg-gradient-to-r from-teal-600 to-teal-700">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Ready to Start Your Wellness Journey?
          </h2>
          <p className="mt-4 text-teal-100">
            Take the first step towards better emotional awareness. Aura is
            here to listen.
          </p>
          <div className="mt-8">
            <Link href="/register">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-teal-700 hover:bg-gray-100 text-base px-8"
              >
                Create Free Account
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 px-4 py-8 bg-white">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Heart className="h-4 w-4 fill-teal-600 text-teal-600" />
            <span>Aura — AI Emotional Support System</span>
          </div>
          <p className="text-xs text-gray-400">
            ⚠️ This is not a medical tool. For clinical concerns, consult a
            qualified professional.
          </p>
        </div>
      </footer>

      {/* Consent Modal */}
      {showConsent && <ConsentModal onAccept={handleConsentAccept} />}
    </div>
  );
}
