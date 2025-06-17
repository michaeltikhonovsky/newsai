"use client";

import { useState } from "react";
import Link from "next/link";
import { IoVideocamOutline } from "react-icons/io5";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { UserProfileDropdown } from "@/components/auth/UserProfileDropdown";
import { CreditDisplay } from "@/components/CreditDisplay";
import { useUser } from "@clerk/nextjs";

export function Navbar() {
  const { isLoaded, isSignedIn } = useUser();
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);

  return (
    <motion.header
      className="border-b border-gray-800 py-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container-custom flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold flex items-center gap-2">
          <IoVideocamOutline style={{ height: 32, width: 32 }} />
          NewsAI
        </Link>
        <div className="flex items-center gap-4">
          <CreditDisplay />
          <div className="flex gap-2">
            {isLoaded ? (
              isSignedIn ? (
                <UserProfileDropdown />
              ) : (
                <Dialog
                  open={isAuthDialogOpen}
                  onOpenChange={setIsAuthDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="hover:text-accent transition-colors">
                      Sign In
                    </Button>
                  </DialogTrigger>
                  <AuthDialog />
                </Dialog>
              )
            ) : (
              <div className="w-20 h-10" />
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
