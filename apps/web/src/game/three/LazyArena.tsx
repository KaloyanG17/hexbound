"use client";

import dynamic from "next/dynamic";
import styles from "../game.module.css";

// three.js needs the browser, so the arena is only loaded on the client.
export const LazyArena = dynamic(() => import("./Arena"), {
  ssr: false,
  loading: () => <div className={styles.stageLoading}>Loading arena…</div>,
});
