"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ChevronLeft,
  Rocket,
  Sparkles,
  Zap,
  TextIcon as Telegram,
  DiscIcon as Discord,
} from "lucide-react";
import { motion } from "framer-motion";
import coin from "../assets/Coin.png";
import character from "../assets/Character.png";

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-black"></div>
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-yellow-500/20 blur-3xl"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 300 + 100}px`,
              height: `${Math.random() * 300 + 100}px`,
              opacity: Math.random() * 0.5,
              transform: `translate(-50%, -50%)`,
              animation: `float ${
                Math.random() * 10 + 20
              }s infinite ease-in-out`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Mouse follower */}
      <div
        className="fixed w-40 h-40 rounded-full bg-yellow-500/10 blur-xl pointer-events-none z-0"
        style={{
          left: mousePosition.x,
          top: mousePosition.y,
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Navigation */}
      <header className="container mx-auto py-4 px-4 relative z-10 flex justify-center items-center">
        <motion.nav
          className="flex flex-col md:flex-row justify-center items-center gap-6"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="#"
            className="text-sm hover:text-yellow-500 transition-colors"
          >
            HOME
          </Link>
          <Link
            href="#about"
            className="text-sm hover:text-yellow-500 transition-colors"
          >
            ABOUT
          </Link>
          <Link
            href="#features"
            className="text-sm hover:text-yellow-500 transition-colors"
          >
            FEATURES
          </Link>
          <Link
            href="#launch"
            className="text-sm hover:text-yellow-500 transition-colors"
          >
            LAUNCH
          </Link>
        </motion.nav>
      </header>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="container mx-auto py-16 px-10 text-center relative z-10 min-h-[80vh] flex flex-col justify-center"
      >
        <motion.div
          className="relative mb-4 inline-block"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.2,
          }}
        >
          <motion.div
            className="absolute -top-8 -left-8"
            animate={{
              rotate: [0, 10, 0, -10, 0],
            }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: 5,
            }}
          >
            <div className="bg-yellow-500 rounded-full p-2">
              <span className="text-black font-bold text-xs">🔥</span>
            </div>
          </motion.div>
          <motion.div
            animate={{
              y: [0, -10, 0, 10, 0],
            }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: 5,
            }}
          >
            <Image
              src={coin}
              alt="Pump.flawk Monkey"
              width={180}
              height={180}
              className="mx-auto"
            />
          </motion.div>
        </motion.div>

        <motion.h1
          className="text-7xl md:text-9xl font-extrabold mb-4 tracking-tighter"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-600">
            Pump.flawk
          </span>
        </motion.h1>

        <motion.p
          className="text-xl md:text-2xl mb-8 text-yellow-300/80"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          The Ultimate Memecoin Launchpad
        </motion.p>

        <motion.div
          className="flex flex-col items-center gap-6 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <motion.button
              onClick={() => router.push("Home")}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg rounded-full px-8 py-6 mt-4"
            >
              Launch Your Memecoin
            </motion.button>
          </motion.div>
          <p className="text-zinc-400">
            Join the revolution. Create the next big meme.
          </p>
        </motion.div>
      </section>

      {/* About Section */}
      <section
        id="about"
        className="container mx-auto py-24 px-20 relative z-10"
      >
        <motion.div
          className="flex items-center gap-2 mb-12"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-5xl font-bold">About</h2>
          <motion.div
            className="bg-yellow-500 rounded-full p-1"
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: 2,
            }}
          >
            <span className="text-black font-bold text-xs">🔥</span>
          </motion.div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-zinc-300 mb-8 text-lg">
              Pump.flawk is the ultimate memecoin launchpad on the Solana
              blockchain. We're bringing the fun back to crypto and helping
              creators launch the next viral sensation. Our platform makes it
              easy to create, launch, and grow your memecoin with powerful tools
              and an engaged community.
            </p>
            <div className="space-y-6">
              <motion.div
                className="flex items-start gap-3"
                whileHover={{ x: 10 }}
              >
                <div className="bg-yellow-500 rounded-full p-2 mt-1">
                  <Sparkles className="h-4 w-4 text-black" />
                </div>
                <p className="font-semibold text-lg">
                  Launch your memecoin in minutes, not days.
                </p>
              </motion.div>
              <motion.div
                className="flex items-start gap-3"
                whileHover={{ x: 10 }}
              >
                <div className="bg-yellow-500 rounded-full p-2 mt-1">
                  <Zap className="h-4 w-4 text-black" />
                </div>
                <p className="font-semibold text-lg">
                  Access our network of influencers and marketers.
                </p>
              </motion.div>
              <motion.div
                className="flex items-start gap-3"
                whileHover={{ x: 10 }}
              >
                <div className="bg-yellow-500 rounded-full p-2 mt-1">
                  <Rocket className="h-4 w-4 text-black" />
                </div>
                <p className="font-semibold text-lg">
                  Join the fastest growing memecoin ecosystem.
                </p>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.div
              animate={{
                y: [0, -20, 0],
                rotate: [0, 5, 0, -5, 0],
              }}
              transition={{
                repeat: Number.POSITIVE_INFINITY,
                duration: 8,
              }}
            >
              <Image
                src={character}
                alt="Pump.flawk Monkey with Accessories"
                width={240}
                height={240}
                className="drop-shadow-[0_0_25px_rgba(234,179,8,0.3)]"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="container mx-auto py-24 px-4 relative z-10"
      >
        <motion.h2
          className="text-5xl font-bold mb-16 text-center"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Launchpad Features
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Token Creation",
              description:
                "Create your memecoin with custom tokenomics, name, and supply in just a few clicks.",
              icon: <Sparkles className="h-8 w-8 text-yellow-500" />,
            },
            {
              title: "Liquidity Management",
              description:
                "Easily manage liquidity pools and token distribution with our intuitive interface.",
              icon: <Zap className="h-8 w-8 text-yellow-500" />,
            },
            {
              title: "Marketing Tools",
              description:
                "Access powerful marketing tools to promote your memecoin and reach potential investors.",
              icon: <Rocket className="h-8 w-8 text-yellow-500" />,
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-8 border border-zinc-800 hover:border-yellow-500/50 transition-colors"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{
                y: -10,
                boxShadow:
                  "0 20px 25px -5px rgba(234, 179, 8, 0.1), 0 8px 10px -6px rgba(234, 179, 8, 0.1)",
              }}
            >
              <motion.div
                className="mb-6"
                whileHover={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
              >
                {feature.icon}
              </motion.div>
              <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
              <p className="text-zinc-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section
        id="launch"
        className="container mx-auto py-24 px-4 relative z-10"
      >
        <motion.div
          className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 rounded-3xl p-12 border border-yellow-500/20 backdrop-blur-sm"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center max-w-3xl mx-auto">
            <motion.h2
              className="text-4xl md:text-5xl font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Ready to Launch Your Memecoin?
            </motion.h2>
            <motion.p
              className="text-xl text-zinc-300 mb-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Join the Pump.flawk launchpad today and create the next viral
              sensation in the crypto world.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.button 
              onClick={() => router.push("/page")}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg rounded-full px-10 py-6">
                Get Started Now
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900/50 backdrop-blur-sm py-12 relative z-10">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Image
              src={coin}
              alt="Pump.flawk Logo"
              width={80}
              height={80}
              className="mx-auto mb-4"
            />
            <p className="text-zinc-400 text-sm max-w-2xl mx-auto">
              Pump.flawk is a memecoin launchpad platform. All memecoins
              launched through our platform are created by their respective
              teams. Pump.flawk does not guarantee the performance of any tokens
              launched on our platform.
            </p>
          </motion.div>

          <motion.div
            className="text-center text-zinc-500 text-xs"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            © {new Date().getFullYear()} Pump.flawk Launchpad. All rights
            reserved.
          </motion.div>
        </div>
      </footer>
    </div>
  );
}
