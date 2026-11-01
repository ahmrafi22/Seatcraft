FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY backend/Directory.Build.props backend/Directory.Packages.props ./
COPY backend/SeatCraft.sln ./
COPY backend/src/SeatCraft.Domain/SeatCraft.Domain.csproj src/SeatCraft.Domain/
COPY backend/src/SeatCraft.Application/SeatCraft.Application.csproj src/SeatCraft.Application/
COPY backend/src/SeatCraft.Infrastructure/SeatCraft.Infrastructure.csproj src/SeatCraft.Infrastructure/
COPY backend/src/SeatCraft.Api/SeatCraft.Api.csproj src/SeatCraft.Api/

RUN dotnet restore src/SeatCraft.Api/SeatCraft.Api.csproj

COPY backend/src/ src/

RUN dotnet publish src/SeatCraft.Api/SeatCraft.Api.csproj -c Release -o /app/publish --no-restore /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# QuestPDF resolves fonts through fontconfig; the slim base image does not ship it.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libfontconfig1 \
    && rm -rf /var/lib/apt/lists/*

RUN adduser --disabled-password --gecos "" --uid 10001 appuser
USER appuser

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "SeatCraft.Api.dll"]
