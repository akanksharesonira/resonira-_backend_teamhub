#!/bin/bash
echo "Running database seeders..."
npx sequelize-cli db:seed:all
