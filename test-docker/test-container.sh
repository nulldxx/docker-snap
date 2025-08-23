#!/bin/bash

# Docker Container Test Script
# Tests the docker-snap container build and functionality

set -e  # Exit on any error

echo "🐳 Docker Container Test Suite"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
CONTAINER_NAME="docker-snap-test"
TEST_PORT="5001"
TEST_USERNAME="testuser"
TEST_PASSWORD="testpass"
TIMEOUT=30

# Cleanup function
cleanup() {
    echo -e "${YELLOW}🧹 Cleaning up test environment...${NC}"
    docker compose -f ../docker-compose.yml down --remove-orphans 2>/dev/null || true
    docker rm -f $CONTAINER_NAME 2>/dev/null || true
    rm -f cookies.txt test-response.html 2>/dev/null || true
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Set cleanup trap
trap cleanup EXIT

# Function to wait for container to be healthy
wait_for_healthy() {
    local max_attempts=30
    local attempt=1
    
    echo -e "${BLUE}⏳ Waiting for container to be healthy...${NC}"
    while [ $attempt -le $max_attempts ]; do
        if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "healthy"; then
            echo -e "${GREEN}✅ Container is healthy${NC}"
            return 0
        fi
        echo -e "${YELLOW}   Attempt $attempt/$max_attempts - waiting...${NC}"
        sleep 2
        ((attempt++))
    done
    
    echo -e "${RED}❌ Container failed to become healthy within $((max_attempts * 2)) seconds${NC}"
    return 1
}

# Test 1: Build the container
echo -e "${BLUE}📦 Test 1: Building Docker container...${NC}"
cd ..
docker compose build --no-cache
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker build successful${NC}"
else
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
fi
echo ""

# Test 2: Start the container
echo -e "${BLUE}🚀 Test 2: Starting container...${NC}"
docker compose up -d
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Container started${NC}"
else
    echo -e "${RED}❌ Container failed to start${NC}"
    exit 1
fi

# Wait for container to be healthy
wait_for_healthy

echo ""

# Test 3: Health check
echo -e "${BLUE}🩺 Test 3: Testing health endpoint...${NC}"
health_response=$(curl -s http://localhost:5000/health)
if echo "$health_response" | grep -q '"status":"healthy"'; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    echo "   Response: $health_response"
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo "   Response: $health_response"
    exit 1
fi
echo ""

# Test 4: Login page
echo -e "${BLUE}🔐 Test 4: Testing login page...${NC}"
login_response=$(curl -s -w "%{http_code}" http://localhost:5000/ -o test-response.html)
if [ "$login_response" = "200" ] || [ "$login_response" = "302" ]; then
    echo -e "${GREEN}✅ Login page accessible (HTTP $login_response)${NC}"
else
    echo -e "${RED}❌ Login page failed (HTTP $login_response)${NC}"
    exit 1
fi
echo ""

# Test 5: Authentication
echo -e "${BLUE}🔑 Test 5: Testing authentication...${NC}"
auth_response=$(curl -s -w "%{http_code}" \
    -X POST \
    -d "username=user&password=password" \
    -c cookies.txt \
    http://localhost:5000/login \
    -o /dev/null)

if [ "$auth_response" = "302" ]; then
    echo -e "${GREEN}✅ Authentication successful (HTTP $auth_response)${NC}"
else
    echo -e "${RED}❌ Authentication failed (HTTP $auth_response)${NC}"
    exit 1
fi
echo ""

# Test 6: Thumbnails API
echo -e "${BLUE}🖼️  Test 6: Testing thumbnails API...${NC}"
api_response=$(curl -s -w "%{http_code}" \
    -b cookies.txt \
    http://localhost:5000/api/thumbnails/200 \
    -o api-response.json)

if [ "$api_response" = "200" ]; then
    echo -e "${GREEN}✅ Thumbnails API working (HTTP $api_response)${NC}"
    # Check if response contains expected data
    if grep -q '"type"' api-response.json && grep -q '"path"' api-response.json; then
        echo -e "${GREEN}   Response contains expected JSON structure${NC}"
    else
        echo -e "${YELLOW}   Warning: Response may not contain expected data structure${NC}"
    fi
    rm -f api-response.json
else
    echo -e "${RED}❌ Thumbnails API failed (HTTP $api_response)${NC}"
    exit 1
fi
echo ""

# Test 7: Static JavaScript files
echo -e "${BLUE}📜 Test 7: Testing JavaScript modules...${NC}"
js_modules=("config.js" "ui-controls.js" "slideshow.js" "fullscreen.js" "gallery-loader.js" "app.js")
for module in "${js_modules[@]}"; do
    js_response=$(curl -s -w "%{http_code}" \
        http://localhost:5000/static/js/$module \
        -o /dev/null)
    
    if [ "$js_response" = "200" ]; then
        echo -e "${GREEN}   ✅ $module loaded successfully${NC}"
    else
        echo -e "${RED}   ❌ $module failed to load (HTTP $js_response)${NC}"
        exit 1
    fi
done
echo ""

# Test 8: Main gallery page (authenticated)
echo -e "${BLUE}🖥️  Test 8: Testing main gallery page...${NC}"
gallery_response=$(curl -s -w "%{http_code}" \
    -b cookies.txt \
    http://localhost:5000/ \
    -o gallery-response.html)

if [ "$gallery_response" = "200" ]; then
    echo -e "${GREEN}✅ Main gallery page accessible (HTTP $gallery_response)${NC}"
    
    # Check if all JavaScript modules are included
    missing_modules=()
    for module in "${js_modules[@]}"; do
        if ! grep -q "/static/js/$module" gallery-response.html; then
            missing_modules+=("$module")
        fi
    done
    
    if [ ${#missing_modules[@]} -eq 0 ]; then
        echo -e "${GREEN}   All JavaScript modules included in HTML${NC}"
    else
        echo -e "${YELLOW}   Warning: Missing modules: ${missing_modules[*]}${NC}"
    fi
    
    rm -f gallery-response.html
else
    echo -e "${RED}❌ Main gallery page failed (HTTP $gallery_response)${NC}"
    exit 1
fi
echo ""

# Test 9: Container logs check
echo -e "${BLUE}📋 Test 9: Checking container logs for errors...${NC}"
error_count=$(docker compose logs docker-snap 2>&1 | grep -i -c "error\|exception\|traceback" || true)
if [ "$error_count" -eq 0 ]; then
    echo -e "${GREEN}✅ No errors found in container logs${NC}"
else
    echo -e "${YELLOW}⚠️  Found $error_count potential error(s) in logs${NC}"
    echo "Recent logs:"
    docker compose logs --tail=10 docker-snap
fi
echo ""

# Test 10: Performance test
echo -e "${BLUE}⚡ Test 10: Basic performance test...${NC}"
start_time=$(date +%s%N)
perf_response=$(curl -s -w "%{http_code}" \
    -b cookies.txt \
    http://localhost:5000/api/thumbnails/200 \
    -o /dev/null)
end_time=$(date +%s%N)

response_time=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds

if [ "$perf_response" = "200" ]; then
    echo -e "${GREEN}✅ Performance test passed (${response_time}ms)${NC}"
    if [ "$response_time" -lt 1000 ]; then
        echo -e "${GREEN}   Excellent response time${NC}"
    elif [ "$response_time" -lt 3000 ]; then
        echo -e "${YELLOW}   Good response time${NC}"
    else
        echo -e "${YELLOW}   Response time could be improved${NC}"
    fi
else
    echo -e "${RED}❌ Performance test failed (HTTP $perf_response)${NC}"
    exit 1
fi
echo ""

# Final summary
echo -e "${GREEN}🎉 All tests completed successfully!${NC}"
echo ""
echo -e "${BLUE}📊 Test Summary:${NC}"
echo -e "${GREEN}✅ Docker build${NC}"
echo -e "${GREEN}✅ Container startup${NC}"
echo -e "${GREEN}✅ Health check${NC}"
echo -e "${GREEN}✅ Login page${NC}"
echo -e "${GREEN}✅ Authentication${NC}"
echo -e "${GREEN}✅ Thumbnails API${NC}"
echo -e "${GREEN}✅ JavaScript modules (${#js_modules[@]} files)${NC}"
echo -e "${GREEN}✅ Main gallery page${NC}"
echo -e "${GREEN}✅ Container logs${NC}"
echo -e "${GREEN}✅ Performance test${NC}"
echo ""
echo -e "${BLUE}🌐 Application is ready at: http://localhost:5000${NC}"
echo -e "${BLUE}🔑 Default credentials: user / password${NC}"
echo ""
echo -e "${GREEN}✨ Test suite completed successfully! ✨${NC}"