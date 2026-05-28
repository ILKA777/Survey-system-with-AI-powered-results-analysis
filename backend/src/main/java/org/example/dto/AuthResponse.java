package org.example.dto;

public record AuthResponse(
        Long userId,
        String nickname,
        boolean anonymous,
        String token
) {
}
