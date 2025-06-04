"use client";

import { Button } from "@/components/ui/button";
import { IoVideocamOutline } from "react-icons/io5";
import { motion } from "framer-motion";

export default function Home() {
  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      {/* Header */}
      <motion.header
        className="border-b border-gray-800 py-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container-custom flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {" "}
            <IoVideocamOutline style={{ height: 32, width: 32 }} />
            NewsAI
          </h1>
          <Button className="hover:text-accent transition-colors">
            Sign In
          </Button>
        </div>
      </motion.header>

      {/* Main Section */}
      <main className="flex-1">
        <div className="container-custom grid grid-cols-1 md:grid-cols-2 gap-12 py-16 md:py-24">
          <motion.div
            className="flex flex-col justify-center"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <div className="space-y-6">
              <motion.div variants={fadeIn} transition={{ duration: 0.6 }}>
                <div className="header-text mb-1">
                  GENERATE <br />
                  NEWS CLIPS <br />
                  WITH AI
                </div>
              </motion.div>

              <motion.p
                className="text-lg max-w-md"
                style={{ color: "#AAAAAA" }}
                variants={fadeIn}
                transition={{ duration: 0.6 }}
              >
                {">"} Create realistic news broadcasts with AIpowered lipsync
                technology.
              </motion.p>

              <motion.div variants={fadeIn} transition={{ duration: 0.6 }}>
                <Button className="btn-primary mt-4 w-fit">
                  $ Start Creating
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Video Demo */}
          <motion.div
            className="flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
          >
            <div
              className="relative w-full max-w-lg aspect-video rounded-lg border border-gray-800 flex flex-col items-center justify-center"
              style={{ background: "#1A1A1A" }}
            >
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <IoVideocamOutline style={{ height: 48, width: 48 }} />
                </div>
                <h3 className="text-xl font-bold">LIVE DEMO</h3>
                <p className="mt-2" style={{ color: "#AAAAAA" }}>
                  Click to play sample
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Features Section */}
        <div className="py-16" style={{ background: "#1A1A1A" }}>
          <div className="container-custom">
            <motion.h2
              className="text-3xl font-bold mb-12 text-center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              &lt;Features/&gt;
            </motion.h2>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.3,
                  },
                },
              }}
            >
              {/* Feature 1 */}
              <motion.div
                className="p-6 rounded-lg border border-gray-800"
                style={{ background: "#0F0F0F" }}
                variants={{
                  hidden: { opacity: 0, y: 50 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
                }}
              >
                <div
                  className="mb-4 inline-block p-3 rounded-lg"
                  style={{ background: "#1A1A1A" }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"
                      stroke="white"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M3 12C3 12 6 5 12 5C18 5 21 12 21 12C21 12 18 19 12 19C6 19 3 12 3 12Z"
                      stroke="white"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {">"} AI powered Lipsync
                </h3>
                <p style={{ color: "#AAAAAA" }}>
                  Perfect synchronization between audio and video for realistic
                  news presentations.
                </p>
              </motion.div>

              {/* Feature 2 */}
              <motion.div
                className="p-6 rounded-lg border border-gray-800"
                style={{ background: "#0F0F0F" }}
                variants={{
                  hidden: { opacity: 0, y: 50 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
                }}
              >
                <div
                  className="mb-4 inline-block p-3 rounded-lg"
                  style={{ background: "#1A1A1A" }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 12L10 17L20 7"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">{">"} High Quality</h3>
                <p style={{ color: "#AAAAAA" }}>
                  Crystal clear 4K video output with professional-grade audio
                  processing.
                </p>
              </motion.div>

              {/* Feature 3 */}
              <motion.div
                className="p-6 rounded-lg border border-gray-800"
                style={{ background: "#0F0F0F" }}
                variants={{
                  hidden: { opacity: 0, y: 50 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
                }}
              >
                <div
                  className="mb-4 inline-block p-3 rounded-lg"
                  style={{ background: "#1A1A1A" }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 6V12L16 14"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      stroke="white"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">{">"} Fast Rendering</h3>
                <p style={{ color: "#AAAAAA" }}>
                  Generate news clips in minutes, not hours, with our optimized
                  AI pipeline.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <motion.footer
        className="border-t border-gray-800 py-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div
          className="container-custom text-center"
          style={{ color: "#AAAAAA" }}
        >
          <p>© 2025 NewsAI. All rights reserved.</p>
        </div>
      </motion.footer>
    </div>
  );
}
