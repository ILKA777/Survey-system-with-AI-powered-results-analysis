package org.example.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record SubmitPollRequest(
        @Size(max = 64) String nickname,
        @NotEmpty @Valid List<AnswerPayload> answers
) {
}
