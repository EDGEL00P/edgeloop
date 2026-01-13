#!/usr/bin/env python3
"""
NFL Singularity Supercomputer - Main Entry Point
Runs the Python ML engine on port 8000
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from python_engine.api import run_server

if __name__ == '__main__':
    port = int(os.environ.get('PYTHON_PORT', 8000))
    print(f"Starting NFL Singularity Supercomputer on port {port}...")
    print("Monte Carlo: 100,000 iterations")
    print("Neural Network: MLP (128, 64, 32)")
    print("Correlation Matrix: Cholesky Decomposition")
    print("Kelly Staking: Multi-dimensional optimization")
    run_server(port)
