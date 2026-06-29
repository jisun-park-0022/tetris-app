"""auth.py 유틸 함수 단위 테스트 (hash_password, verify_password, create_access_token)"""
from datetime import timedelta

import pytest
from jose import jwt, JWTError

from auth import (
    hash_password,
    verify_password,
    create_access_token,
    SECRET_KEY,
    ALGORITHM,
)


class TestHashPassword:
    def test_returns_hashed_string(self):
        hashed = hash_password("mypassword")
        assert isinstance(hashed, str)

    def test_hash_is_not_plaintext(self):
        assert hash_password("mypassword") != "mypassword"

    def test_different_hashes_for_same_password(self):
        # bcrypt는 매 호출마다 랜덤 솔트를 사용하므로 결과가 달라야 한다
        h1 = hash_password("mypassword")
        h2 = hash_password("mypassword")
        assert h1 != h2

    def test_empty_string_is_hashable(self):
        hashed = hash_password("")
        assert isinstance(hashed, str)


class TestVerifyPassword:
    def test_correct_password_returns_true(self):
        hashed = hash_password("mypassword")
        assert verify_password("mypassword", hashed) is True

    def test_wrong_password_returns_false(self):
        hashed = hash_password("mypassword")
        assert verify_password("wrongpassword", hashed) is False

    def test_empty_password_returns_false(self):
        hashed = hash_password("mypassword")
        assert verify_password("", hashed) is False

    def test_case_sensitive(self):
        hashed = hash_password("Password123")
        assert verify_password("password123", hashed) is False
        assert verify_password("Password123", hashed) is True


class TestCreateAccessToken:
    def test_returns_string(self):
        token = create_access_token({"sub": "user@example.com"})
        assert isinstance(token, str)

    def test_token_contains_subject(self):
        token = create_access_token({"sub": "user@example.com"})
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "user@example.com"

    def test_token_contains_expiry(self):
        token = create_access_token({"sub": "user@example.com"})
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert "exp" in payload

    def test_custom_expiry_delta(self):
        import time
        before = time.time()
        token = create_access_token({"sub": "u@e.com"}, expires_delta=timedelta(minutes=1))
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        after = time.time()
        # exp는 현재 UTC 시각 + 약 1분(60초) 이어야 한다
        assert payload["exp"] > before + 55   # 최소 55초 이후
        assert payload["exp"] < after + 65    # 최대 65초 이내

    def test_additional_claims_preserved(self):
        token = create_access_token({"sub": "u@e.com", "role": "admin"})
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["role"] == "admin"

    def test_wrong_secret_raises(self):
        token = create_access_token({"sub": "u@e.com"})
        with pytest.raises(JWTError):
            jwt.decode(token, "wrong-secret", algorithms=[ALGORITHM])
