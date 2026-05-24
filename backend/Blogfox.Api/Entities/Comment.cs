namespace Blogfox.Api.Entities;

public enum CommentStatus
{
    Pending = 0,
    Approved = 1,
}

public class Comment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PostId { get; set; }
    public Post Post { get; set; } = null!;

    public Guid? AuthorId { get; set; }
    public User? Author { get; set; }

    public string AuthorName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;

    public CommentStatus Status { get; set; } = CommentStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
