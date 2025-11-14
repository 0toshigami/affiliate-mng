import os
import shutil

def clear_pycache(path):
    for root, dirs, files in os.walk(path):
        if "__pycache__" in dirs:
            shutil.rmtree(os.path.join(root, "__pycache__"))
            print(f"Removed: {os.path.join(root, '__pycache__')}")

if __name__ == "__main__":
    clear_pycache(".")  # Clears pycache in the current directory and subdirectories