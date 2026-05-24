using System.ComponentModel.DataAnnotations;

namespace Blogfox.Api.Dtos.Comments;

public record CommentResponse(
    Guid Id,
    Guid? AuthorId,
    string AuthorName,
    string Content,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record CreateCommentRequest(
    [Required, StringLength(2000, MinimumLength = 1)] string Content
);

public record UpdateCommentRequest(
    [Required, StringLength(2000, MinimumLength = 1)] string Content
);
