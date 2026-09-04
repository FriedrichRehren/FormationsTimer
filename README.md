<div align="center">
  <h1><code>FormationsTimer</code></h1>
  <p>Stopwatch for formation dance rehearsals: mark every checkpoint of a run, watch the countdown, and see exactly which segment ate the time. Available as a .NET MAUI app for Windows, macOS, Android and iOS, and as an installable offline PWA.</p>
  <p>
    <a href="https://github.com/FriedrichRehren/FormationsTimer/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/FriedrichRehren/FormationsTimer/actions/workflows/ci.yml/badge.svg?branch=main"></a>
    <a href="https://github.com/FriedrichRehren/FormationsTimer/actions/workflows/release.yml"><img alt="Release" src="https://github.com/FriedrichRehren/FormationsTimer/actions/workflows/release.yml/badge.svg"></a>
  </p>
  <p>
    <a href="https://hub.docker.com/r/friedrichrehren/formationstimer-web/tags"><img alt="Current Version" src="https://img.shields.io/docker/v/friedrichrehren/formationstimer-web?sort=semver&label=Current%20Version"></a>
    <a href="https://github.com/users/friedrichrehren/packages/container/package/formationstimer-web"><img alt="GHCR Pulls" src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fghcr-badge.elias.eu.org%2Fapi%2Ffriedrichrehren%2Fformationstimer-web&query=downloadCount&label=GHCR%20pulls&color=2ea44f&logo=github"></a>
    <a href="https://hub.docker.com/r/friedrichrehren/formationstimer-web"><img alt="Docker Hub Pulls" src="https://img.shields.io/docker/pulls/friedrichrehren/formationstimer-web?label=Docker%20Hub%20pulls&logo=docker&logoColor=white"></a>
    <a href="https://hub.docker.com/r/friedrichrehren/formationstimer-web"><img alt="Image Size" src="https://img.shields.io/docker/image-size/friedrichrehren/formationstimer-web/latest?label=Image%20size&logo=docker&logoColor=white"></a>
  </p>
  <p>
    <img alt="Platforms" src="https://img.shields.io/badge/Windows%20%7C%20macOS%20%7C%20Android%20%7C%20iOS%20%7C%20Web-informational">
    <img alt=".NET" src="https://img.shields.io/badge/.NET-10.0-512BD4?logo=dotnet&logoColor=white">
    <img alt="Languages" src="https://img.shields.io/badge/i18n-DE%20%7C%20EN-blue">
  </p>
</div>

## What it does

A rehearsal run is a fixed sequence of eight checkpoints, from entering the
floor to the end of the rehearsal. One large button marks the next one. The app
shows the countdown against the booked rehearsal time, how long the current
segment has been running, and — once optional per-step limits are configured —
which step went over.

| Checkpoint | Segment before it |
| --- | --- |
| Start rehearsal | — |
| Start run / Enter floor | — |
| Music start | March on |
| Main section start | Entry |
| Main section end | Main section |
| Music end | Exit |
| Leave floor | Walk-off |
| End rehearsal | — |

## Two implementations

| | [`src/FormationsTimer.UI`](src/FormationsTimer.UI) | [`src/FormationsTimer.Web`](src/FormationsTimer.Web) |
| --- | --- | --- |
| Stack | .NET 10 MAUI, CommunityToolkit.Mvvm | Plain HTML, CSS, ES modules — no build step |
| Targets | Windows, Mac Catalyst, Android, iOS | Any browser, installable, works offline |
| Extras | Space bar shortcut, responsive landscape split | Undo, run history, wake lock, export, dark mode |

Both share the same timeline, the same wording and the same palette. The PWA
additionally survives a reload mid-run, because the active run is persisted.

## Run it

**PWA, from the published image:**

```bash
docker run -d -p 8080:80 ghcr.io/friedrichrehren/formationstimer-web:latest
```

**PWA, from source:**

```bash
python -m http.server 5188 --directory src/FormationsTimer.Web
```

**MAUI app:**

```bash
dotnet build src/FormationsTimer.UI/FormationsTimer.UI.csproj -c Release -f net10.0-windows10.0.19041.0 -p:TargetFrameworks=net10.0-windows10.0.19041.0
```

The `-p:TargetFrameworks=…` override keeps restore and build to a single
platform, so only that one workload has to be installed.

## Pipeline

Pushes test, tags ship. Every push and pull request compiles all four apps and
builds the image; nothing reaches a registry or the server until a version tag
exists.

```
CI  ── on every push and pull request
├── 🌐 PWA   ── 🧪 Checks ── 🐳 Image   built and smoke-tested, never pushed
└── 📦 Apps  ── 🤖 Android · 🪟 Windows · 🖥️ macOS · 🍎 iOS

Release  ── on a v* tag
├── 🔖 Version
├── 🌐 PWA   ── 🧪 Checks ── 🐳 Image   pushed to GHCR + Docker Hub, deployed
├── 📦 Apps  ── 🤖 Android · 🪟 Windows · 🖥️ macOS · 🍎 iOS
└── 🚀 Release   every artifact attached
```

| Workflow | Trigger | Does |
| --- | --- | --- |
| [`ci.yml`](.github/workflows/ci.yml) | push, PR | Everything is tested, nothing is published |
| [`web.yml`](.github/workflows/web.yml) | called | The PWA: checks, `nginx -t`, multi-arch image, smoke test, and — only when publishing — GHCR, Docker Hub and the deploy webhook |
| [`maui.yml`](.github/workflows/maui.yml) | called | Android, Windows, Mac Catalyst and iOS in parallel, each uploading an artifact |
| [`release.yml`](.github/workflows/release.yml) | tag `v*` | The same two, then publish, deploy and cut a GitHub Release |

The MAUI project has no unit tests, so compiling every platform is the test. The
artifacts mean a pull request build can be downloaded and tried out without
cutting a release.

Cut a release with:

```bash
git tag v1.0.0 && git push origin v1.0.0
```

Details and the one-time setup are in the
[PWA README](src/FormationsTimer.Web/README.md#cicd).

## Signing

Nothing in CI is signed for distribution: Android falls back to the debug key,
the macOS bundle is ad-hoc signed and iOS is built for the simulator. Every
artifact installs after being trusted manually, but none of them is store-ready.
Making them so needs an Apple Developer ID and a release keystore in repository
secrets.
