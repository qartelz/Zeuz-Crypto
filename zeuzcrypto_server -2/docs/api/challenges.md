# Challenges API

Gamified trading challenges, rewards, and leaderboards.

**Base URL**: `/api/v1/challenges/`

## Programs & Weeks

### List Programs
- **Endpoint**: `GET /programs/`
- **Description**: List available challenge programs.

### List Weeks
- **Endpoint**: `GET /weeks/`
- **Description**: List weeks for a specific program.

### Get Week Details
- **Endpoint**: `GET /weeks/{id}/`
- **Description**: Get details of a specific challenge week including tasks.

## Participation

### List Participations
- **Endpoint**: `GET /participations/`
- **Description**: List challenges the current user is participating in.

### Join Challenge
- **Endpoint**: `POST /participations/`
- **Body**: `{ "week": "uuid" }`
- **Description**: Join a specific challenge week.

### User Progress (Real-time)
- **Endpoint**: `GET /weeks/{id}/user_progress/`
- **Description**: Get current user's progress for a specific week, including verified score and tier.

## Rewards (Achievements)

### My Rewards
- **Endpoint**: `GET /rewards/my-rewards/`
- **Description**: Get all rewards and badges earned by the user.

## Leaderboard

### Global Leaderboard
- **Endpoint**: `GET /leaderboards/`
- **Description**: Get global user rankings.
