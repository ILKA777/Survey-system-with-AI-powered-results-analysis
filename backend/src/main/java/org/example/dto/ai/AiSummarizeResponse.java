package org.example.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;

public record AiSummarizeResponse(
        String summary,
        @JsonProperty("csv_data") String csvData
) {
}
