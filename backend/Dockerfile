# syntax=docker/dockerfile:1
#
# Multi-stage Dockerfile for the Blogfox.Api ASP.NET Core service.
# Build it from the `backend/` directory (set Railway Root Directory to `backend`).
#
#   docker build -t blogfox-api .
#   docker run --rm -p 8080:8080 -e PORT=8080 blogfox-api

# ---------- Build stage ----------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Restore first (uses Docker layer cache when only source changes)
COPY Blogfox.sln ./
COPY Blogfox.Api/Blogfox.Api.csproj Blogfox.Api/
RUN dotnet restore Blogfox.Api/Blogfox.Api.csproj

# Copy source and publish
COPY Blogfox.Api/ Blogfox.Api/
WORKDIR /src/Blogfox.Api
RUN dotnet publish -c Release -o /app/publish --no-restore /p:UseAppHost=false

# ---------- Runtime stage ----------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish ./

# Persistent directory for uploaded cover images.
# Railway mounts a volume here when one is attached.
RUN mkdir -p /app/wwwroot/uploads

# Railway provides $PORT at runtime. Fall back to 8080 for local docker run.
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "ASPNETCORE_URLS=http://+:${PORT:-8080} dotnet Blogfox.Api.dll"]
