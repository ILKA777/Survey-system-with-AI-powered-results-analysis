package org.example.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;

@Entity
@Table(name = "poll_answer")
public class PollAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "poll_id", nullable = false)
    private Poll poll;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "page_id", nullable = false)
    private PollPage page;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "participant_id")
    private IIPollUser participant;

    @Column(nullable = false, length = 64)
    private String submissionId;

    @Column(name = "participant_nickname", length = 64)
    private String participantNickname;

    @Column(nullable = false)
    private OffsetDateTime submittedAt;

    @Column(nullable = false, columnDefinition = "text")
    private String selectedOptionsJson;

    @Column(columnDefinition = "text")
    private String textAnswer;

    public Long getId() {
        return id;
    }

    public Poll getPoll() {
        return poll;
    }

    public void setPoll(Poll poll) {
        this.poll = poll;
    }

    public PollPage getPage() {
        return page;
    }

    public void setPage(PollPage page) {
        this.page = page;
    }

    public IIPollUser getParticipant() {
        return participant;
    }

    public void setParticipant(IIPollUser participant) {
        this.participant = participant;
    }

    public String getSubmissionId() {
        return submissionId;
    }

    public void setSubmissionId(String submissionId) {
        this.submissionId = submissionId;
    }

    public String getParticipantNickname() {
        return participantNickname;
    }

    public void setParticipantNickname(String participantNickname) {
        this.participantNickname = participantNickname;
    }

    public OffsetDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(OffsetDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public String getSelectedOptionsJson() {
        return selectedOptionsJson;
    }

    public void setSelectedOptionsJson(String selectedOptionsJson) {
        this.selectedOptionsJson = selectedOptionsJson;
    }

    public String getTextAnswer() {
        return textAnswer;
    }

    public void setTextAnswer(String textAnswer) {
        this.textAnswer = textAnswer;
    }
}
