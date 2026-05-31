package org.example.dto.ai;

public record AiSummarizePollPage(
        int pageOrder,
        String question,
        String questionType,
        boolean required
) {
}
