package org.example.service;

import org.example.config.AiProperties;
import org.example.dto.ai.AiSummarizePoll;
import org.example.dto.ai.AiSummarizePollPage;
import org.example.dto.ai.AiSummarizeRequest;
import org.example.dto.ai.AiSummarizeResponse;
import org.example.dto.ai.AiSummarizeResponseItem;
import org.example.model.Poll;
import org.example.model.PollPage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.netty.http.client.HttpClient;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;

import java.net.URI;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class AiModuleService {
    private static final Logger log = LoggerFactory.getLogger(AiModuleService.class);
    private static final String DISABLED_MESSAGE = "AI модуль отключен (AI_ENABLED=false).";

    private final AiProperties properties;
    private final WebClient webClient;

    public AiModuleService(AiProperties properties) {
        this.properties = properties;
        HttpClient httpClient = HttpClient.create()
                .responseTimeout(Duration.ofMillis(properties.getReadTimeoutMs()))
                .option(io.netty.channel.ChannelOption.CONNECT_TIMEOUT_MILLIS, properties.getConnectTimeoutMs());
        this.webClient = WebClient.builder()
                .baseUrl(properties.getServiceUrl())
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();
    }

    public String summarize(Poll poll, List<Map<String, Object>> rawResults) {
        if (!properties.isEnabled()) {
            return DISABLED_MESSAGE;
        }
        try {
            URI uri = url(properties.getSummarizePath());
            AiSummarizeResponse response = webClient.post()
                    .uri(uri)
                    .bodyValue(new AiSummarizeRequest(
                            toPollPayload(poll),
                            toResponsesPayload(rawResults)
                    ))
                    .retrieve()
                    .bodyToMono(AiSummarizeResponse.class)
                    .block(Duration.ofMillis(properties.getReadTimeoutMs()));

            if (response == null) {
                return "AI модуль вернул пустой ответ.";
            }

            String summary = response.summary();
            if (summary != null && !summary.isBlank()) {
                return summary;
            }
            return "AI модуль вернул пустую суммаризацию.";
        } catch (WebClientResponseException ex) {
            log.warn("AI summarize HTTP error {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            return "AI суммаризация недоступна: HTTP " + ex.getStatusCode().value();
        } catch (Exception ex) {
            log.warn("AI summarize call failed: {}", ex.getMessage());
            return "AI суммаризация недоступна: " + ex.getMessage();
        }
    }

    private AiSummarizePoll toPollPayload(Poll poll) {
        List<AiSummarizePollPage> pages = poll.getPages().stream()
                .sorted((a, b) -> Integer.compare(a.getPageOrder(), b.getPageOrder()))
                .map(this::toPollPagePayload)
                .toList();
        return new AiSummarizePoll(poll.getTitle(), pages);
    }

    private AiSummarizePollPage toPollPagePayload(PollPage page) {
        return new AiSummarizePollPage(
                page.getPageOrder(),
                page.getQuestion(),
                page.getQuestionType().name(),
                page.isRequired()
        );
    }

    private List<AiSummarizeResponseItem> toResponsesPayload(List<Map<String, Object>> rawResults) {
        List<AiSummarizeResponseItem> responses = new ArrayList<>();
        for (Map<String, Object> item : rawResults) {
            Object answersObj = item.get("answers");
            if (!(answersObj instanceof List<?> answers)) {
                continue;
            }
            for (Object answerObj : answers) {
                if (!(answerObj instanceof Map<?, ?> answerMap)) {
                    continue;
                }
                Object text = answerMap.get("textAnswer");
                if (text instanceof String str && !str.isBlank()) {
                    responses.add(new AiSummarizeResponseItem(str.trim()));
                }
            }
        }
        return responses;
    }

    private URI url(String path) {
        String base = properties.getServiceUrl();
        String normalizedPath = path.startsWith("/") ? path : "/" + path;
        return URI.create(base + normalizedPath);
    }
}
