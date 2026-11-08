# PowerShell script to push MediVault AI to GitHub
param (
    [string]$GitHubUsername = "",
    [string]$RepoName = "MediVault-AI"
)

if (-not $GitHubUsername) {
    $GitHubUsername = Read-Host "Enter your GitHub username"
}

if (-not $GitHubUsername) {
    Write-Error "GitHub username cannot be empty."
    exit 1
}

$remoteUrl = "https://github.com/$GitHubUsername/$RepoName.git"
Write-Host "Target GitHub Repository URL: $remoteUrl" -ForegroundColor Cyan

# Check if origin remote exists
$existingRemote = git remote
if ($existingRemote -contains "origin") {
    git remote remove origin
}

Write-Host "Configuring git remote 'origin'..." -ForegroundColor Yellow
git remote add origin $remoteUrl

Write-Host "Pushing 'main' branch to GitHub..." -ForegroundColor Green
Write-Host "If prompted, please sign in via your browser using Git Credential Manager." -ForegroundColor Gray
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSUCCESS! Your code has been pushed to GitHub:" -ForegroundColor Green
    Write-Host "https://github.com/$GitHubUsername/$RepoName" -ForegroundColor Cyan
} else {
    Write-Host "`nPush failed. Ensure you have created the empty repository on GitHub first at https://github.com/new" -ForegroundColor Red
}
