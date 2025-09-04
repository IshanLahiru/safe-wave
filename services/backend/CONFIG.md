# Safe Wave API Configuration Guide

This document explains how to configure the Safe Wave API using environment variables for secure deployment across different environments.

## 🔧 Configuration Overview

The Safe Wave API uses environment variables for all configuration to ensure:
- **Security**: No secrets in source code
- **Flexibility**: Easy deployment across environments
- **Validation**: Automatic validation of required settings

## 📁 Configuration Files

- **`.env.example`**: Template showing all available environment variables
- **`.env`**: Your local environment configuration (never commit this!)
- **`app/core/config.py`**: Configuration class with validation

## 🚀 Quick Start

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your values:**
   ```bash
   nano .env
   ```

3. **Generate secure secrets:**
   ```bash
   # Generate JWT secret key
   python -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(32))"
   ```

## 🔐 Required Environment Variables

### Database (Required)
```env
POSTGRES_PASSWORD=your_secure_password
```

### JWT Security (Required)
```env
SECRET_KEY=your_32_character_minimum_secret_key
```

### Optional but Recommended
```env
OPENROUTER_API_KEY=your_api_key    # For LLM features
SMTP_USERNAME=your_email           # For email features
SMTP_PASSWORD=your_app_password    # For email features
```

## 🌍 Environment-Specific Configuration

### Development
```env
ENVIRONMENT=development
DEBUG=true
CORS_ORIGINS=http://localhost:3000,http://localhost:8081
```

### Production
```env
ENVIRONMENT=production
DEBUG=false
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

## 🔒 Security Best Practices

### 1. Secret Generation
```bash
# JWT Secret (minimum 32 characters)
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Database Password (strong password)
python -c "import secrets; print(secrets.token_urlsafe(16))"
```

### 2. Gmail SMTP Setup
1. Enable 2-factor authentication
2. Generate an app password
3. Use the app password, not your regular password

### 3. Production Checklist
- [ ] `DEBUG=false`
- [ ] Strong `SECRET_KEY` (32+ characters)
- [ ] Secure database password
- [ ] Production domain in `CORS_ORIGINS`
- [ ] Valid SSL certificates
- [ ] Firewall configured

## 📊 Configuration Validation

The application automatically validates:
- Required environment variables are present
- Secret keys meet minimum security requirements
- Database connections are valid
- Production settings are secure

## 🚨 Common Issues

### "SECRET_KEY is required"
```bash
# Generate a secure key
python -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(32))"
```

### "POSTGRES_PASSWORD is required"
```env
POSTGRES_PASSWORD=your_secure_database_password
```

### Email not working
```env
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_gmail_app_password
```

## 🔍 Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ENVIRONMENT` | No | `development` | Environment type |
| `DEBUG` | No | `false` | Enable debug mode |
| `SECRET_KEY` | **Yes** | - | JWT secret key |
| `POSTGRES_PASSWORD` | **Yes** | - | Database password |
| `OPENROUTER_API_KEY` | No | - | LLM API key |
| `SMTP_USERNAME` | No | - | Email username |
| `SMTP_PASSWORD` | No | - | Email password |

## 🐳 Docker Configuration

When using Docker, pass environment variables:

```bash
# Using .env file
docker-compose up

# Or pass directly
docker run -e SECRET_KEY=your_key -e POSTGRES_PASSWORD=your_pass safewave-api
```

## 🔧 Advanced Configuration

### Custom Database URL
```env
DATABASE_URL=postgresql://user:pass@host:port/db
```

### Multiple CORS Origins
```env
CORS_ORIGINS=https://app.com,https://admin.app.com,https://api.app.com
```

### File Upload Limits
```env
MAX_FILE_SIZE=52428800  # 50MB in bytes
```

## 📞 Support

If you encounter configuration issues:
1. Check this documentation
2. Verify your `.env` file syntax
3. Check application logs for specific error messages
4. Ensure all required variables are set

## 🔄 Migration from Old Configuration

If upgrading from hardcoded configuration:
1. Copy `.env.example` to `.env`
2. Fill in your actual values
3. Remove any hardcoded values from code
4. Test in development before deploying
