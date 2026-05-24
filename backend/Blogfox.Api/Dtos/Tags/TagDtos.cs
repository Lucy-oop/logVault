namespace Blogfox.Api.Dtos.Tags;

public record TagResponse(Guid Id, string Slug, string Name, int PostCount);
