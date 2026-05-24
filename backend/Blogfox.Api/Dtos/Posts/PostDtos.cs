using System.ComponentModel.DataAnnotations;
using Blogfox.Api.Entities;

namespace Blogfox.Api.Dtos.Posts;

public record PostListItem(
    Guid Id,
    string Slug,
    string Title,
    string Excerpt,
    string? CoverImageUrl,
    string Status,
    DateTime? PublishedAt,
    DateTime UpdatedAt,
    string AuthorName,
    int ViewCount,
    int WordCount,
    int ReactionCount,
    int CommentCount,
    IReadOnlyList<string> Tags
);

public record PostDetail(
    Guid Id,
    string Slug,
    string Title,
    string Excerpt,
    string ContentMarkdown,
    string? CoverImageUrl,
    string Status,
    DateTime? PublishedAt,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    Guid AuthorId,
    string AuthorName,
    int ViewCount,
    IReadOnlyList<string> Tags
);

public record CreatePostRequest(
    [Required, StringLength(256, MinimumLength = 1)] string Title,
    [StringLength(256)] string? Slug,
    [StringLength(512)] string? Excerpt,
    [Required] string ContentMarkdown,
    string? CoverImageUrl,
    PostStatus Status,
    DateTime? PublishedAt,
    IReadOnlyList<string>? Tags
);

public record UpdatePostRequest(
    [Required, StringLength(256, MinimumLength = 1)] string Title,
    [StringLength(256)] string? Slug,
    [StringLength(512)] string? Excerpt,
    [Required] string ContentMarkdown,
    string? CoverImageUrl,
    PostStatus Status,
    DateTime? PublishedAt,
    IReadOnlyList<string>? Tags
);

public record PagedResult<T>(
    IReadOnlyList<T> Items,
    int Page,
    int PageSize,
    int TotalCount
);
