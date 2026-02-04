import type { GameState } from "../types";
import { xy } from "./grid";

/**
 * Simple Canvas renderer: clean, minimal, and fast.
 * You can replace this with sprites later if you like.
 */
export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context not available");
    this.ctx = ctx;
    this.canvas = canvas;
  }

  draw(state: GameState) {
    const { w, h } = state;
    const ctx = this.ctx;

    // Compute cell size to fit in canvas
    const pad = 10;
    const cell = Math.floor(
      Math.min(
        (this.canvas.width - pad * 2) / w,
        (this.canvas.height - pad * 2) / h,
      ),
    );
    const ox = Math.floor((this.canvas.width - cell * w) / 2);
    const oy = Math.floor((this.canvas.height - cell * h) / 2);

    // Background
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i < w * h; i++) {
      const { x, y } = xy(i, w);
      const px = ox + x * cell;
      const py = oy + y * cell;

      // Floor
      ctx.fillStyle = "rgba(127,127,127,0.10)";
      ctx.fillRect(px, py, cell, cell);

      // Wall
      if (state.walls[i]) {
        ctx.fillStyle = "rgba(127,127,127,0.55)";
        ctx.fillRect(px, py, cell, cell);
        continue;
      }

      // Goal
      if (state.goals[i]) {
        ctx.strokeStyle = "rgba(127,127,127,0.90)";
        ctx.lineWidth = Math.max(2, Math.floor(cell / 12));
        ctx.beginPath();
        ctx.arc(px + cell / 2, py + cell / 2, cell * 0.18, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Box
      if (state.boxes[i]) {
        ctx.fillStyle = state.goals[i]
          ? "rgba(80,180,120,0.65)"
          : "rgba(220,170,80,0.65)";
        const m = Math.floor(cell * 0.12);
        ctx.fillRect(px + m, py + m, cell - 2 * m, cell - 2 * m);
      }

      // Player
      if (state.player === i) {
        ctx.fillStyle = "rgba(90,150,230,0.80)";
        ctx.beginPath();
        ctx.arc(px + cell / 2, py + cell / 2, cell * 0.22, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Grid lines (subtle)
    ctx.strokeStyle = "rgba(127,127,127,0.12)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x++) {
      ctx.beginPath();
      ctx.moveTo(ox + x * cell, oy);
      ctx.lineTo(ox + x * cell, oy + h * cell);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y++) {
      ctx.beginPath();
      ctx.moveTo(ox, oy + y * cell);
      ctx.lineTo(ox + w * cell, oy + y * cell);
      ctx.stroke();
    }
  }
}
