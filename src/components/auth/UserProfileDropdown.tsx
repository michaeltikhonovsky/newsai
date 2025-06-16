"use client";

import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, type InputProps } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { X, Loader2, CreditCard } from "lucide-react";
import { api } from "@/trpc/react";

export function UserProfileDropdown() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [creditQuantity, setCreditQuantity] = useState(1);
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
  });

  const createPaymentSession = api.stripe.createPaymentSession.useMutation({
    onSuccess: (data: { url: string | null }) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast.error("Failed to create payment session: " + error.message);
    },
  });

  const handleBuyCredits = () => {
    if (creditQuantity < 1) return;

    createPaymentSession.mutate({
      priceId: "price_1RaiTRBHSgYyUP0eYCzY4urv",
      quantity: creditQuantity,
    });
  };

  const incrementQuantity = () => setCreditQuantity((prev) => prev + 1);
  const decrementQuantity = () =>
    setCreditQuantity((prev) => Math.max(1, prev - 1));

  const totalCredits = creditQuantity * 50;
  const totalPrice = creditQuantity * 5;

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (isProfileModalOpen && user?.primaryEmailAddress?.emailAddress) {
      fetchUserProfile(user.primaryEmailAddress.emailAddress);
    }
  }, [isProfileModalOpen]);

  const fetchUserProfile = async (email: string) => {
    try {
      const response = await fetch(
        `/api/user?email=${encodeURIComponent(email)}`
      );
      if (response.ok) {
        const data = await response.json();
        setProfileData({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
        });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  if (!user) return null;

  const getInitial = () => {
    if (user.firstName) return user.firstName[0].toUpperCase();
    if (user.primaryEmailAddress)
      return user.primaryEmailAddress.emailAddress[0].toUpperCase();
    return "?";
  };

  const handleSignOut = () => {
    signOut();
    toast.success("Successfully signed out");
  };

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdating(true);
    const formData = new FormData(e.currentTarget);
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;

    try {
      const trimmedFirstName = firstName.trim();
      const trimmedLastName = lastName.trim();
      const email = user.primaryEmailAddress?.emailAddress;

      if (!email) {
        throw new Error("No email address found");
      }

      const response = await fetch("/api/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setProfileData({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
      });

      setIsProfileModalOpen(false);
      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast.error(
        error?.message || "Failed to update profile. Please try again."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-10 w-10 rounded-full bg-indigo-950 border border-indigo-400 hover:bg-indigo-800"
          >
            <span className="text-indigo-200 font-mono">{getInitial()}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 bg-indigo-950/90 border border-indigo-400 text-indigo-200 font-mono"
        >
          <DropdownMenuItem
            onClick={() => setIsProfileModalOpen(true)}
            className="cursor-pointer hover:bg-indigo-800/60 hover:text-white"
          >
            Edit Profile
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setIsBillingModalOpen(true)}
            className="cursor-pointer hover:bg-indigo-800/60 hover:text-white"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Billing & Credits
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleSignOut}
            className="cursor-pointer hover:bg-indigo-800/60 hover:text-white"
          >
            Log Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="bg-indigo-950/40 border border-indigo-400/50 rounded-lg text-indigo-200 font-mono">
          <DialogClose className="absolute right-4 top-4 text-indigo-200 hover:text-white">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          <DialogHeader>
            <DialogTitle className="text-indigo-200 font-mono text-xl">
              Edit Profile
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="firstName"
                className="text-sm text-indigo-200 font-mono"
              >
                FIRST NAME
              </Label>
              <Input
                id="firstName"
                name="firstName"
                defaultValue={profileData.firstName}
                className="bg-indigo-950/60 border border-indigo-400/70 rounded-md px-3 py-2 text-indigo-200 font-mono focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="lastName"
                className="text-sm text-indigo-200 font-mono"
              >
                LAST NAME
              </Label>
              <Input
                id="lastName"
                name="lastName"
                defaultValue={profileData.lastName}
                className="bg-indigo-950/60 border border-indigo-400/70 rounded-md px-3 py-2 text-indigo-200 font-mono focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm text-indigo-200 font-mono"
              >
                EMAIL
              </Label>
              <Input
                id="email"
                name="email"
                value={user.primaryEmailAddress?.emailAddress || ""}
                disabled
                cursorPointerOnDisabled
                className="bg-indigo-950/60 border border-indigo-400/70 rounded-md px-3 py-2 text-indigo-200/50 font-mono"
              />
            </div>
            <Button
              type="submit"
              className="w-full rounded-md font-mono bg-indigo-800/70 hover:bg-indigo-700 text-white transition-all"
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isBillingModalOpen} onOpenChange={setIsBillingModalOpen}>
        <DialogContent className="bg-indigo-950/40 border border-indigo-400/50 rounded-lg text-indigo-200 font-mono">
          <DialogClose className="absolute right-4 top-4 text-indigo-200 hover:text-white">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          <DialogHeader>
            <DialogTitle className="text-indigo-200 font-mono text-xl">
              <CreditCard className="mr-2 h-5 w-5 inline" />
              Buy Credits
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-indigo-300 text-sm">
              Purchase credits to use NewsAI features. $5 per pack of 50
              credits.
            </p>

            <div className="space-y-4">
              {/* Quantity Selector */}
              <div className="bg-indigo-950/60 border border-indigo-400/70 rounded-md p-4">
                <Label className="text-sm text-indigo-200 font-mono mb-3 block">
                  QUANTITY
                </Label>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button
                      onClick={decrementQuantity}
                      disabled={
                        creditQuantity <= 1 || createPaymentSession.isPending
                      }
                      className="h-8 w-8 p-0 bg-indigo-800/70 hover:bg-indigo-700 text-white font-mono"
                    >
                      -
                    </Button>
                    <span className="text-indigo-200 font-mono text-lg w-8 text-center">
                      {creditQuantity}
                    </span>
                    <Button
                      onClick={incrementQuantity}
                      disabled={createPaymentSession.isPending}
                      className="h-8 w-8 p-0 bg-indigo-800/70 hover:bg-indigo-700 text-white font-mono"
                    >
                      +
                    </Button>
                  </div>
                  <div className="text-right">
                    <div className="text-indigo-200 font-mono text-sm">
                      {totalCredits} credits
                    </div>
                    <div className="text-indigo-200 font-mono text-lg font-semibold">
                      ${totalPrice}.00
                    </div>
                  </div>
                </div>
              </div>

              {/* Purchase Button */}
              <Button
                onClick={handleBuyCredits}
                disabled={createPaymentSession.isPending}
                className="w-full rounded-md font-mono bg-purple-800/70 hover:bg-purple-700 text-white transition-all p-4 h-auto border border-purple-400/50"
              >
                <div className="flex items-center justify-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Buy {totalCredits} Credits for ${totalPrice}.00
                </div>
              </Button>
            </div>

            {createPaymentSession.isPending && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Creating payment session...</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
