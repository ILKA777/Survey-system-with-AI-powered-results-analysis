package org.example.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.example.model.QuestionType;

import java.util.List;

public record PagePayload(
        @NotBlank String question,
        QuestionType questionType,
        boolean required,
        @Size(max = 30) List<@NotBlank @Size(max = 200) String> options,
        Long dependsOnPageId,
        @Size(max = 200) String dependsOnOption
) {
}
