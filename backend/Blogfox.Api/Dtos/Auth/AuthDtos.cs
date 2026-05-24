using System.ComponentModel.DataAnnotations;

namespace Blogfox.Api.Dtos.Auth;

public record RegisterRequest(
    [Required, EmailAddress, StringLength(256)] string Email,
    [Required, StringLength(128, MinimumLength = 8),
     RegularExpression(@"^(?=.*[A-Za-z])(?=.*\d).+$",
        ErrorMessage = "Password must include at least one letter and one number.")]
    string Password,
    [Required, StringLength(128, MinimumLength = 2)] string DisplayName,
    bool AcceptedRules = false
);

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password
);

public record ForgotPasswordRequest(
    [Required, EmailAddress] string Email
);

public record ResetPasswordRequest(
    [Required] string Token,
    [Required, StringLength(128, MinimumLength = 8),
     RegularExpression(@"^(?=.*[A-Za-z])(?=.*\d).+$",
        ErrorMessage = "Password must include at least one letter and one number.")]
    string Password
);

public record AuthResponse(
    string Token,
    DateTime ExpiresAt,
    UserResponse User
);

public record UserResponse(
    Guid Id,
    string Email,
    string DisplayName,
    string Role
);
