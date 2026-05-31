package org.example.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.repository.PollAnswerRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AdminParticipantIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private PollAnswerRepository pollAnswerRepository;

    @Test
    void shouldReturnBadRequestWhenVoteHasMultiplePages() throws Exception {
        String token = signUpAndGetToken("admin-multi");

        String payload = """
                {
                  "type":"VOTE",
                  "title":"Invalid vote",
                  "description":"desc",
                  "allowAnonymous":true,
                  "pages":[
                    {"question":"Q1","questionType":"SINGLE_CHOICE","required":true,"options":["A","B"]},
                    {"question":"Q2","questionType":"SINGLE_CHOICE","required":true,"options":["A","B"]}
                  ]
                }
                """;

        mockMvc.perform(post("/api/admin/polls")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Auth-Token", token)
                        .content(payload))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldCreatePublishAndSubmitVote() throws Exception {
        String token = signUpAndGetToken("admin-vote");

        String createPayload = """
                {
                  "type":"VOTE",
                  "title":"Product vote",
                  "description":"desc",
                  "allowAnonymous":false,
                  "pages":[
                    {"question":"Best option?","questionType":"MULTIPLE_CHOICE","required":true,"options":["A","B","C"]}
                  ]
                }
                """;

        MvcResult createRes = mockMvc.perform(post("/api/admin/polls")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Auth-Token", token)
                        .content(createPayload))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode created = body(createRes);
        long pollId = created.get("id").asLong();
        String roomCode = created.get("roomCode").asText();
        long pageId = created.get("pages").get(0).get("id").asLong();

        mockMvc.perform(post("/api/admin/polls/{id}/publish", pollId)
                        .header("X-Auth-Token", token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/participant/polls/room/{roomCode}", roomCode))
                .andExpect(status().isOk());

        String submitPayload = """
                {
                  "nickname":"participant-1",
                  "answers":[{"pageId":%d,"selectedOptions":["A","C"]}]
                }
                """.formatted(pageId);

        mockMvc.perform(post("/api/participant/polls/room/{roomCode}/submit", roomCode)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(submitPayload))
                .andExpect(status().isOk());

        assertThat(pollAnswerRepository.findByPollIdOrderBySubmittedAtAscIdAsc(pollId)).hasSize(1);

        MvcResult resultsRes = mockMvc.perform(get("/api/admin/polls/{id}/results", pollId)
                        .header("X-Auth-Token", token))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode results = body(resultsRes);
        assertThat(results.get("rawResults").size()).isEqualTo(1);
        assertThat(results.get("chartData").size()).isEqualTo(1);
        assertThat(results.get("aiSummary").asText()).isNotBlank();
    }

    @Test
    void shouldCreateQuizAndAllowAnonymousSubmit() throws Exception {
        String token = signUpAndGetToken("admin-ai");

        String createPayload = """
                {
                  "type":"QUIZ",
                  "title":"Quiz manual",
                  "description":"desc",
                  "allowAnonymous":true,
                  "pages":[
                    {"question":"Q1","questionType":"SINGLE_CHOICE","required":true,"options":["A","B"]},
                    {"question":"Q2","questionType":"SINGLE_CHOICE","required":true,"options":["A","B"]},
                    {"question":"Q3","questionType":"SINGLE_CHOICE","required":true,"options":["A","B"]}
                  ]
                }
                """;

        MvcResult createRes = mockMvc.perform(post("/api/admin/polls")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Auth-Token", token)
                        .content(createPayload))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode created = body(createRes);
        long pollId = created.get("id").asLong();
        String roomCode = created.get("roomCode").asText();
        assertThat(created.get("pages").size()).isEqualTo(3);

        mockMvc.perform(post("/api/admin/polls/{id}/publish", pollId)
                        .header("X-Auth-Token", token))
                .andExpect(status().isOk());

        JsonNode page = created.get("pages").get(0);
        long pageId = page.get("id").asLong();
        String option = page.get("options").get(0).asText();

        String submitPayload = """
                {
                  "answers":[{"pageId":%d,"selectedOptions":["%s"]}]
                }
                """.formatted(pageId, option);

        mockMvc.perform(post("/api/participant/polls/room/{roomCode}/submit", roomCode)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(submitPayload))
                .andExpect(status().isOk());
    }

    private String signUpAndGetToken(String nickname) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nickname":"%s"}
                                """.formatted(nickname)))
                .andExpect(status().isCreated())
                .andReturn();
        return body(result).get("token").asText();
    }

    private JsonNode body(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }
}
