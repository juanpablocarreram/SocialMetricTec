import { motion, stagger, type Variants } from 'motion/react';

const containerVariants: Variants = {
  rest: {},
  hover: {
    transition: {
      delayChildren: stagger(0.06),
    },
  },
};

const itemVariants: Variants = {
  rest: { scale: 1 },
  hover: {
    scale: [1, 1.25, 0.9, 1],
    transition: {
      duration: 0.35,
      ease: 'easeInOut',
    },
  },
};

export default function LogoSVG({ className }: { className?: string }) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 220 340"
      fill="none"
      className={className}
      variants={containerVariants}
    >
      {/* Teal — top left */}
      <motion.rect x="0" y="0" width="100" height="100" rx="20" fill="#0BA599" variants={itemVariants} />
      {/* Orange — top right */}
      <motion.rect x="120" y="0" width="100" height="100" rx="20" fill="#E89018" variants={itemVariants} />
      {/* Coral — mid left */}
      <motion.rect x="0" y="120" width="100" height="100" rx="20" fill="#E0564E" variants={itemVariants} />
      {/* Purple — mid right */}
      <motion.rect x="120" y="120" width="100" height="100" rx="20" fill="#7C30AA" variants={itemVariants} />
      {/* Empty circle — bottom left */}
      <motion.circle cx="50" cy="290" r="46" stroke="#CCCCCC" strokeWidth="3" fill="white" variants={itemVariants} />
      {/* Blue — bottom right */}
      <motion.rect x="120" y="240" width="100" height="100" rx="20" fill="#5A8FBE" variants={itemVariants} />
    </motion.svg>
  );
}
