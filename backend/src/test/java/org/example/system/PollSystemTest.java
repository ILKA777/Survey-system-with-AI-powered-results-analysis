package org.example.system;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PollSystemTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void surveyFlowShouldWorkEndToEnd() throws Exception {
        String token = signUp("sys-admin-survey");
        JsonNode created = createPoll(token, """
                {
                  "type":"SURVEY",
                  "title":"Survey flow",
                  "description":"desc",
                  "allowAnonymous":false,
                  "pages":[
                    {"question":"Q1","questionType":"SINGLE_CHOICE","required":true,"options":["A","B"]},
                    {"question":"Q2","questionType":"TEXT","required":true,"options":[]}
                  ]
                }
                """);

        long pollId = created.get("id").asLong();
        String roomCode = created.get("roomCode").asText();
        long page1 = created.get("pages").get(0).get("id").asLong();
        long page2 = created.get("pages").get(1).get("id").asLong();

        publish(token, pollId);
        mockMvc.perform(get("/api/participant/polls/room/{roomCode}", roomCode))
                .andExpect(status().isOk());
        submit(roomCode, """
                {
                  "nickname":"survey-user",
                  "answers":[
                    {"pageId":%d,"selectedOptions":["A"]},
                    {"pageId":%d,"textAnswer":"text answer"}
                  ]
                }
                """.formatted(page1, page2));

        JsonNode results = getResults(token, pollId);
        assertThat(results.get("rawResults").size()).isEqualTo(1);
    }

    @Test
    void voteFlowShouldWorkEndToEnd() throws Exception {
        String token = signUp("sys-admin-vote");
        JsonNode created = createPoll(token, """
                {
                  "type":"VOTE",
                  "title":"Vote flow",
                  "description":"desc",
                  "allowAnonymous":true,
                  "pages":[
                    {"question":"Q1","questionType":"MULTIPLE_CHOICE","required":true,"options":["A","B","C"]}
                  ]
                }
                """);

        long pollId = created.get("id").asLong();
        String roomCode = created.get("roomCode").asText();
        long pageId = created.get("pages").get(0).get("id").asLong();

        publish(token, pollId);
        submit(roomCode, """
                {
                  "answers":[{"pageId":%d,"selectedOptions":["A","C"]}]
                }
                """.formatted(pageId));

        JsonNode results = getResults(token, pollId);
        assertThat(results.get("aggregatedChoiceResults").size()).isGreaterThan(0);
    }

    @Test
    void quizFlowShouldWorkEndToEnd() throws Exception {
        String token = signUp("sys-admin-quiz");
        JsonNode created = createPoll(token, """
                {
                  "type":"QUIZ",
                  "title":"Quiz flow",
                  "description":"desc",
                  "allowAnonymous":true,
                  "pages":[
                    {"question":"Q1","questionType":"SINGLE_CHOICE","required":true,"options":["A","B"]},
                    {"question":"Q2","questionType":"SINGLE_CHOICE","required":true,"options":["A","B"]},
                    {"question":"Q3","questionType":"SINGLE_CHOICE","required":true,"options":["A","B"]}
                  ]
                }
                """);

        long pollId = created.get("id").asLong();
        String roomCode = created.get("roomCode").asText();
        long p1 = created.get("pages").get(0).get("id").asLong();
        long p2 = created.get("pages").get(1).get("id").asLong();
        long p3 = created.get("pages").get(2).get("id").asLong();

        publish(token, pollId);
        submit(roomCode, """
                {
                  "answers":[
                    {"pageId":%d,"selectedOptions":["A"]},
                    {"pageId":%d,"selectedOptions":["B"]},
                    {"pageId":%d,"selectedOptions":["A"]}
                  ]
                }
                """.formatted(p1, p2, p3));

        JsonNode results = getResults(token, pollId);
        assertThat(results.get("rawResults").size()).isEqualTo(1);
        assertThat(results.get("aiSummary").asText()).isNotBlank();
    }

    private String signUp(String nickname) throws Exception {
        MvcResult response = mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nickname":"%s"}
                                """.formatted(nickname)))
                .andExpect(status().isCreated())
                .andReturn();
        return body(response).get("token").asText();
    }

    private JsonNode createPoll(String token, String payload) throws Exception {
        MvcResult response = mockMvc.perform(post("/api/admin/polls")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Auth-Token", token)
                        .content(payload))
                .andExpect(status().isCreated())
                .andReturn();
        return body(response);
    }

    private void publish(String token, long pollId) throws Exception {
        mockMvc.perform(post("/api/admin/polls/{pollId}/publish", pollId)
                        .header("X-Auth-Token", token))
                .andExpect(status().isOk());
    }

    private void submit(String roomCode, String payload) throws Exception {
        mockMvc.perform(post("/api/participant/polls/room/{roomCode}/submit", roomCode)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk());
    }

    private JsonNode getResults(String token, long pollId) throws Exception {
        MvcResult response = mockMvc.perform(get("/api/admin/polls/{pollId}/results", pollId)
                        .header("X-Auth-Token", token))
                .andExpect(status().isOk())
                .andReturn();
        return body(response);
    }

    private JsonNode body(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }
}
