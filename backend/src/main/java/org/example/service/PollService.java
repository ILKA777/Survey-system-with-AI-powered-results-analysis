package org.example.service;

import org.example.dto.AnswerPayload;
import org.example.dto.CreatePollRequest;
import org.example.dto.PagePayload;
import org.example.dto.PollPageResponse;
import org.example.dto.PollResponse;
import org.example.dto.PollResultsResponse;
import org.example.dto.SubmitPollRequest;
import org.example.exception.ApiException;
import org.example.model.IIPollUser;
import org.example.model.Poll;
import org.example.model.PollAnswer;
import org.example.model.PollPage;
import org.example.model.PollStatus;
import org.example.model.PollType;
import org.example.model.QuestionType;
import org.example.repository.PollAnswerRepository;
import org.example.repository.PollPageRepository;
import org.example.repository.PollRepository;
import org.example.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PollService {
    private static final String ROOM_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private final PollRepository pollRepository;
    private final PollAnswerRepository pollAnswerRepository;
    private final PollPageRepository pollPageRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final JsonService jsonService;
    private final AiModuleService aiModuleService;
    private final Random random = new Random();

    public PollService(
            PollRepository pollRepository,
            PollAnswerRepository pollAnswerRepository,
            PollPageRepository pollPageRepository,
            UserRepository userRepository,
            UserService userService,
            JsonService jsonService,
            AiModuleService aiModuleService
    ) {
        this.pollRepository = pollRepository;
        this.pollAnswerRepository = pollAnswerRepository;
        this.pollPageRepository = pollPageRepository;
        this.userRepository = userRepository;
        this.userService = userService;
        this.jsonService = jsonService;
        this.aiModuleService = aiModuleService;
    }

    @Transactional
    public PollResponse createManual(Long adminId, CreatePollRequest request) {
        IIPollUser admin = requireUser(adminId);
        validatePagesForType(request.type(), request.pages());

        Poll poll = new Poll();
        poll.setAdmin(admin);
        poll.setType(request.type());
        poll.setTitle(request.title().trim());
        poll.setDescription(request.description());
        poll.setAllowAnonymous(request.allowAnonymous());
        poll.setRoomCode(generateRoomCode());
        poll.setStatus(PollStatus.DRAFT);

        appendPages(poll, request.pages());
        Poll saved = pollRepository.save(poll);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<PollResponse> getAdminPolls(Long adminId) {
        requireUser(adminId);
        return pollRepository.findByAdminId(adminId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public PollResponse publish(Long adminId, Long pollId) {
        Poll poll = requireOwnedPoll(adminId, pollId);
        poll.setStatus(PollStatus.PUBLISHED);
        return toResponse(pollRepository.save(poll));
    }

    @Transactional(readOnly = true)
    public PollResponse getPublicByRoomCode(String roomCode) {
        Poll poll = pollRepository.findByRoomCodeAndStatus(roomCode.toUpperCase(Locale.ROOT), PollStatus.PUBLISHED)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Published poll not found for room"));
        return toResponse(poll);
    }

    @Transactional
    public void submit(String roomCode, SubmitPollRequest request) {
        Poll poll = pollRepository.findByRoomCodeAndStatus(roomCode.toUpperCase(Locale.ROOT), PollStatus.PUBLISHED)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Published poll not found for room"));

        String nickname = request.nickname() == null ? null : request.nickname().trim();
        boolean anonymousSubmission = nickname == null || nickname.isBlank();
        if (anonymousSubmission && !poll.isAllowAnonymous()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This poll requires nickname");
        }

        IIPollUser participant = anonymousSubmission ? null : userService.getOrCreateParticipant(nickname, true);
        String participantNickname = anonymousSubmission ? "anonymous" : participant.getNickname();
        Map<Long, PollPage> pages = pollPageRepository.findByPollIdOrderByPageOrderAsc(poll.getId())
                .stream()
                .collect(Collectors.toMap(PollPage::getId, p -> p));

        for (AnswerPayload answer : request.answers()) {
            PollPage page = pages.get(answer.pageId());
            if (page == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Answer references unknown page: " + answer.pageId());
            }
            validateAnswer(page, answer);
        }

        OffsetDateTime submittedAt = OffsetDateTime.now();
        String submissionId = UUID.randomUUID().toString();
        List<PollAnswer> answersToSave = new ArrayList<>();
        for (AnswerPayload answer : request.answers()) {
            PollPage page = pages.get(answer.pageId());
            PollAnswer pollAnswer = new PollAnswer();
            pollAnswer.setPoll(poll);
            pollAnswer.setPage(page);
            pollAnswer.setParticipant(participant);
            pollAnswer.setParticipantNickname(participantNickname);
            pollAnswer.setSubmissionId(submissionId);
            pollAnswer.setSubmittedAt(submittedAt);
            pollAnswer.setSelectedOptionsJson(jsonService.write(
                    answer.selectedOptions() == null ? List.of() : answer.selectedOptions()
            ));
            pollAnswer.setTextAnswer(answer.textAnswer());
            answersToSave.add(pollAnswer);
        }
        pollAnswerRepository.saveAll(answersToSave);
        if (participant != null) {
            poll.getParticipants().add(participant);
        }
        pollRepository.save(poll);
    }

    @Transactional
    public PollResultsResponse getResults(Long adminId, Long pollId) {
        Poll poll = requireOwnedPoll(adminId, pollId);
        List<PollAnswer> answers = pollAnswerRepository.findByPollIdOrderBySubmittedAtAscIdAsc(pollId);
        List<Map<String, Object>> rawResults = answers.isEmpty()
                ? jsonService.readResultList(poll.getRawResultsJson())
                : toRawResults(answers);
        Map<Long, Map<String, Long>> aggregatedChoiceResults = aggregateChoiceResults(rawResults);
        Map<Long, List<String>> textAnswers = aggregateTextAnswers(rawResults);

        List<Map<String, Object>> chartData = new ArrayList<>();
        for (Map.Entry<Long, Map<String, Long>> entry : aggregatedChoiceResults.entrySet()) {
            Map<String, Object> chart = new LinkedHashMap<>();
            chart.put("pageId", entry.getKey());
            chart.put("bar", entry.getValue());
            chart.put("pie", entry.getValue());
            chart.put("donut", entry.getValue());
            chartData.add(chart);
        }

        String summary = aiModuleService.summarize(poll, rawResults);
        poll.setAiSummary(summary);
        pollRepository.save(poll);
        return new PollResultsResponse(rawResults, aggregatedChoiceResults, textAnswers, chartData, summary);
    }

    private List<Map<String, Object>> toRawResults(List<PollAnswer> answers) {
        Map<String, Map<String, Object>> grouped = new LinkedHashMap<>();
        for (PollAnswer answer : answers) {
            Map<String, Object> row = grouped.computeIfAbsent(answer.getSubmissionId(), key -> {
                Map<String, Object> created = new LinkedHashMap<>();
                String rowNickname = answer.getParticipantNickname();
                if ((rowNickname == null || rowNickname.isBlank()) && answer.getParticipant() != null) {
                    rowNickname = answer.getParticipant().getNickname();
                }
                created.put("participantNickname", rowNickname == null ? "anonymous" : rowNickname);
                created.put("submittedAt", answer.getSubmittedAt().toString());
                created.put("answers", new ArrayList<Map<String, Object>>());
                return created;
            });

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> rowAnswers = (List<Map<String, Object>>) row.get("answers");
            Map<String, Object> answerMap = new LinkedHashMap<>();
            answerMap.put("pageId", answer.getPage().getId());
            answerMap.put("selectedOptions", jsonService.readStringList(answer.getSelectedOptionsJson()));
            answerMap.put("textAnswer", answer.getTextAnswer());
            rowAnswers.add(answerMap);
        }
        return new ArrayList<>(grouped.values());
    }

    private void validatePagesForType(PollType type, List<PagePayload> pages) {
        if (type == PollType.VOTE && pages.size() != 1) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Voting mode supports exactly one page");
        }
        for (PagePayload page : pages) {
            if (page.questionType() == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Question type is required");
            }
            if (page.questionType() != QuestionType.TEXT) {
                if (page.options() == null || page.options().size() < 2) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "Choice questions require at least 2 options");
                }
            }
            if (type == PollType.VOTE && page.questionType() == QuestionType.TEXT) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Voting does not support text-only questions");
            }
        }
    }

    private void validateAnswer(PollPage page, AnswerPayload answer) {
        List<String> selected = answer.selectedOptions() == null ? List.of() : answer.selectedOptions();
        if (page.getQuestionType() == QuestionType.TEXT) {
            if (page.isRequired() && (answer.textAnswer() == null || answer.textAnswer().isBlank())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Text answer is required for page " + page.getId());
            }
            return;
        }

        List<String> validOptions = jsonService.readStringList(page.getOptionsJson());
        if (page.isRequired() && selected.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "At least one option must be selected for page " + page.getId());
        }
        if (!validOptions.containsAll(selected)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Answer has unknown options for page " + page.getId());
        }
        if (page.getQuestionType() == QuestionType.SINGLE_CHOICE && selected.size() > 1) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Single choice question accepts only one option");
        }
    }

    private Map<Long, Map<String, Long>> aggregateChoiceResults(List<Map<String, Object>> rawResults) {
        Map<Long, Map<String, Long>> result = new LinkedHashMap<>();
        for (Map<String, Object> item : rawResults) {
            Object answersObj = item.get("answers");
            if (!(answersObj instanceof List<?> answers)) {
                continue;
            }
            for (Object answerObj : answers) {
                if (!(answerObj instanceof Map<?, ?> answerMap)) {
                    continue;
                }
                Long pageId = longValue(answerMap.get("pageId"));
                if (pageId == null) {
                    continue;
                }
                Object selectedObj = answerMap.get("selectedOptions");
                if (!(selectedObj instanceof List<?> selectedOptions)) {
                    continue;
                }
                Map<String, Long> perQuestion = result.computeIfAbsent(pageId, ignored -> new LinkedHashMap<>());
                for (Object selected : selectedOptions) {
                    String key = Objects.toString(selected, "");
                    if (!key.isBlank()) {
                        perQuestion.merge(key, 1L, Long::sum);
                    }
                }
            }
        }
        return result;
    }

    private Map<Long, List<String>> aggregateTextAnswers(List<Map<String, Object>> rawResults) {
        Map<Long, List<String>> result = new LinkedHashMap<>();
        for (Map<String, Object> item : rawResults) {
            Object answersObj = item.get("answers");
            if (!(answersObj instanceof List<?> answers)) {
                continue;
            }
            for (Object answerObj : answers) {
                if (!(answerObj instanceof Map<?, ?> answerMap)) {
                    continue;
                }
                Long pageId = longValue(answerMap.get("pageId"));
                Object text = answerMap.get("textAnswer");
                if (pageId != null && text instanceof String str && !str.isBlank()) {
                    result.computeIfAbsent(pageId, ignored -> new ArrayList<>()).add(str);
                }
            }
        }
        return result;
    }

    private Long longValue(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        return null;
    }

    private void appendPages(Poll poll, List<PagePayload> pages) {
        for (int i = 0; i < pages.size(); i++) {
            PagePayload payload = pages.get(i);
            PollPage page = new PollPage();
            page.setPoll(poll);
            page.setPageOrder(i + 1);
            page.setQuestion(payload.question().trim());
            page.setQuestionType(payload.questionType());
            page.setRequired(payload.required());
            page.setOptionsJson(jsonService.write(payload.options() == null ? List.of() : payload.options()));
            page.setDependsOnPageId(payload.dependsOnPageId());
            page.setDependsOnOption(payload.dependsOnOption());
            poll.getPages().add(page);
        }
    }

    private Poll requireOwnedPoll(Long adminId, Long pollId) {
        Poll poll = pollRepository.findById(pollId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Poll not found"));
        if (!poll.getAdmin().getId().equals(adminId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only poll admin can access this poll");
        }
        return poll;
    }

    private IIPollUser requireUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private String generateRoomCode() {
        for (int attempt = 0; attempt < 20; attempt++) {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < 6; i++) {
                sb.append(ROOM_CHARS.charAt(random.nextInt(ROOM_CHARS.length())));
            }
            String candidate = sb.toString();
            if (!pollRepository.existsByRoomCode(candidate)) {
                return candidate;
            }
        }
        throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to generate unique room code");
    }

    private PollResponse toResponse(Poll poll) {
        List<PollPageResponse> pages = poll.getPages().stream()
                .sorted((a, b) -> Integer.compare(a.getPageOrder(), b.getPageOrder()))
                .map(page -> new PollPageResponse(
                        page.getId(),
                        page.getPageOrder(),
                        page.getQuestion(),
                        page.getQuestionType(),
                        page.isRequired(),
                        jsonService.readStringList(page.getOptionsJson()),
                        page.getDependsOnPageId(),
                        page.getDependsOnOption()
                ))
                .toList();

        String joinLink = "/api/participant/polls/room/" + poll.getRoomCode();
        return new PollResponse(
                poll.getId(),
                poll.getType(),
                poll.getTitle(),
                poll.getDescription(),
                poll.getRoomCode(),
                joinLink,
                "ROOM:" + poll.getRoomCode(),
                poll.isAllowAnonymous(),
                poll.getStatus(),
                poll.getAiSummary(),
                poll.getCreatedAt(),
                pages
        );
    }
}
