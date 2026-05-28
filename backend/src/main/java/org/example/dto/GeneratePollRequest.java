package org.example.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.example.model.PollType;

public record GeneratePollRequest(
        @NotNull PollType type,
        @NotBlank String prompt,
        @Min(1) @Max(10) int pagesCount,
        @Min(2) @Max(10) int optionsPerQuestion,
        boolean allowAnonymous
) {
}
