from jose import jwt
from backend.utils import hash_password, verify_password, create_access_token, SECRET_KEY, ALGORITHM


def test_utils_hash_and_verify_password():
    raw = "MyPass123!"
    hashed = hash_password(raw)

    assert hashed != raw
    assert verify_password(raw, hashed) is True
    assert verify_password("wrong", hashed) is False


def test_utils_create_access_token_contains_subject_and_exp():
    token = create_access_token({"sub": "user@example.com"})
    decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

    assert decoded["sub"] == "user@example.com"
    assert "exp" in decoded
