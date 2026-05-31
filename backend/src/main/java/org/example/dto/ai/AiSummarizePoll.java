package org.example.dto.ai;

import java.util.List;

public record AiSummarizePoll(
        String title,
        List<AiSummarizePollPage> pages
) {
}
