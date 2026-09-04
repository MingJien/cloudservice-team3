"use client";

import { type ElementType, type ReactNode } from "react";
import { motion } from "framer-motion";

type RevealVariant = "fadeUp" | "fadeDown" | "fadeLeft" | "fadeRight" | "scaleIn" | "blurIn";

interface ScrollRevealProps {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number;
  threshold?: number;
  className?: string;
  as?: "div" | "section" | "article";
}

export function ScrollReveal({
  children,
  variant = "fadeUp",
  delay = 0,
  threshold = 0.15,
  className,
  as = "div",
}: ScrollRevealProps) {
  const variants = {
    fadeUp: {
      hidden: { opacity: 0, y: 60 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } },
    },
    fadeDown: {
      hidden: { opacity: 0, y: -40 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } },
    },
    fadeLeft: {
      hidden: { opacity: 0, x: -60 },
      visible: { opacity: 1, x: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } },
    },
    fadeRight: {
      hidden: { opacity: 0, x: 60 },
      visible: { opacity: 1, x: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } },
    },
    scaleIn: {
      hidden: { opacity: 0, scale: 0.92 },
      visible: { opacity: 1, scale: 1, transition: { duration: 1.0, ease: [0.16, 1, 0.3, 1] } },
    },
    blurIn: {
      hidden: { opacity: 0, y: 20, filter: "blur(12px)" },
      visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1] } },
    }
  };

  let MotionTag: ElementType = motion.div;
  if (as === "section") MotionTag = motion.section;
  else if (as === "article") MotionTag = motion.article;

  const animationVariant = variants[variant] || variants.fadeUp;
  const customTransition = {
    ...animationVariant.visible.transition,
    delay: delay > 0 ? delay / 1000 : 0
  };

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: threshold, margin: "0px 0px -6% 0px" }}
      variants={{
        hidden: animationVariant.hidden,
        visible: { ...animationVariant.visible, transition: customTransition }
      }}
    >
      {children}
    </MotionTag>
  );
}

interface StaggerGroupProps {
  children: ReactNode;
  className?: string;
  staggerMs?: number;
}

export function StaggerGroup({ children, className, staggerMs = 80 }: StaggerGroupProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "0px 0px -6% 0px" }}
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerMs / 1000,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
