import pytest

from app.utils.country_search import find_country_by_ip


@pytest.mark.parametrize(
    "ip, expected",
    [
        ("119.234.16.231", "SG"),  # Singapore mobile network
        ("81.2.69.142", "GB"),  # UK AAISP test fixture
        ("8.8.8.8", "US"),  # Google DNS (IPv4)
        ("80.80.80.80", "NL"),  # Netherlands – OpenTLD
        ("2001:4860:4860::8888", "US"),  # Google DNS (IPv6)
        ("127.0.0.1", "DEV"),  # loopback short-circuit
        ("192.0.2.1", "IDK"),  # TEST-NET-1 → not in DB
    ],
)
def test_find_country_by_ip(ip, expected):
    """Ensure each code path returns the correct country marker."""
    assert find_country_by_ip(ip) == expected
