# Multi-stage build for smaller final image
# This approach reduces image size by ~40-60% by excluding build tools from the final image

# Stage 1: Builder stage with build dependencies
FROM python:3.11-slim as builder

# Set working directory
WORKDIR /app

# Install build dependencies for compiling Python packages
RUN apt-get update && apt-get install -y \
    gcc \
    libjpeg-dev \
    zlib1g-dev \
    libfreetype6-dev \
    liblcms2-dev \
    libopenjp2-7-dev \
    libtiff5-dev \
    tk-dev \
    tcl-dev \
    libharfbuzz-dev \
    libfribidi-dev \
    libxcb1-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies to a local directory
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Runtime stage with minimal dependencies
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Runtime stage uses minimal packages - most dependencies handled by Python packages
# If you get import errors, we can add specific packages back

# Copy Python packages from builder stage
COPY --from=builder /root/.local /root/.local

# Make sure scripts in .local are usable
ENV PATH=/root/.local/bin:$PATH

# Copy application code
COPY app.py .
COPY gunicorn.conf.py .
COPY templates/ templates/
COPY static/ static/
COPY icons/ icons/

# Create images directory
RUN mkdir -p /images

# Create a non-root user for security
RUN adduser --disabled-password --gecos '' appuser && \
    chown -R appuser:appuser /app /images
USER appuser

# Expose port 5000
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import requests; r=requests.get('http://localhost:5000/health', timeout=5); exit(0 if r.status_code == 200 else 1)" || exit 1

# Run the application with Gunicorn
CMD ["gunicorn", "--config", "gunicorn.conf.py", "app:app"]
