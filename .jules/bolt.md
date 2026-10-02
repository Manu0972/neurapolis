# Bolt Performance Benchmark Log - NEURAPOLIS

## 2026-10-02 - 60 FPS Camera Reuse & 5,000 Ticks Simulation Acceleration

### Benchmarks
- **Target**: 5,000 Continuous Simulation Ticks
- **Execution Time**: **137.25 ms** (well under 1,500 ms performance budget)
- **Average Tick Processing**: **~0.027 ms / tick**
- **Heap Growth**: Controlled memory delta during continuous simulation runs

### Key Optimization Highlights
1. **Zero-Allocation Camera Computation (`src/presentation/renderer.ts`)**:
   - Replaced temporary `{ ts, ox, oy }` heap allocations with a static camera object `STATIC_CAM` reused across 60 FPS animation frames.
2. **Loop Micro-Tick Efficiency (`src/simulation/engine.ts`)**:
   - Streamlined `runTicks` loop execution to eliminate intermediate snapshot clones during high-speed time skips.
