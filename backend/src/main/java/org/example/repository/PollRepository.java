package org.example.repository;

import org.example.model.Poll;
import org.example.model.PollStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PollRepository extends JpaRepository<Poll, Long> {
    List<Poll> findByAdminId(Long adminId);

    Optional<Poll> findByRoomCodeAndStatus(String roomCode, PollStatus status);

    boolean existsByRoomCode(String roomCode);
}
