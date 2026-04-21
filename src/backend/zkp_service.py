from __future__ import annotations

import json
import subprocess
import tempfile
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parent
ZKP_ROOT = BACKEND_ROOT / "zkp"


def generate_proof(circuit: str, inputs: dict) -> dict:
    circuit_dir = ZKP_ROOT / circuit
    wasm_path = circuit_dir / f"{circuit}.wasm"
    zkey_path = circuit_dir / f"{circuit}_final.zkey"

    if not wasm_path.exists():
        raise RuntimeError(f"Missing WASM file for circuit '{circuit}': {wasm_path}")
    if not zkey_path.exists():
        raise RuntimeError(f"Missing zkey file for circuit '{circuit}': {zkey_path}")

    node_script = r"""
const fs = require("fs");
const snarkjs = require("snarkjs");

const inputPath = process.argv[1];
const wasmPath = process.argv[2];
const zkeyPath = process.argv[3];

(async () => {
  try {
    const input = JSON.parse(fs.readFileSync(inputPath, "utf8"));
    const result = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);
    process.stdout.write(JSON.stringify({ proof: result.proof, publicSignals: result.publicSignals }));
  } catch (error) {
    const message = error && error.stack ? error.stack : String(error);
    process.stderr.write(message);
    process.exit(1);
  }
})();
"""

    temp_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile("w", delete=False, suffix=".json") as handle:
            json.dump(inputs, handle)
            temp_path = Path(handle.name)

        completed = subprocess.run(
            ["node", "-e", node_script, str(temp_path), str(wasm_path), str(zkey_path)],
            capture_output=True,
            text=True,
            check=False,
        )
    except FileNotFoundError as exc:
        raise RuntimeError(
            "Node.js is not installed or not available on PATH. Install Node.js and npm, then run `npm install snarkjs`."
        ) from exc
    finally:
        if temp_path is not None and temp_path.exists():
            temp_path.unlink()

    if completed.returncode != 0:
        stderr = completed.stderr.strip()
        if "snarkjs" in stderr:
            raise RuntimeError(
                "snarkjs is not installed in the Node environment. Run `npm install snarkjs` before generating proofs."
            )
        raise RuntimeError(
            f"Proof generation failed for circuit '{circuit}': {stderr or completed.stdout.strip()}"
        )

    try:
        return json.loads(completed.stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            f"Proof generation returned invalid JSON for circuit '{circuit}': {completed.stdout.strip()}"
        ) from exc


def format_proof_for_solidity(proof: dict) -> tuple:
    pi_a = proof.get("pi_a") or proof.get("piA")
    pi_b = proof.get("pi_b") or proof.get("piB")
    pi_c = proof.get("pi_c") or proof.get("piC")

    if pi_a is None or pi_b is None or pi_c is None:
        raise RuntimeError("Invalid snarkjs proof object")

    p_a = (pi_a[0], pi_a[1])
    p_b = (
        (pi_b[0][1], pi_b[0][0]),
        (pi_b[1][1], pi_b[1][0]),
    )
    p_c = (pi_c[0], pi_c[1])
    return p_a, p_b, p_c
