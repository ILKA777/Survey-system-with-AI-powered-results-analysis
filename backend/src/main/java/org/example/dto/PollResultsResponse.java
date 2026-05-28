package org.example.dto;

import java.util.List;
import java.util.Map;

public record PollResultsResponse(
        List<Map<String, Object>> rawResults,
        Map<Long, Map<String, Long>> aggregatedChoiceResults,
        Map<Long, List<String>> textAnswers,
        List<Map<String, Object>> chartData,
        String aiSummary
) {
}
