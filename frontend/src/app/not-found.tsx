import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Heart, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50">
        <Heart className="h-8 w-8 text-teal-600 fill-teal-100" />
      </div>
      <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
      <h2 className="text-xl font-semibold text-gray-700 mb-3">Page Not Found</h2>
      <p className="text-sm text-gray-500 max-w-sm mb-8">
        The page you&apos;re looking for doesn&apos;t exist. It may have been moved or removed.
      </p>
      <Link href="/">
        <Button className="gap-2">
          <Home className="h-4 w-4" />
          Back to Home
        </Button>
      </Link>
    </div>
  );
}
