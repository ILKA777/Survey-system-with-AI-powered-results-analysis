package org.example.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record AnswerPayload(
        @NotNull Long pageId,
        @Size(max = 30) List<String> selectedOptions,
        @Size(max = 1000) String textAnswer
) {
}
