#!/usr/bin/env python3
import sys
import subprocess
from cerebras.cloud.sdk import Cerebras

# ---------------------------
# Configuration
# ---------------------------
CEREBRAS_API_KEY = "csk-6jtvhfen2pxrd5x6cx59jwn4x25fhr9ny54edkf2prdnhpd8"  # <-- Put your API key here
MODEL_NAME = "qwen-3-235b-a22b-instruct-2507"  # <-- Your chosen model
MAX_TOKENS = 500

# ---------------------------
# Helper functions
# ---------------------------
def image_to_latex(image_path: str) -> str:
    """Convert image to LaTeX using pix2tex command-line tool."""
    result = subprocess.run(
        ["pix2tex", image_path],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    if result.returncode != 0:
        print("Error converting image to LaTeX:", result.stderr)
        sys.exit(1)
    
    # pix2tex may output "image_path: LaTeX", extract only LaTeX
    latex = result.stdout.strip().split(":", 1)[-1].strip()
    return latex

def ask_cerebras(latex: str) -> str:
    """Send LaTeX to Cerebras and get an explanation."""
    client = Cerebras(api_key=CEREBRAS_API_KEY)
    prompt = f"Explain this equation to me:\n\n{latex}"

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=MAX_TOKENS
    )

    # Access content attribute from the new SDK
    return response.choices[0].message.content

# ---------------------------
# Main
# ---------------------------
def main(image_path: str):
    print("📄 Converting image to LaTeX...")
    latex = image_to_latex(image_path)
    print("\n📄 LaTeX Output:\n")
    print(latex)

    print("\n🤖 Asking Cerebras for an explanation...")
    explanation = ask_cerebras(latex)
    print("\n🤖 Explanation:\n")
    print(explanation)

# ---------------------------
# Entry point
# ---------------------------
if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python pix2tex.py /path/to/image.png")
        sys.exit(1)

    image_path = sys.argv[1]
    main(image_path)
