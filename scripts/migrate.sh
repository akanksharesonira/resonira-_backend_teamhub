#!/bin/bash
echo "Running database migrations..."
npx sequelize-cli db:migrate
