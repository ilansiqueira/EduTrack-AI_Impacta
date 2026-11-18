# ai-flashcards Specification

## Purpose

Provides client-side AI flashcard generation using supported Google Gemini Flash models with configurable model selection and automatic HTTP 404 fallback resilience.

## Requirements

### Requirement: Active Gemini Flash Model Selection and Fallback
The AI flashcard service SHALL call the supported default model `gemini-3.8-flash`, allow an optional override via `VITE_GEMINI_MODEL`, and automatically retry using fallback models (`gemini-flash-latest`, `gemini-2.5-flash`, or a suggested replacement `models/<id>`) when an HTTP 404 model-unavailable error is returned.

#### Scenario: Generate flashcards with default gemini-3.8-flash model
- **WHEN** an authenticated student triggers AI flashcard generation without setting `VITE_GEMINI_MODEL`
- **THEN** the system SHALL send the generation request to `models/gemini-3.8-flash:generateContent` and parse the returned JSON cards cleanly

#### Scenario: Automatic fallback when primary Gemini model returns HTTP 404
- **WHEN** the primary Gemini model endpoint returns HTTP `404` indicating the model is unavailable or retired
- **THEN** the system SHALL automatically retry with the next supported fallback model (including any replacement `models/<id>` named in the error payload) before failing

#### Scenario: Custom model override via environment configuration
- **WHEN** `VITE_GEMINI_MODEL` is configured with a custom Gemini model identifier
- **THEN** the system SHALL prioritize the configured model as the primary endpoint before applying fallback models
