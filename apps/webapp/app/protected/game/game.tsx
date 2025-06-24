"use client";
import { useEffect, useRef } from "react";
import { initGame, startGameLoop } from "@/game/main";

export default function Game() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let stopLoop: (() => void) | null = null;
    let isCancelled = false;

    const setup = async () => {
      if (!containerRef.current) return;

      const app = await initGame(containerRef.current);

      if (isCancelled) {
        app.pixi.destroy(true);
        return;
      }

      startGameLoop(app);

      stopLoop = app.pixi.ticker.destroy;
    };

    setup();

    return () => {
      isCancelled = true;
      if (stopLoop) stopLoop();
    };
  }, []);

  return <div ref={containerRef} />;
}
