# Live Carbon Intensity Dashboard

## Overview

The Live Dashboard is my attempt at real-time data visualisation and monitoring using websockets.

## How it works

- The server is set up to handle websocket connections and push updates to connected client.
- The client establishes a websocket connection to server and listens for incoming messages. When it receives a message, it updates the chart with new data.
- Data is first populated with init.sql, using docker. Then server simulates data updates every 5 seconds.

## Tech stack

Express, websocket, Chart.js, PostgreSQL, Docker
