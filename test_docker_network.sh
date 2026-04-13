#!/bin/bash

# This script tests the internal Docker network communication for the Aadai Udai application on Ubuntu

echo -e "\033[1;36mStarting Aadai Udai Docker containers...\033[0m"
docker compose up -d

echo -e "\n\033[1;33mWaiting 5 seconds for containers to initialize...\033[0m"
sleep 5

echo -e "\n\033[1;36m--- Testing Communication: Backend to Database ---\033[0m"
# Execute a ping from backend container to db container (sending 3 packets)
docker exec aadaiudai_backend ping -c 3 db

if [ $? -eq 0 ]; then
    echo -e "\033[1;32mSuccess! Backend can communicate with DB over the internal network.\033[0m"
else
    echo -e "\033[1;31mFailed! Backend cannot reach DB.\033[0m"
fi

echo -e "\n\033[1;36m--- Testing Communication: Frontend to Backend ---\033[0m"
# Execute a ping from frontend container to backend container (sending 3 packets)
docker exec aadaiudai_frontend ping -c 3 backend

if [ $? -eq 0 ]; then
    echo -e "\033[1;32mSuccess! Frontend can communicate with Backend over the internal network.\033[0m"
else
    echo -e "\033[1;31mFailed! Frontend cannot reach Backend.\033[0m"
fi

echo -e "\n\033[1;36mNetwork test complete!\033[0m"
