package org.example.service;

import org.example.dto.AuthRequest;
import org.example.dto.AuthResponse;
import org.example.exception.ApiException;
import org.example.model.IIPollUser;
import org.example.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final AuthTokenService authTokenService;

    public UserService(UserRepository userRepository, AuthTokenService authTokenService) {
        this.userRepository = userRepository;
        this.authTokenService = authTokenService;
    }

    @Transactional
    public AuthResponse signUp(AuthRequest request) {
        IIPollUser user = userRepository.findByNickname(request.nickname())
                .orElseGet(() -> {
                    IIPollUser created = new IIPollUser();
                    created.setNickname(request.nickname().trim());
                    created.setAnonymous(false);
                    return userRepository.save(created);
                });
        String token = authTokenService.issueToken(user.getId());
        return new AuthResponse(user.getId(), user.getNickname(), user.isAnonymous(), token);
    }

    @Transactional(readOnly = true)
    public AuthResponse signIn(AuthRequest request) {
        IIPollUser user = userRepository.findByNickname(request.nickname().trim())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found, sign up first"));
        String token = authTokenService.issueToken(user.getId());
        return new AuthResponse(user.getId(), user.getNickname(), user.isAnonymous(), token);
    }

    @Transactional
    public IIPollUser getOrCreateParticipant(String nickname, boolean anonymousAllowed) {
        if (nickname != null && !nickname.isBlank()) {
            return userRepository.findByNickname(nickname.trim()).orElseGet(() -> {
                IIPollUser user = new IIPollUser();
                user.setNickname(nickname.trim());
                user.setAnonymous(false);
                return userRepository.save(user);
            });
        }

        if (!anonymousAllowed) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This poll requires nickname");
        }

        IIPollUser anonymous = new IIPollUser();
        anonymous.setNickname("anon-" + System.currentTimeMillis());
        anonymous.setAnonymous(true);
        return userRepository.save(anonymous);
    }
}
