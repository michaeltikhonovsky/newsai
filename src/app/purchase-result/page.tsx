"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle,
  ArrowLeft,
  Coins,
  AlertCircle,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

function PurchaseResultPageInner() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [currentBalance, setCurrentBalance] = useState<number>(0);

  useEffect(() => {
    const quantityParam = searchParams.get("quantity");
    const currentBalanceParam = searchParams.get("currentBalance");
    const canceled = searchParams.get("canceled");

    setQuantity(quantityParam ? parseInt(quantityParam, 10) : 1);
    setCurrentBalance(
      currentBalanceParam ? parseInt(currentBalanceParam, 10) : 0
    );
    setIsLoading(false);

    if (canceled === "true") {
      setError("payment_canceled");
      return;
    }

    // Only show confetti for successful purchases
    if (quantityParam && !canceled) {
      // Confetti animation
      const duration = 2500;
      const animationEnd = Date.now() + duration;

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const confettiInterval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(confettiInterval);
          return;
        }

        const particleCount = 30 * (timeLeft / duration);

        confetti({
          angle: randomInRange(60, 120),
          spread: randomInRange(45, 65),
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ["#6366f1", "#8b5cf6", "#a855f7", "#c084fc", "#e879f9"],
        });
        confetti({
          angle: randomInRange(60, 120),
          spread: randomInRange(45, 65),
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ["#6366f1", "#8b5cf6", "#a855f7", "#c084fc", "#e879f9"],
        });
      }, 300);

      return () => clearInterval(confettiInterval);
    }
  }, [searchParams]);

  const creditsPerPack = 50;
  const totalCredits = quantity * creditsPerPack;
  const newBalance = currentBalance + totalCredits;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-indigo-200 font-mono">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Success/Error Icon */}
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            {error ? (
              <div className="relative">
                <AlertCircle className="w-20 h-20 text-amber-400" />
                <div className="absolute -top-2 -right-2">
                  <div className="w-6 h-6 bg-amber-400/20 border border-amber-400 rounded-full animate-pulse" />
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="w-6 h-6 text-purple-300 animate-pulse" />
                </div>
                <div className="absolute -bottom-1 -left-1">
                  <Zap className="w-5 h-5 text-indigo-300 animate-bounce" />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-white font-mono tracking-wide">
              {error ? "PAYMENT CANCELLED" : "SUCCESS!"}
            </h1>
            <p className="text-indigo-300 font-mono text-base">
              {error
                ? "No worries - your payment was safely cancelled"
                : "Your credit purchase has been processed successfully"}
            </p>
          </div>
        </div>

        {/* Main Content Card */}
        <Card className="bg-indigo-950/60 border border-indigo-400/50 backdrop-blur-sm">
          {!error && (
            <CardHeader className="text-center pb-4">
              <CardTitle className="font-mono text-indigo-200 flex items-center justify-center gap-3 text-xl">
                <Coins className="w-6 h-6 text-yellow-400" />
                CREDITS PURCHASED
              </CardTitle>
            </CardHeader>
          )}

          <CardContent className="space-y-6">
            {error ? (
              <div className="text-center space-y-4">
                <div className="bg-amber-500/10 border border-amber-400/30 rounded-lg p-4">
                  <p className="text-amber-200 font-mono text-sm">
                    Your payment session was cancelled. You can try again
                    anytime.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Credit Purchase Details */}
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/40 px-6 py-3 rounded-xl">
                      <Coins className="w-6 h-6 text-yellow-400" />
                      <div>
                        <div className="font-mono text-yellow-200 font-bold text-lg">
                          +{totalCredits} CREDITS
                        </div>
                        <div className="text-xs text-yellow-400 font-mono">
                          {quantity} pack{quantity > 1 ? "s" : ""} purchased
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-indigo-900/40 border border-indigo-400/30 rounded-lg p-4 text-center">
                    <p className="text-indigo-200 font-mono text-sm mb-1">
                      New Balance
                    </p>
                    <p className="text-indigo-100 font-mono text-2xl font-bold">
                      {newBalance} credits
                    </p>
                  </div>
                </div>

                {/* Transaction Details */}
                <div className="bg-indigo-900/30 border border-indigo-400/30 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm font-mono">
                    <span className="text-indigo-400">Status:</span>
                    <span className="text-green-400 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      CONFIRMED
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-mono">
                    <span className="text-indigo-400">Date:</span>
                    <span className="text-indigo-200">
                      {new Date().toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-mono">
                    <span className="text-indigo-400">Type:</span>
                    <span className="text-indigo-200">
                      {quantity}x Credit Pack
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link href="/" className="block">
            <Button className="w-full font-mono bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-0 h-12 text-base transition-all duration-200">
              <ArrowLeft className="w-5 h-5 mr-2" />
              {error ? "RETURN TO NEWSAI" : "CONTINUE TO NEWSAI"}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PurchaseResultPage() {
  return (
    <Suspense>
      <PurchaseResultPageInner />
    </Suspense>
  );
}
