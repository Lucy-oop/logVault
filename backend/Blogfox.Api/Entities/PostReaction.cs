namespace Blogfox.Api.Entities;

public enum ReactionKind
{
    Like = 0,
    Heart = 1,
    Haha = 2,
    Sad = 3,
}

public class PostReaction
{
    public Guid PostId { get; set; }
    public string ReactorKey { get; set; } = string.Empty;
    public ReactionKind Kind { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Post Post { get; set; } = null!;
}
