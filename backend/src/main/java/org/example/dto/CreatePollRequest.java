package org.example.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.example.model.PollType;

import java.util.List;

public record CreatePollRequest(
        @NotNull PollType type,
        @NotBlank @Size(max = 160) String title,
        @Size(max = 500) String description,
        boolean allowAnonymous,
        @NotEmpty @Valid List<PagePayload> pages
) {
}
