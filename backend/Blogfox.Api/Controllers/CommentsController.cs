using System.Security.Claims;
using Blogfox.Api.Data;
using Blogfox.Api.Dtos.Comments;
using Blogfox.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Blogfox.Api.Controllers;

[ApiController]
public class CommentsController : ControllerBase
{
    private readonly AppDbContext _db;

    public CommentsController(AppDbContext db) => _db = db;

    [HttpGet("api/posts/{slug}/comments")]
    public async Task<ActionResult<IReadOnlyList<CommentResponse>>> ListForPost(string slug)
    {
        var post = await _db.Posts
            .Where(p => p.Slug == slug && p.Status == PostStatus.Published)
            .Select(p => new { p.Id })
            .FirstOrDefaultAsync();
        if (post is null) return NotFound();

        var comments = await _db.Comments
            .Where(c => c.PostId == post.Id && c.Status == CommentStatus.Approved)
            .OrderBy(c => c.CreatedAt)
            .Select(c => new CommentResponse(c.Id, c.AuthorId, c.AuthorName, c.Content, c.CreatedAt, c.UpdatedAt))
            .ToListAsync();

        return Ok(comments);
    }

    [HttpPost("api/posts/{slug}/comments")]
    [Authorize]
    public async Task<ActionResult<CommentResponse>> Create(string slug, [FromBody] CreateCommentRequest req)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        var user = await _db.Users
            .Where(u => u.Id == userId)
            .Select(u => new { u.DisplayName, u.IsBanned })
            .FirstOrDefaultAsync();
        if (user is null) return Unauthorized();
        if (user.IsBanned) return StatusCode(403, new { message = "This account is suspended." });

        var post = await _db.Posts
            .Where(p => p.Slug == slug && p.Status == PostStatus.Published)
            .Select(p => new { p.Id })
            .FirstOrDefaultAsync();
        if (post is null) return NotFound();

        var comment = new Comment
        {
            PostId = post.Id,
            AuthorId = userId,
            AuthorName = user.DisplayName,
            Content = req.Content.Trim(),
            Status = CommentStatus.Approved,
            CreatedAt = DateTime.UtcNow,
        };
        _db.Comments.Add(comment);
        await _db.SaveChangesAsync();

        return Ok(new CommentResponse(comment.Id, comment.AuthorId, comment.AuthorName, comment.Content, comment.CreatedAt, comment.UpdatedAt));
    }

    [HttpPatch("api/comments/{id:guid}")]
    [Authorize]
    public async Task<ActionResult<CommentResponse>> Update(Guid id, [FromBody] UpdateCommentRequest req)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        var comment = await _db.Comments.FindAsync(id);
        if (comment is null) return NotFound();
        if (comment.AuthorId != userId) return Forbid();

        comment.Content = req.Content.Trim();
        comment.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new CommentResponse(comment.Id, comment.AuthorId, comment.AuthorName, comment.Content, comment.CreatedAt, comment.UpdatedAt));
    }

    [HttpDelete("api/comments/{id:guid}")]
    [Authorize]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = CurrentUserId();
        if (userId is null) return Unauthorized();

        var comment = await _db.Comments.FindAsync(id);
        if (comment is null) return NotFound();
        if (comment.AuthorId != userId) return Forbid();

        _db.Comments.Remove(comment);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private Guid? CurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? User.FindFirstValue("sub");
        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
