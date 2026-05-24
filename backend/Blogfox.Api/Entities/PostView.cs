namespace Blogfox.Api.Entities;

public class PostView
{
    public Guid PostId { get; set; }
    public string ViewerKey { get; set; } = string.Empty;
    public DateTime ViewedAt { get; set; } = DateTime.UtcNow;

    public Post Post { get; set; } = null!;
}
