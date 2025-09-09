import subprocess
import sys
import os

def run_backend_tests():
    """
    Runs all backend tests using pytest.
    This script assumes pytest is installed in the environment.
    """
    print("Starting backend tests...")
    
    # Navigate to the backend directory to ensure pytest finds conftest.py and app modules correctly
    original_cwd = os.getcwd()
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    os.chdir(backend_dir)

    try:
        # Run pytest on the 'tests' directory
        # -s: show stdout/stderr from tests
        # -v: verbose output
        # --tb=short: short traceback format
        result = subprocess.run([sys.executable, "-m", "pytest", "tests", "-s", "-v", "--tb=short"], check=False)
        
        if result.returncode == 0:
            print("\n✅ All backend tests passed successfully!")
        else:
            print(f"\n❌ Backend tests failed with exit code {result.returncode}")
            sys.exit(result.returncode)
    except FileNotFoundError:
        print("\nError: pytest command not found. Please ensure pytest is installed (pip install pytest).")
        sys.exit(1)
    except Exception as e:
        print(f"\nAn unexpected error occurred: {e}")
        sys.exit(1)
    finally:
        # Navigate back to the original working directory
        os.chdir(original_cwd)

if __name__ == "__main__":
    run_backend_tests()