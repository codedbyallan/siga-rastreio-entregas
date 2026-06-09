# Multi-stage build for SIGA.Order API
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS builder

ENV DOTNET_NUGET_SIGNATURE_VERIFICATION=false

WORKDIR /

COPY . .

RUN dotnet restore "../SIGA.Order.slnx"
RUN dotnet build "src/SIGA.Order.API/SIGA.Order.API.csproj" -c Release --no-restore
RUN dotnet publish "src/SIGA.Order.API/SIGA.Order.API.csproj" -c Release -o /app/publish --no-build

FROM mcr.microsoft.com/dotnet/aspnet:10.0

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/publish .

ENV ASPNETCORE_URLS=http://+:5002
ENV ASPNETCORE_ENVIRONMENT=Development
ENV DOTNET_RUNNING_IN_CONTAINER=true

EXPOSE 5002

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5002/health || exit 1

CMD ["dotnet", "SIGA.Order.API.dll"]