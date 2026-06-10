package org.example.repository;

import org.example.model.PollAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PollAnswerRepository extends JpaRepository<PollAnswer, Long> {
    List<PollAnswer> findByPollIdOrderBySubmittedAtAscIdAsc(Long pollId);
}
