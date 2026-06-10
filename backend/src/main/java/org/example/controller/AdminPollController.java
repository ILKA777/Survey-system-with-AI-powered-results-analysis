package org.example.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.example.dto.CreatePollRequest;
import org.example.dto.PollResponse;
import org.example.dto.PollResultsResponse;
import org.example.service.AuthTokenService;
import org.example.service.PollService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/polls")
@Tag(name = "Админ: опросы", description = "Ручки для создания, публикации и анализа опросов/голосований/викторин")
public class AdminPollController {

    private final AuthTokenService authTokenService;
    private final PollService pollService;

    public AdminPollController(AuthTokenService authTokenService, PollService pollService) {
        this.authTokenService = authTokenService;
        this.pollService = pollService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(
            summary = "Создать черновик опроса вручную",
            description = "Создает черновик опроса, голосования или викторины в статусе DRAFT на основе переданных страниц. Для режима VOTE допускается только одна страница."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Сущность успешно создана"),
            @ApiResponse(responseCode = "400", description = "Нарушены правила валидации"),
            @ApiResponse(responseCode = "401", description = "Отсутствует или неверный токен")
    })
    public PollResponse createManual(
            @Parameter(description = "Токен авторизации администратора", required = true)
            @RequestHeader("X-Auth-Token") String token,
            @Valid @RequestBody CreatePollRequest request
    ) {
        Long adminId = authTokenService.requireUserId(token);
        return pollService.createManual(adminId, request);
    }

    @PostMapping("/{pollId}/publish")
    @Operation(
            summary = "Опубликовать опрос",
            description = "Переводит созданную сущность в статус PUBLISHED, после чего участники могут проходить по ссылке/room code."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Опрос опубликован"),
            @ApiResponse(responseCode = "401", description = "Отсутствует или неверный токен"),
            @ApiResponse(responseCode = "403", description = "Пользователь не является админом данного опроса"),
            @ApiResponse(responseCode = "404", description = "Опрос не найден")
    })
    public PollResponse publish(
            @Parameter(description = "Токен авторизации администратора", required = true)
            @RequestHeader("X-Auth-Token") String token,
            @Parameter(description = "Идентификатор опроса", required = true)
            @PathVariable("pollId") Long pollId
    ) {
        Long adminId = authTokenService.requireUserId(token);
        return pollService.publish(adminId, pollId);
    }

    @GetMapping
    @Operation(
            summary = "Получить список опросов администратора",
            description = "Возвращает все опросы/голосования/викторины, созданные текущим администратором."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Список успешно получен"),
            @ApiResponse(responseCode = "401", description = "Отсутствует или неверный токен")
    })
    public List<PollResponse> list(
            @Parameter(description = "Токен авторизации администратора", required = true)
            @RequestHeader("X-Auth-Token") String token
    ) {
        Long adminId = authTokenService.requireUserId(token);
        return pollService.getAdminPolls(adminId);
    }

    @GetMapping("/{pollId}/results")
    @Operation(
            summary = "Получить результаты опроса",
            description = "Возвращает сырые ответы, агрегированные результаты, данные для графиков и AI-суммаризацию."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Результаты успешно получены"),
            @ApiResponse(responseCode = "401", description = "Отсутствует или неверный токен"),
            @ApiResponse(responseCode = "403", description = "Пользователь не является админом данного опроса"),
            @ApiResponse(responseCode = "404", description = "Опрос не найден")
    })
    public PollResultsResponse results(
            @Parameter(description = "Токен авторизации администратора", required = true)
            @RequestHeader("X-Auth-Token") String token,
            @Parameter(description = "Идентификатор опроса", required = true)
            @PathVariable("pollId") Long pollId
    ) {
        Long adminId = authTokenService.requireUserId(token);
        return pollService.getResults(adminId, pollId);
    }
}
