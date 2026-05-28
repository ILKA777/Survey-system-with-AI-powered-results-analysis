package org.example.service;

import org.example.dto.PagePayload;
import org.example.model.PollType;
import org.example.model.QuestionType;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class AiMockService {

    public List<PagePayload> generatePages(PollType type, String prompt, int pagesCount, int optionsPerQuestion) {
        int actualPages = type == PollType.VOTE ? 1 : Math.max(1, pagesCount);
        List<PagePayload> pages = new ArrayList<>();
        for (int i = 0; i < actualPages; i++) {
            String question = "AI mock: " + prompt + " (вопрос " + (i + 1) + ")";
            QuestionType questionType = type == PollType.VOTE ? QuestionType.MULTIPLE_CHOICE : QuestionType.SINGLE_CHOICE;
            List<String> options = new ArrayList<>();
            for (int j = 0; j < optionsPerQuestion; j++) {
                options.add("Вариант " + (char) ('A' + j));
            }
            pages.add(new PagePayload(question, questionType, true, options, null, null));
        }
        return pages;
    }

    public String summarize(Map<Long, Map<String, Long>> aggregatedResults) {
        String winner = null;
        long max = -1L;
        for (Map<String, Long> perQuestion : aggregatedResults.values()) {
            for (Map.Entry<String, Long> entry : perQuestion.entrySet()) {
                if (entry.getValue() > max) {
                    max = entry.getValue();
                    winner = entry.getKey();
                }
            }
        }
        if (winner == null) {
            return "AI mock: пока нет данных для суммаризации.";
        }
        return "AI mock: больше всего пользователей выбрали \"" + winner + "\" (" + max + " голосов).";
    }
}
