using Blogfox.Api.Data;
using Blogfox.Api.Dtos.Auth;
using Blogfox.Api.Entities;
using Blogfox.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Blogfox.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly JwtTokenService _jwt;

    public AuthController(AppDbContext db, JwtTokenService jwt)
    {
        _db = db;
        _jwt = jwt;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest req)
    {
        if (!req.AcceptedRules)
            return BadRequest(new { message = "You must accept the community rules to register." });

        var email = req.Email.Trim().ToLowerInvariant();
        if (await _db.Users.AnyAsync(u => u.Email == email))
            return Conflict(new { message = "Email already registered." });

        var user = new User
        {
            Email = email,
            DisplayName = req.DisplayName.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Role = UserRole.Author,
            AcceptedRulesAt = DateTime.UtcNow,
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var (token, expiresAt) = _jwt.CreateToken(user);
        return Ok(new AuthResponse(token, expiresAt,
            new UserResponse(user.Id, user.Email, user.DisplayName, user.Role.ToString())));
    }

    [HttpPost("forgot")]
    public async Task<IActionResult> Forgot([FromBody] ForgotPasswordRequest req, [FromServices] IEmailSender email, [FromServices] IConfiguration config)
    {
        var emailAddr = req.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == emailAddr);
        if (user is not null && !user.IsBanned)
        {
            // Invalidate any existing unconsumed tokens for this user
            var oldTokens = await _db.PasswordResetTokens
                .Where(t => t.UserId == user.Id && t.ConsumedAt == null)
                .ToListAsync();
            foreach (var t in oldTokens) t.ConsumedAt = DateTime.UtcNow;

            // Generate a fresh token
            var token = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(24)).ToLowerInvariant();
            _db.PasswordResetTokens.Add(new PasswordResetToken
            {
                UserId = user.Id,
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddHours(1),
                CreatedAt = DateTime.UtcNow,
            });
            await _db.SaveChangesAsync();

            var frontendUrl = config["Frontend:BaseUrl"] ?? "http://localhost:3000";
            var resetUrl = $"{frontendUrl.TrimEnd('/')}/reset?token={token}";
            await email.SendAsync(
                to: user.Email,
                subject: "Reset your LogVault password",
                textBody: $"Hi {user.DisplayName},\n\nWe got a request to reset your LogVault password.\n\nOpen this link to set a new one (expires in 1 hour):\n{resetUrl}\n\nIf you didn't request this, ignore this email.\n\n— LogVault",
                htmlBody: $"<p>Hi {user.DisplayName},</p><p>We got a request to reset your LogVault password.</p><p><a href=\"{resetUrl}\">Set a new password</a> (expires in 1 hour).</p><p>If you didn't request this, ignore this email.</p>"
            );
        }

        // Always return success to prevent email-enumeration attacks.
        return Ok(new { message = "If that email is registered, a reset link is on its way." });
    }

    [HttpPost("reset")]
    public async Task<ActionResult<AuthResponse>> Reset([FromBody] ResetPasswordRequest req)
    {
        var token = await _db.PasswordResetTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == req.Token);

        if (token is null || token.ConsumedAt is not null || token.ExpiresAt < DateTime.UtcNow)
            return BadRequest(new { message = "This reset link is invalid or has expired." });

        if (token.User.IsBanned)
            return BadRequest(new { message = "This account is suspended." });

        token.User.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password);
        token.ConsumedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        // Auto-sign-in so they don't have to log in immediately after reset
        var (authToken, expiresAt) = _jwt.CreateToken(token.User);
        return Ok(new AuthResponse(authToken, expiresAt,
            new UserResponse(token.User.Id, token.User.Email, token.User.DisplayName, token.User.Role.ToString())));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest req)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid email or password." });
        if (user.IsBanned)
            return StatusCode(403, new { message = "This account is suspended." });

        var (token, expiresAt) = _jwt.CreateToken(user);
        return Ok(new AuthResponse(token, expiresAt,
            new UserResponse(user.Id, user.Email, user.DisplayName, user.Role.ToString())));
    }
}
