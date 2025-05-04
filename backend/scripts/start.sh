#!/bin/bash

# Function to set the environment variable based on the presence of the --test flag
set_environment() {
    if [[ "$1" == "--test" ]]; then
        export ENVIRONMENT="TEST"
    else
        export ENVIRONMENT="PROD"
    fi
}
set_environment "$1"
echo "You are running in the '$ENVIRONMENT' environment."


# Check if the .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found."
    exit 1
fi

export $(grep -v '^#' .env | xargs)

# run API bot
python telegram_bot/app.py &
PID1=$!

# run stripe payment api server
python api/app.py &
PID2=$!

# run stripe connection via CLI
# stripe listen --forward-to https://localhost:4242/webhook &
# PID3=$!


cleanup() {
    echo "Terminating background processes..."
    kill $PID1 $PID2 2>/dev/null
    exit 0
}

# Trap signals: SIGINT (Ctrl+C), SIGTERM
trap cleanup SIGINT SIGTERM

wait
