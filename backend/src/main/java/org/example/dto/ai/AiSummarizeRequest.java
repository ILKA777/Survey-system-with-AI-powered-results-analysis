package org.example.dto.ai;

import java.util.List;

public record AiSummarizeRequest(
        AiSummarizePoll poll,
        List<AiSummarizeResponseItem> responses
) {
}
