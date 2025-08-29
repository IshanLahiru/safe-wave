# Refresh Token System Guide

## Overview
The Safe Wave backend now implements a secure JWT refresh token system.

## Token Types
- Access Token: 15 minutes lifetime
- Refresh Token: 7 days lifetime

## API Endpoints
- POST /auth/login - Get tokens
- POST /auth/refresh - Refresh tokens  
- POST /auth/logout - Blacklist tokens

## Security Features
- Token blacklisting for secure logout
- Automatic cleanup of expired tokens
- Token type verification
