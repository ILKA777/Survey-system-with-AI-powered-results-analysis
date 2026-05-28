package org.example.dto;

import org.example.model.QuestionType;

import java.util.List;

public record PollPageResponse(
        Long id,
        int pageOrder,
        String question,
        QuestionType questionType,
        boolean required,
        List<String> options,
        Long dependsOnPageId,
        String dependsOnOption
) {
}
