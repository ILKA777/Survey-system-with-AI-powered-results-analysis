package org.example.repository;

import org.example.model.PollPage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PollPageRepository extends JpaRepository<PollPage, Long> {
    List<PollPage> findByPollIdOrderByPageOrderAsc(Long pollId);
}
