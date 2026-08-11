#!/usr/bin/env python3
"""
Publish Script untuk Trexo CI/CD
Trigger Jenkins deployment dari laptop lokal

Penggunaan:
    python publish_trexo.py              # Deploy ke production
    python publish_trexo.py --test       # Test koneksi
    python publish_trexo.py --status     # Cek status build terakhir
"""

import argparse
import sys
import requests
import json
import time
from pathlib import Path

# ==================== KONFIGURASI ====================
# Ganti dengan konfigurasi Jenkins Anda
JENKINS_URL = "http://your-vps-ip:8080"  # Ganti dengan IP VPS Anda
JENKINS_USER = "admin"                    # Username Jenkins
JENKINS_TOKEN = "your-api-token"         # API Token Jenkins (dari /configure/credentials)
JOB_NAME = "trexo"                       # Nama job di Jenkins

# Atau gunakan environment variable untuk keamanan
import os
JENKINS_URL = os.getenv("JENKINS_URL", JENKINS_URL)
JENKINS_USER = os.getenv("JENKINS_USER", JENKINS_USER)
JENKINS_TOKEN = os.getenv("JENKINS_TOKEN", JENKINS_TOKEN)


class JenkinsPublisher:
    def __init__(self, url, username, token):
        self.url = url.rstrip('/')
        self.auth = (username, token)
        self.api_url = f"{self.url}/job/{JOB_NAME}"

    def test_connection(self):
        """Test koneksi ke Jenkins"""
        print(f"🔍 Testing connection to {self.url}...")

        try:
            response = requests.get(f"{self.url}/api/json", auth=self.auth, timeout=10)

            if response.status_code == 200:
                print(f"✅ Connection successful! Jenkins version: {response.json().get('description', 'unknown')}")
                return True
            else:
                print(f"❌ Connection failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Error: {e}")
            return False

    def trigger_build(self, parameters=None):
        """Trigger build di Jenkins"""
        print(f"🚀 Triggering build for job: {JOB_NAME}")

        try:
            # Build dengan API token
            build_url = f"{self.api_url}/build"

            if parameters:
                # Jika job parameterized
                build_url += "?api/json"
                response = requests.post(
                    build_url,
                    auth=self.auth,
                    json={"parameter": parameters},
                    timeout=30
                )
            else:
                # Simple build trigger
                response = requests.post(
                    f"{self.api_url}/build",
                    auth=self.auth,
                    timeout=30
                )

            if response.status_code in [200, 201]:
                print("✅ Build triggered successfully!")

                # Get queue location
                if 'Location' in response.headers:
                    queue_url = response.headers['Location']
                    print(f"📍 Queue URL: {queue_url}")

                return True
            else:
                print(f"❌ Failed to trigger build: {response.status_code}")
                print(f"Response: {response.text}")
                return False

        except Exception as e:
            print(f"❌ Error: {e}")
            return False

    def get_last_build_status(self):
        """Get status build terakhir"""
        print(f"📊 Getting last build status...")

        try:
            response = requests.get(
                f"{self.api_url}/lastBuild/api/json",
                auth=self.auth,
                timeout=10
            )

            if response.status_code == 200:
                data = response.json()

                status = "🟡 In Progress"
                if data.get('building') is False:
                    if data.get('result') == 'SUCCESS':
                        status = "✅ Success"
                    elif data.get('result') == 'FAILURE':
                        status = "❌ Failed"
                    elif data.get('result') == 'ABORTED':
                        status = "⚠️ Aborted"

                print(f"""
Build #{data.get('number', 'N/A')}
Status: {status}
URL: {data.get('url', 'N/A')}
Duration: {data.get('duration', 'N/A') / 1000:.2f}s
Started: {data.get('timestamp', 'N/A')}
                """)

                return data
            else:
                print(f"❌ Failed to get status: {response.status_code}")
                return None

        except Exception as e:
            print(f"❌ Error: {e}")
            return None

    def wait_for_build(self, timeout=300, check_interval=10):
        """Tunggu build selesai dengan console output"""
        print(f"⏳ Waiting for build to complete (timeout: {timeout}s)...")

        try:
            # Get last build number
            response = requests.get(
                f"{self.api_url}/lastBuild/api/json",
                auth=self.auth,
                timeout=10
            )
            build_number = response.json().get('number')

            start_time = time.time()
            last_output = 0

            while time.time() - start_time < timeout:
                # Check build status
                response = requests.get(
                    f"{self.api_url}/lastBuild/api/json",
                    auth=self.auth,
                    timeout=10
                )

                if response.status_code == 200:
                    data = response.json()

                    # Get console output
                    console_response = requests.get(
                        f"{self.api_url}/lastBuild/consoleText",
                        auth=self.auth,
                        timeout=10
                    )

                    if console_response.status_code == 200:
                        output = console_response.text
                        # Print new output only
                        if len(output) > last_output:
                            print(output[last_output:], end='')
                            last_output = len(output)

                    # Check if build complete
                    if not data.get('building', True):
                        result = data.get('result')
                        print(f"\n\n{'='*50}")
                        if result == 'SUCCESS':
                            print("✅ Build completed successfully!")
                        else:
                            print(f"❌ Build failed with result: {result}")
                        print(f"{'='*50}")
                        return result == 'SUCCESS'

                time.sleep(check_interval)

            print(f"\n⏰ Timeout waiting for build")
            return False

        except Exception as e:
            print(f"\n❌ Error: {e}")
            return False


def create_example_env():
    """Buat file .env.example sebagai template"""
    env_content = """# Jenkins Configuration
JENKINS_URL=http://your-vps-ip:8080
JENKINS_USER=admin
JENKINS_TOKEN=your-api-token-here

# Cara dapatkan API Token:
# 1. Login ke Jenkins
# 2. Klik profile → Configure
# 3. API Token → Add new Token
"""

    with open('.env.example', 'w') as f:
        f.write(env_content)

    print("✅ Created .env.example file")


def main():
    parser = argparse.ArgumentParser(
        description='Trexo CI/CD Publisher - Trigger Jenkins dari laptop'
    )
    parser.add_argument(
        '--test', '-t',
        action='store_true',
        help='Test koneksi ke Jenkins'
    )
    parser.add_argument(
        '--status', '-s',
        action='store_true',
        help='Cek status build terakhir'
    )
    parser.add_argument(
        '--wait', '-w',
        action='store_true',
        help='Tunggu build selesai dan tampilkan progress'
    )
    parser.add_argument(
        '--env-file', '-e',
        default='.env',
        help='Path ke environment file (default: .env)'
    )
    parser.add_argument(
        '--create-env',
        action='store_true',
        help='Buat template .env.example'
    )

    args = parser.parse_args()

    # Create env template jika diminta
    if args.create_env:
        create_example_env()
        return 0

    # Load env file jika ada
    env_path = Path(args.env_file)
    if env_path.exists():
        print(f"📄 Loading environment from {args.env_file}")
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()

    # Validate configuration
    if not all([JENKINS_URL, JENKINS_USER, JENKINS_TOKEN]):
        print("❌ Error: Jenkins configuration tidak lengkap!")
        print("\nSilakan set berikut:")
        print("  1. Environment variable:")
        print("     export JENKINS_URL=http://your-vps:8080")
        print("     export JENKINS_USER=admin")
        print("     export JENKINS_TOKEN=your-token")
        print("\n  2. Atau gunakan .env file:")
        print("     python publish_trexo.py --create-env")
        print("     # Edit .env file tersebut")
        print("     python publish_trexo.py --env-file .env")
        return 1

    # Create publisher instance
    publisher = JenkinsPublisher(JENKINS_URL, JENKINS_USER, JENKINS_TOKEN)

    # Test mode
    if args.test:
        success = publisher.test_connection()
        return 0 if success else 1

    # Status mode
    if args.status:
        publisher.get_last_build_status()
        return 0

    # Default: trigger build
    if not publisher.trigger_build():
        return 1

    # Wait mode
    if args.wait:
        success = publisher.wait_for_build(timeout=600, check_interval=5)
        return 0 if success else 1
    else:
        print("\n💡 Gunakan --wait untuk melihat progress build")
        print(f"   Atau buka {JENKINS_URL}/job/{JOB_NAME}/lastBuild/console")

    return 0


if __name__ == "__main__":
    sys.exit(main())
