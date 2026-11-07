$ErrorActionPreference = 'Stop'

Push-Location $PSScriptRoot
try {
    & npm.cmd run dev
    exit $LASTEXITCODE
}
finally {
    Pop-Location
}
