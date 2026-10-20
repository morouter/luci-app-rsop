"""Run with python3 -m unittest discover -s tests (Python 3.11+)."""
import os
from pathlib import Path
import shlex
import subprocess
import tempfile
import tomllib
import unittest


ROOT = Path(__file__).resolve().parents[1]


class ConfigTest(unittest.TestCase):
    def generate(self, values=None):
        values = {"enabled": "1", **(values or {})}
        with tempfile.TemporaryDirectory() as directory:
            config = Path(directory) / "config.toml"
            # Mock the OpenWrt UCI functions, exercising the real init script.
            script = """
config_load() { :; }
config_get() {
    local value
    eval 'value=${uci_'\"$3\"'-'\"$4\"'}'
    export "$1=$value"
}
config_get_bool() { config_get "$@"; }
config_list_foreach() {
    case "$2" in
"""
            for key, value in values.items():
                if isinstance(value, list):
                    calls = "\n".join(
                        '"$3" ' + shlex.quote(item) for item in value
                    )
                    script += f"{key})\n{calls}\n;;\n"
            script += 'esac\n}\n'
            script += ". " + shlex.quote(str(ROOT / "root/etc/init.d/rsop")) + "\n"
            script += "DATA_DIR=" + shlex.quote(directory) + "\n"
            script += "CONFIG_FILE=" + shlex.quote(str(config)) + "\nwrite_config\n"
            env = {
                **os.environ,
                **{
                    "uci_" + key: " ".join(value) if isinstance(value, list) else value
                    for key, value in values.items()
                },
            }
            result = subprocess.run(
                ["sh", "-c", script], env=env, capture_output=True, text=True
            )
            data = tomllib.loads(config.read_text()) if config.exists() else None
            return result, data

    def test_old_config_gets_upstream_defaults(self):
        result, data = self.generate()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(data["base"]["relay_servers"], [])
        self.assertEqual(data["base"]["rendezvous_servers"], [])
        self.assertEqual(data["base"]["config_serial"], 0)
        self.assertEqual(data["log"]["max_files"], 4)
        self.assertEqual(data["extra"], {
            "always_use_relay": False, "udp_receive_buffer": 0,
            "single_bandwidth": 0, "total_bandwidth": 0,
            "blocklist": [], "blacklist": [], "limit_speed": 32,
            "downgrade_threshold": 0.66, "downgrade_start_check": 1800,
            "max_connections": 4096, "max_frame_size": 16777216,
            "enforce_key": True, "relay_buffer_size": 262144,
        })

    def test_lists_and_policy_overrides(self):
        values = {
            "relay_servers": ["relay.example:21117", "[2001:db8::1]:21117"],
            "rendezvous_servers": ["id.example:21116", "[2001:db8::2]:21116"],
            "config_serial": "2147483647", "always_use_relay": "1",
            "udp_receive_buffer": "4194304", "single_bandwidth": "100",
            "total_bandwidth": "500", "limit_speed": "8",
            "blocklist": ["192.0.2.1", "2001:db8::/32"],
            "blacklist": ["198.51.100.0/24", "2001:db8::2"],
            "downgrade_threshold": "0.5", "downgrade_start_check": "60",
            "max_files": "1",
        }
        result, data = self.generate(values)
        self.assertEqual(result.returncode, 0, result.stderr)
        for key, value in values.items():
            section = "base" if key in (
                "relay_servers", "rendezvous_servers", "config_serial"
            ) else "log" if key == "max_files" else "extra"
            expected = value if isinstance(value, list) else float(value)
            self.assertEqual(data[section][key], expected, key)

    def test_string_escaping(self):
        value = 'host\\path"quoted\twith\nnewline'
        result, data = self.generate({"relay_servers": [value]})
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(data["base"]["relay_servers"], [value])

    def test_conflicting_relay_options(self):
        result, data = self.generate({
            "relay_server": "one.example", "relay_servers": ["two.example"],
        })
        self.assertEqual(result.returncode, 1)
        self.assertIn("not both", result.stderr)
        self.assertIsNone(data)

    def test_disabled_service(self):
        result, data = self.generate({"enabled": "0"})
        self.assertEqual(result.returncode, 2)
        self.assertIsNone(data)


if __name__ == "__main__":
    unittest.main()
