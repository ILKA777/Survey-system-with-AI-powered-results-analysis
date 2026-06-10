package org.example.repository;

import org.example.model.IIPollUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<IIPollUser, Long> {
    Optional<IIPollUser> findByNickname(String nickname);
}
