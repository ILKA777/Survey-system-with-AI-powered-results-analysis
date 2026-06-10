package org.example.dto;

import org.example.model.PollStatus;
import org.example.model.PollType;

import java.time.OffsetDateTime;
import java.util.List;

public record PollResponse(
        Long id,
        PollType type,
        String title,
        String description,
        String roomCode,
        String joinLink,
        String qrPayload,
        boolean allowAnonymous,
        PollStatus status,
        String aiSummary,
        OffsetDateTime createdAt,
        List<PollPageResponse> pages
) {
}
