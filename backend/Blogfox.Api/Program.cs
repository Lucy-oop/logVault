using System.Text;
using Blogfox.Api.Data;
using Blogfox.Api.Entities;
using Blogfox.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile(
    $"appsettings.{builder.Environment.EnvironmentName}.local.json",
    optional: true, reloadOnChange: true);

// Production hosts (Railway, Heroku, Fly, etc.) expose Postgres via a single
// DATABASE_URL like postgresql://user:pass@host:5432/db. Convert it into the
// Npgsql key=value form so the existing GetConnectionString lookup works.
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
if (!string.IsNullOrWhiteSpace(databaseUrl))
{
    var uri = new Uri(databaseUrl);
    var userInfo = uri.UserInfo.Split(':', 2);
    var npgsql =
        $"Host={uri.Host};Port={(uri.Port > 0 ? uri.Port : 5432)};" +
        $"Database={uri.AbsolutePath.TrimStart('/')};" +
        $"Username={Uri.UnescapeDataString(userInfo[0])};" +
        $"Password={Uri.UnescapeDataString(userInfo.Length > 1 ? userInfo[1] : "")};" +
        "SSL Mode=Require;Trust Server Certificate=true";
    builder.Configuration["ConnectionStrings:Postgres"] = npgsql;
}

builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")));

var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>()
    ?? throw new InvalidOperationException("Missing Jwt configuration section.");
builder.Services.AddSingleton(jwtSettings);
builder.Services.AddScoped<JwtTokenService>();

var resendSettings = builder.Configuration.GetSection("Resend").Get<ResendSettings>();
var smtpSettings = builder.Configuration.GetSection("Smtp").Get<SmtpSettings>();

static bool IsRealKey(string? s) =>
    !string.IsNullOrWhiteSpace(s) && !s.StartsWith("PASTE", StringComparison.OrdinalIgnoreCase);

if (resendSettings is not null && IsRealKey(resendSettings.ApiKey))
{
    builder.Services.AddSingleton(resendSettings);
    builder.Services.AddSingleton<IEmailSender, ResendEmailSender>();
}
else if (smtpSettings is not null && !string.IsNullOrWhiteSpace(smtpSettings.Host)
         && IsRealKey(smtpSettings.Password))
{
    builder.Services.AddSingleton(smtpSettings);
    builder.Services.AddSingleton<IEmailSender, SmtpEmailSender>();
}
else
{
    builder.Services.AddSingleton<IEmailSender, ConsoleEmailSender>();
}

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SigningKey)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(opts =>
{
    opts.AddDefaultPolicy(p =>
    {
        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                      ?? new[] { "http://localhost:3000" };
        p.WithOrigins(origins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services
    .AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    // Seed an admin on first boot if config provides Seed:AdminEmail + Seed:AdminPassword
    // (and no admin yet exists). Idempotent — never overwrites an existing user.
    var seedEmail = app.Configuration["Seed:AdminEmail"]?.Trim().ToLowerInvariant();
    var seedPassword = app.Configuration["Seed:AdminPassword"];
    if (!string.IsNullOrWhiteSpace(seedEmail) && !string.IsNullOrWhiteSpace(seedPassword))
    {
        var hasAdmin = db.Users.Any(u => u.Role == UserRole.Admin);
        if (!hasAdmin)
        {
            var existing = db.Users.FirstOrDefault(u => u.Email == seedEmail);
            if (existing is null)
            {
                db.Users.Add(new User
                {
                    Email = seedEmail,
                    DisplayName = app.Configuration["Seed:AdminDisplayName"] ?? "Admin",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(seedPassword),
                    Role = UserRole.Admin,
                    AcceptedRulesAt = DateTime.UtcNow,
                });
            }
            else
            {
                existing.Role = UserRole.Admin;
            }
            db.SaveChanges();
        }
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
