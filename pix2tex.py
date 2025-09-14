#!/usr/bin/env python3
import os
import sys
import subprocess
from dotenv import load_dotenv
from cerebras.cloud.sdk import Cerebras

# ---------------------------
# Load environment variables from file
# ---------------------------
load_dotenv("api_key.env")  # looks for a file called api_key.env in the same directory
CEREBRAS_API_KEY = os.getenv("CEREBRAS_API_KEY")
if not CEREBRAS_API_KEY:
    print("❌ Error: No API key found in api_key.env (set CEREBRAS_API_KEY).")
    sys.exit(1)

MODEL_NAME = "qwen-3-235b-a22b-instruct-2507"
MAX_TOKENS = 500

def image_to_latex(image_path: str) -> str:
    result = subprocess.run(
        ["pix2tex", image_path],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    if result.returncode != 0:
        print("Error converting image to LaTeX:", result.stderr)
        sys.exit(1)
    return result.stdout.strip().split(":", 1)[-1].strip()

def ask_cerebras(latex: str) -> str:
    client = Cerebras(api_key=CEREBRAS_API_KEY)
    prompt = f"Explain this equation to me:\n\n{latex}"
    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=MAX_TOKENS
    )
    return response.choices[0].message.content

def main(image_path: str):
    print("📄 Converting image to LaTeX...")
    latex = image_to_latex(image_path)
    print("\n📄 LaTeX Output:\n")
    print(latex)
    print("\n🤖 Asking Cerebras for an explanation...")
    print("\n🤖 Explanation:\n")
    print(ask_cerebras(latex))

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python pix2tex.py /path/to/image.png")
        sys.exit(1)
    main(sys.argv[1])
