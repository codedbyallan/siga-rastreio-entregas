# Multi-stage build for SIGA.Delivery API
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS builder

ENV DOTNET_NUGET_SIGNATURE_VERIFICATION=false

WORKDIR /

COPY . .

RUN dotnet restore "../SIGA.Delivery.slnx"
RUN dotnet build "src/SIGA.Delivery.API/SIGA.Delivery.Api.csproj" -c Release --no-restore
RUN dotnet publish "src/SIGA.Delivery.API/SIGA.Delivery.Api.csproj" -c Release -o /app/publish --no-build

FROM mcr.microsoft.com/dotnet/aspnet:10.0

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/publish .

ENV ASPNETCORE_URLS=http://+:5003
ENV ASPNETCORE_ENVIRONMENT=Development
ENV DOTNET_RUNNING_IN_CONTAINER=true

EXPOSE 5003

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5003/health || exit 1

CMD ["dotnet", "SIGA.Delivery.Api.dll"]