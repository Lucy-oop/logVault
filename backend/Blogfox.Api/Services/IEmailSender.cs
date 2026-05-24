using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace Blogfox.Api.Services;

public interface IEmailSender
{
    Task SendAsync(string to, string subject, string textBody, string? htmlBody = null);
}

public class SmtpSettings
{
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromAddress { get; set; } = string.Empty;
    public string FromName { get; set; } = "LogVault";
}

/// <summary>
/// Sends real email via SMTP (Gmail by default, but works with any SMTP server).
/// Reads credentials from configuration section "Smtp".
/// </summary>
public class SmtpEmailSender : IEmailSender
{
    private readonly SmtpSettings _settings;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(SmtpSettings settings, ILogger<SmtpEmailSender> logger)
    {
        _settings = settings;
        _logger = logger;
    }

    public async Task SendAsync(string to, string subject, string textBody, string? htmlBody = null)
    {
        var msg = new MimeMessage();
        msg.From.Add(new MailboxAddress(_settings.FromName, _settings.FromAddress));
        msg.To.Add(MailboxAddress.Parse(to));
        msg.Subject = subject;

        var builder = new BodyBuilder { TextBody = textBody };
        if (!string.IsNullOrWhiteSpace(htmlBody)) builder.HtmlBody = htmlBody;
        msg.Body = builder.ToMessageBody();

        using var client = new SmtpClient();
        try
        {
            await client.ConnectAsync(_settings.Host, _settings.Port, SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(_settings.Username, _settings.Password);
            await client.SendAsync(msg);
            _logger.LogInformation("Sent email to {Recipient} via {Host}", to, _settings.Host);
        }
        finally
        {
            if (client.IsConnected) await client.DisconnectAsync(true);
        }
    }
}

public class ResendSettings
{
    public string ApiKey { get; set; } = string.Empty;
    public string FromAddress { get; set; } = "onboarding@resend.dev";
    public string FromName { get; set; } = "LogVault";
}

/// <summary>
/// Sends real email via Resend (https://resend.com) using their HTTP API.
/// Until a custom domain is verified, the from-address must be onboarding@resend.dev.
/// </summary>
public class ResendEmailSender : IEmailSender, IDisposable
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private readonly ResendSettings _settings;
    private readonly ILogger<ResendEmailSender> _logger;
    private readonly HttpClient _http;

    public ResendEmailSender(ResendSettings settings, ILogger<ResendEmailSender> logger)
    {
        _settings = settings;
        _logger = logger;
        _http = new HttpClient { BaseAddress = new Uri("https://api.resend.com/") };
        _http.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", settings.ApiKey);
    }

    public async Task SendAsync(string to, string subject, string textBody, string? htmlBody = null)
    {
        var from = string.IsNullOrWhiteSpace(_settings.FromName)
            ? _settings.FromAddress
            : $"{_settings.FromName} <{_settings.FromAddress}>";

        var payload = new
        {
            from,
            to = new[] { to },
            subject,
            text = textBody,
            html = string.IsNullOrWhiteSpace(htmlBody) ? null : htmlBody,
        };

        var json = JsonSerializer.Serialize(payload, JsonOpts);
        using var content = new StringContent(json, Encoding.UTF8, "application/json");
        var res = await _http.PostAsync("emails", content);

        if (!res.IsSuccessStatusCode)
        {
            var body = await res.Content.ReadAsStringAsync();
            _logger.LogError("Resend send failed {Status}: {Body}", (int)res.StatusCode, body);
            throw new InvalidOperationException($"Resend failed: {res.StatusCode}");
        }

        _logger.LogInformation("Sent email to {Recipient} via Resend", to);
    }

    public void Dispose() => _http.Dispose();
}

/// <summary>
/// Development fallback. Writes the email to the console so the
/// reset link can be copy-pasted into the browser without a real SMTP server.
/// </summary>
public class ConsoleEmailSender : IEmailSender
{
    public Task SendAsync(string to, string subject, string textBody, string? htmlBody = null)
    {
        var border = new string('─', 70);
        Console.WriteLine();
        Console.WriteLine(border);
        Console.WriteLine($"[EMAIL] To:      {to}");
        Console.WriteLine($"[EMAIL] Subject: {subject}");
        Console.WriteLine(border);
        Console.WriteLine(textBody);
        Console.WriteLine(border);
        return Task.CompletedTask;
    }
}
