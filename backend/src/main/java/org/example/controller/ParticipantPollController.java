package org.example.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.example.dto.PollResponse;
import org.example.dto.SubmitPollRequest;
import org.example.dto.SubmitPollResponse;
import org.example.service.PollService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/participant/polls")
@Tag(name = "Участник: прохождение", description = "Ручки для входа в комнату и отправки ответов участником")
public class ParticipantPollController {

    private final PollService pollService;

    public ParticipantPollController(PollService pollService) {
        this.pollService = pollService;
    }

    @GetMapping("/room/{roomCode}")
    @Operation(
            summary = "Открыть опрос по коду комнаты",
            description = "Возвращает опубликованный опрос/голосование/викторину для участника по room code."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Опрос найден и доступен"),
            @ApiResponse(responseCode = "404", description = "Опубликованный опрос не найден")
    })
    public PollResponse getByRoomCode(
            @Parameter(description = "Код комнаты опроса", required = true)
            @PathVariable String roomCode
    ) {
        return pollService.getPublicByRoomCode(roomCode);
    }

    @PostMapping("/room/{roomCode}/submit")
    @Operation(
            summary = "Отправить ответы участника",
            description = "Принимает ответы участника, сохраняет результат и возвращает экранное сообщение «Спасибо за прохождение опроса»."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Ответы успешно сохранены"),
            @ApiResponse(responseCode = "400", description = "Нарушены правила валидации ответов"),
            @ApiResponse(responseCode = "404", description = "Опубликованный опрос не найден")
    })
    public SubmitPollResponse submit(
            @Parameter(description = "Код комнаты опроса", required = true)
            @PathVariable String roomCode,
            @Valid @RequestBody SubmitPollRequest request
    ) {
        pollService.submit(roomCode, request);
        return new SubmitPollResponse("Спасибо за прохождение опроса");
    }
}
