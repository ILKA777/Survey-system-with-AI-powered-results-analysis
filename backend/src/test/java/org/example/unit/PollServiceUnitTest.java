package org.example.unit;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.dto.AnswerPayload;
import org.example.dto.CreatePollRequest;
import org.example.dto.PagePayload;
import org.example.dto.SubmitPollRequest;
import org.example.exception.ApiException;
import org.example.model.IIPollUser;
import org.example.model.Poll;
import org.example.model.PollPage;
import org.example.model.PollStatus;
import org.example.model.PollType;
import org.example.model.QuestionType;
import org.example.repository.PollPageRepository;
import org.example.repository.PollRepository;
import org.example.repository.UserRepository;
import org.example.service.AiMockService;
import org.example.service.JsonService;
import org.example.service.PollService;
import org.example.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PollServiceUnitTest {

    @Mock
    private PollRepository pollRepository;
    @Mock
    private PollPageRepository pollPageRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private UserService userService;

    private PollService pollService;
    private JsonService jsonService;

    @BeforeEach
    void setUp() {
        jsonService = new JsonService(new ObjectMapper());
        pollService = new PollService(
                pollRepository,
                pollPageRepository,
                userRepository,
                userService,
                jsonService,
                new AiMockService()
        );
    }

    @Test
    void shouldRejectMultiPageVoteCreation() {
        IIPollUser admin = admin();
        when(userRepository.findById(1L)).thenReturn(Optional.of(admin));

        CreatePollRequest request = new CreatePollRequest(
                PollType.VOTE,
                "Vote",
                "desc",
                true,
                List.of(
                        new PagePayload("Q1", QuestionType.SINGLE_CHOICE, true, List.of("A", "B"), null, null),
                        new PagePayload("Q2", QuestionType.SINGLE_CHOICE, true, List.of("A", "B"), null, null)
                )
        );

        assertThatThrownBy(() -> pollService.createManual(1L, request))
                .isInstanceOf(ApiException.class)
                .extracting(ex -> ((ApiException) ex).getStatus())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void shouldCreateSurveySuccessfully() {
        IIPollUser admin = admin();
        when(userRepository.findById(1L)).thenReturn(Optional.of(admin));
        when(pollRepository.existsByRoomCode(anyString())).thenReturn(false);
        when(pollRepository.save(any(Poll.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CreatePollRequest request = new CreatePollRequest(
                PollType.SURVEY,
                "Customer survey",
                "desc",
                true,
                List.of(
                        new PagePayload("Q1", QuestionType.SINGLE_CHOICE, true, List.of("A", "B"), null, null),
                        new PagePayload("Q2", QuestionType.TEXT, false, List.of(), null, null)
                )
        );

        var response = pollService.createManual(1L, request);
        assertThat(response.type()).isEqualTo(PollType.SURVEY);
        assertThat(response.pages()).hasSize(2);
        assertThat(response.roomCode()).hasSize(6);
    }

    @Test
    void shouldAllowAnonymousParticipationForSingleAndMultipleUsers() {
        Poll poll = publishedSurvey();
        PollPage page = poll.getPages().get(0);

        when(pollRepository.findByRoomCodeAndStatus("ROOM01", PollStatus.PUBLISHED)).thenReturn(Optional.of(poll));
        when(pollPageRepository.findByPollIdOrderByPageOrderAsc(101L)).thenReturn(List.of(page));
        when(userService.getOrCreateParticipant(null, true))
                .thenReturn(user(20L, "anon-1", true))
                .thenReturn(user(21L, "anon-2", true));
        when(pollRepository.save(any(Poll.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SubmitPollRequest submit = new SubmitPollRequest(
                null,
                List.of(new AnswerPayload(page.getId(), List.of("A"), null))
        );

        pollService.submit("room01", submit);
        pollService.submit("room01", submit);

        assertThat(poll.getParticipants()).hasSize(2);
        var raw = jsonService.readResultList(poll.getRawResultsJson());
        assertThat(raw).hasSize(2);
    }

    private IIPollUser admin() {
        return user(1L, "admin", false);
    }

    private IIPollUser user(Long id, String nickname, boolean anonymous) {
        IIPollUser user = new IIPollUser();
        trySetId(user, id);
        user.setNickname(nickname);
        user.setAnonymous(anonymous);
        return user;
    }

    private Poll publishedSurvey() {
        Poll poll = new Poll();
        trySetId(poll, 101L);
        poll.setType(PollType.SURVEY);
        poll.setTitle("Survey");
        poll.setAllowAnonymous(true);
        poll.setStatus(PollStatus.PUBLISHED);
        poll.setRoomCode("ROOM01");
        poll.setRawResultsJson("[]");
        poll.setAdmin(admin());

        PollPage page = new PollPage();
        trySetId(page, 501L);
        page.setPoll(poll);
        page.setPageOrder(1);
        page.setQuestion("Q1");
        page.setQuestionType(QuestionType.SINGLE_CHOICE);
        page.setRequired(true);
        page.setOptionsJson(jsonService.write(List.of("A", "B")));

        poll.getPages().add(page);
        return poll;
    }

    private void trySetId(Object target, Long value) {
        try {
            var field = target.getClass().getDeclaredField("id");
            field.setAccessible(true);
            field.set(target, value);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(e);
        }
    }
}
