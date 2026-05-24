namespace Blogfox.Api.Entities;

public enum ReportReason
{
    Spam = 0,
    Harassment = 1,
    Illegal = 2,
    Misinformation = 3,
    Other = 4,
}

public enum ReportStatus
{
    Open = 0,
    Resolved = 1,
    Dismissed = 2,
}

public class Report
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid? ReporterId { get; set; }
    public User? Reporter { get; set; }

    public Guid PostId { get; set; }
    public Post Post { get; set; } = null!;

    public ReportReason Reason { get; set; }
    public string Details { get; set; } = string.Empty;

    public ReportStatus Status { get; set; } = ReportStatus.Open;

    public Guid? ResolvedById { get; set; }
    public User? ResolvedBy { get; set; }
    public DateTime? ResolvedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
