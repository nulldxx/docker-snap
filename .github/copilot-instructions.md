<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# TestPilot - JIRA Integration Flask App

This is a Flask web application that provides user registration, authentication, and secure storage of JIRA API credentials.

## Project Structure
- `app.py` - Main Flask application with routes and database models
- `templates/` - HTML templates using Bootstrap for responsive UI
- `Dockerfile` - Container configuration for deployment
- `docker-compose.yml` - Multi-container deployment configuration
- `requirements.txt` - Python dependencies

## Key Features
- User registration and authentication with password hashing
- Persistent sessions using Flask sessions
- Secure storage of JIRA API keys and server URLs
- Responsive web interface with Bootstrap
- Docker containerization for easy deployment
- SQLite database (can be upgraded to PostgreSQL)

## Development Guidelines
- Follow Flask best practices for route handling and template rendering
- Use SQLAlchemy ORM for database operations
- Implement proper error handling and user feedback with flash messages
- Maintain security best practices for password hashing and session management
- Use environment variables for configuration (SECRET_KEY, DATABASE_URL)

## Security Considerations
- Passwords are hashed using Werkzeug's security functions
- JIRA API keys should be encrypted before storage (future enhancement)
- Use HTTPS in production
- Implement proper session timeout and security headers

## Future Enhancements
- Add JIRA API integration endpoints
- Implement API key encryption
- Add user roles and permissions
- Implement password reset functionality
- Add CSRF protection
- Add rate limiting
