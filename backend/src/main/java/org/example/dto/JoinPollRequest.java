package org.example.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record JoinPollRequest(
        @NotBlank @Size(max = 32) String roomCode,
        @Size(max = 64) String nickname
) {
}
