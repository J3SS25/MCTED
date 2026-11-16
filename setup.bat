@echo off
REM ==============================================================================
REM MCTEB Development Setup Shortcut for Windows
REM ==============================================================================

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup.ps1" %*
